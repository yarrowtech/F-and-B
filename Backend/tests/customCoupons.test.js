import assert from "node:assert/strict";
import test from "node:test";
import nodemailer from "nodemailer";
import Restaurant from "../models/Restaurant.model.js";
import LoyaltySettings from "../models/LoyaltySettings.model.js";
import Coupon from "../models/Coupon.model.js";
import Bill from "../models/Bill.model.js";
import controller from "../controllers/crm.Controller.js";

test("custom coupons validate recipients and keep issued codes on delivery failure", async (t) => {
  const originalEnv = { ...process.env };
  t.after(() => { process.env = originalEnv; });
  for (const key of ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "MAIL_FROM", "WHATSAPP_TOKEN", "WHATSAPP_PHONE_NUMBER_ID"]) process.env[key] = "test";
  for (const key of ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"]) delete process.env[key];
  const id = "507f1f77bcf86cd799439011";
  t.mock.method(Restaurant, "findOne", async () => ({ name: "Restaurant" }));
  t.mock.method(Restaurant, "findById", async () => ({ name: "Restaurant" }));
  t.mock.method(LoyaltySettings, "findOne", () => ({ lean: async () => ({ discountPercent: 10, couponValidityDays: 30 }) }));
  const bills = t.mock.method(Bill, "findOne", () => { throw new Error("Custom recipients must not require billing history"); });
  const created = [];
  t.mock.method(Coupon, "create", async (data) => { created.push(data); return { ...data, _id: id }; });
  const emails = [];
  t.mock.method(nodemailer, "createTransport", () => ({ sendMail: async (data) => { emails.push(data); } }));
  t.mock.method(globalThis, "fetch", async () => { throw new Error("Provider offline"); });
  const run = async (overrides = {}, user = { role: "admin", id }) => {
    const res = { code: 200, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
    await controller.issueCoupon({ params: { restaurantId: id }, user, body: {
      channel: "email", customerName: "<Guest>", customerEmail: "guest@example.com",
      reasonNote: "Birthday gift", discountPercent: 15, validityDays: 7, ...overrides,
    } }, res);
    return res;
  };

  await t.test("new email recipient receives a manual coupon with an internal reason", async () => {
    const res = await run();
    assert.equal(res.code, 201);
    assert.equal(res.data.email.sent, true);
    assert.equal(res.data.data.customerEmail, "guest@example.com");
    assert.equal(res.data.data.reason, "manual");
    assert.equal(res.data.data.reasonNote, "Birthday gift");
    assert.equal(res.data.data.discountPercent, 15);
    assert.equal(bills.mock.callCount(), 0);
    assert.match(emails[0].html, /&lt;Guest&gt;/);
    assert.equal(emails[0].text.includes("Birthday gift"), false);
    assert.ok(emails[0].text.includes(res.data.data.code));
    assert.equal(new Coupon(created[0]).validateSync(), undefined);
  });

  await t.test("manager can issue both channels and retain code after WhatsApp failure", async () => {
    const before = created.length;
    const res = await run({ channel: "both", customerPhone: "+919876543210" }, { role: "manager", restaurant: id, id });
    assert.equal(res.code, 201);
    assert.equal(created.length, before + 1);
    assert.equal(res.data.whatsapp.sent, false);
    assert.equal(res.data.email.sent, true);
    assert.equal(res.data.data.createdByModel, "Employee");
    assert.ok(res.data.data.code);
  });

  await t.test("invalid input never creates a coupon", async () => {
    const before = created.length;
    for (const overrides of [
      { reasonNote: " " }, { reasonNote: "x".repeat(501) }, { customerEmail: "invalid" },
      { channel: "both", customerPhone: "" }, { channel: "whatsapp", customerPhone: "abc" },
      { channel: "invalid" }, { discountPercent: 0 }, { discountPercent: 101 },
      { discountPercent: "NaN" }, { validityDays: 0 }, { validityDays: 366 }, { validityDays: 1.5 },
    ]) assert.equal((await run(overrides)).code, 400, JSON.stringify(overrides));
    assert.equal(created.length, before);
  });

  await t.test("another restaurant and unauthorized roles cannot issue coupons", async () => {
    const before = created.length;
    assert.equal((await run({}, { role: "manager", restaurant: "other", id })).code, 403);
    assert.equal((await run({}, { role: "waiter", restaurant: id, id })).code, 403);
    assert.equal(created.length, before);
  });
});
