import assert from "node:assert/strict";
import test from "node:test";
import nodemailer from "nodemailer";
import Restaurant from "../models/Restaurant.model.js";
import Bill from "../models/Bill.model.js";
import Campaign from "../models/Campaign.model.js";
import { configureCloudinary } from "../config/cloudinary.js";
import controller from "../controllers/crm.Controller.js";
import { buildCampaignImageUrl, parseCampaignImage, verifyCampaignImageToken } from "../utils/campaignImage.js";

const id = "507f1f77bcf86cd799439011";
const image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";
const response = () => ({
  code: 200,
  status(code) { this.code = code; return this; },
  json(data) { this.data = data; return this; },
  set() { return this; },
  type(value) { this.contentType = value; return this; },
  send(data) { this.data = data; return this; },
});

test("campaign images survive Cloudinary failure with truthful delivery results", async (t) => {
  const originalEnv = { ...process.env };
  t.after(() => { process.env = originalEnv; });
  for (const key of ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET", "SMTP_HOST", "SMTP_USER", "SMTP_PASS", "MAIL_FROM", "WHATSAPP_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "JWT_SECRET"]) process.env[key] = "test";
  for (const key of ["PUBLIC_API_URL", "APP_PUBLIC_URL", "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "CAMPAIGN_IMAGE_SECRET", "CRM_CAMPAIGN_IMAGE_STORAGE"]) delete process.env[key];
  t.mock.method(Restaurant, "findOne", async () => ({ _id: id, name: "Restaurant" }));
  t.mock.method(Restaurant, "findById", async () => ({ _id: id, name: "Restaurant" }));
  t.mock.method(Bill, "aggregate", async () => [{ customerPhone: "9999999999", customerEmail: "guest@example.com" }]);
  let stored;
  t.mock.method(Campaign, "create", async (data) => {
    stored = { ...data, _id: id, save: async () => {} };
    return stored;
  });
  t.mock.method(Campaign, "findById", () => ({ select: () => ({ lean: async () => stored }) }));
  const upload = t.mock.method(configureCloudinary().uploader, "upload", async () => { throw { http_code: 403 }; });
  const emails = [];
  t.mock.method(nodemailer, "createTransport", () => ({ sendMail: async (data) => { emails.push(data); } }));
  const requests = [];
  t.mock.method(globalThis, "fetch", async (_url, options) => {
    // The database image must exist before a provider tries to fetch it.
    assert.equal(stored.imageUrl, image);
    requests.push(JSON.parse(options.body));
    return { ok: true, json: async () => ({ messages: [{ id: "test" }] }) };
  });
  const create = async (body = {}, user = { role: "admin", id }) => {
    const res = response();
    await controller.createCampaign({ params: { restaurantId: id }, user, body: { segment: "all", message: "Hello", channel: "both", imageDataUrl: image, ...body } }, res);
    return res;
  };

  await t.test("default storage skips Cloudinary even when shared credentials exist", async () => {
    const res = await create({ channel: "email" });
    assert.equal(res.code, 201);
    assert.equal(upload.mock.callCount(), 0);
    assert.equal(stored.imageUrl, image);
    assert.equal(stored.sentCount, 1);
    assert.deepEqual(emails.at(-1).attachments[0].content, parseCampaignImage(image).buffer);
  });

  await t.test("explicit Cloudinary storage falls back after a 403", async () => {
    process.env.CRM_CAMPAIGN_IMAGE_STORAGE = "cloudinary";
    const res = await create();
    assert.equal(upload.mock.callCount(), 1);
    assert.equal(res.code, 201);
    assert.equal(stored.imageUrl, image);
    assert.equal(stored.sentCount, 1);
    assert.equal(stored.recipients[0].waSent, false);
    assert.match(res.data.message, /WhatsApp image was not sent/);
    assert.equal(requests.length, 0);
    assert.match(emails[0].html, /cid:campaign-image/);
    assert.equal(emails[0].attachments[0].contentType, "image/png");
    assert.deepEqual(emails[0].attachments[0].content, parseCampaignImage(image).buffer);
    delete process.env.CRM_CAMPAIGN_IMAGE_STORAGE;
  });

  await t.test("WhatsApp only with no public URL is saved, never counted as sent", async () => {
    const res = await create({ channel: "whatsapp" });
    assert.equal(res.code, 201);
    assert.equal(stored.sentCount, 0);
    assert.equal(stored.failedCount, 1);
    assert.match(res.data.message, /Sent to 0 of 1/);
  });

  await t.test("missing Cloudinary credentials still permit image email", async () => {
    delete process.env.CLOUDINARY_API_KEY;
    const count = upload.mock.callCount();
    const res = await create({ channel: "email" });
    assert.equal(res.code, 201);
    assert.equal(upload.mock.callCount(), count);
    assert.equal(stored.sentCount, 1);
    process.env.CLOUDINARY_API_KEY = "test";
  });

  await t.test("public backend URL enables signed WhatsApp image delivery", async () => {
    process.env.PUBLIC_API_URL = "https://api.example.com";
    const res = await create({ channel: "whatsapp" }, { role: "manager", restaurant: id, id });
    assert.equal(res.code, 201);
    assert.equal(stored.sentCount, 1);
    const url = new URL(requests.at(-1).image.link);
    assert.equal(url.pathname, `/api/crm/public/campaigns/${id}/image`);
    assert.equal(verifyCampaignImageToken(id, url.searchParams.get("token")), true);
    const mediaRes = response();
    await controller.getPublicCampaignImage({ params: { campaignId: id }, query: { token: url.searchParams.get("token") } }, mediaRes);
    assert.equal(mediaRes.contentType, "image/png");
    assert.deepEqual(mediaRes.data, parseCampaignImage(image).buffer);
  });

  await t.test("media endpoint rejects missing, wrong, and cross-campaign tokens", async () => {
    const token = new URL(buildCampaignImageUrl(id)).searchParams.get("token");
    for (const [campaignId, received] of [[id, undefined], [id, "x".repeat(64)], ["507f1f77bcf86cd799439012", token]]) {
      const res = response();
      await controller.getPublicCampaignImage({ params: { campaignId }, query: { token: received } }, res);
      assert.equal(res.code, 404);
    }
    const res = response();
    stored = null;
    await controller.getPublicCampaignImage({ params: { campaignId: id }, query: { token } }, res);
    assert.equal(res.code, 404);
  });

  await t.test("validation and restaurant ownership still prevent writes", async () => {
    const count = upload.mock.callCount();
    assert.equal((await create({ imageDataUrl: "data:image/png;base64,YmFk" })).code, 400);
    assert.equal((await create({}, { role: "manager", restaurant: "other", id })).code, 403);
    assert.equal(upload.mock.callCount(), count);
    for (const base of ["http://api.example.com", "https://localhost:5000", "https://127.0.0.1", "https://192.168.1.10"]) {
      process.env.PUBLIC_API_URL = base;
      assert.equal(buildCampaignImageUrl(id), "");
    }
  });
});
