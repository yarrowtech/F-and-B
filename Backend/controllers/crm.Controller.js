import crypto from "crypto";
import { configureCloudinary } from "../config/cloudinary.js";
import { parseCampaignImage, buildCampaignImageUrl, verifyCampaignImageToken } from "../utils/campaignImage.js";
import mongoose from "mongoose";
import Bill from "../models/Bill.model.js";
import Feedback from "../models/Feedback.model.js";
import Reservation from "../models/Reservation.model.js";
import CrmNote from "../models/CrmNote.model.js";
import Campaign from "../models/Campaign.model.js";
import Coupon from "../models/Coupon.model.js";
import LoyaltySettings from "../models/LoyaltySettings.model.js";
import Restaurant from "../models/Restaurant.model.js";
import logger from "../utils/pinoLogger.js";
import {
  isWhatsAppConfigured,
  isTwilioWhatsAppConfigured,
  sendTwilioWhatsAppMessage,
  sendWhatsAppTextMessage,
} from "../utils/whatsapp.service.js";
import { isMailerConfigured, sendCampaignEmail, sendCouponEmail } from "../utils/mailer.js";

const ensureRestaurantAccess = async (req, restaurantId) => {
  if (req.user.role === "admin") {
    return Restaurant.findOne({ _id: restaurantId, admin: req.user.id });
  }
  if (req.user.role === "manager") {
    if (String(req.user.restaurant) !== String(restaurantId)) return null;
    return Restaurant.findById(restaurantId);
  }
  return null;
};

const hasValue = (field) => ({ $and: [{ $ne: [field, null] }, { $ne: [field, ""] }] });

// A customer is identified by phone when available, falling back to email
// (prefixed so the two id spaces never collide) — this lets email-only
// customers (no phone captured at billing) still show up in the CRM.
const EMAIL_KEY_PREFIX = "email:";

const getAggregatedCustomers = async (restaurantObjectId) =>
  Bill.aggregate([
    {
      $match: {
        restaurant: restaurantObjectId,
        $or: [{ customerPhone: { $nin: [null, ""] } }, { customerEmail: { $nin: [null, ""] } }],
      },
    },
    {
      $addFields: {
        customerKey: {
          $cond: [
            hasValue("$customerPhone"),
            "$customerPhone",
            { $concat: [EMAIL_KEY_PREFIX, "$customerEmail"] },
          ],
        },
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$customerKey",
        customerName: { $first: "$customerName" },
        customerEmail: { $first: "$customerEmail" },
        customerPhone: { $first: "$customerPhone" },
        totalVisits: { $sum: 1 },
        totalSpend: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "PAID"] }, "$totalAmount", 0] },
        },
        lastVisit: { $max: "$createdAt" },
      },
    },
    { $sort: { lastVisit: -1 } },
  ]);

// Turns a customer key back into a Mongo filter fragment for Bill/Feedback,
// which store phone and email as separate fields.
const matchByCustomerKey = (key) => {
  if (String(key || "").startsWith(EMAIL_KEY_PREFIX)) {
    return { customerEmail: key.slice(EMAIL_KEY_PREFIX.length) };
  }
  return { customerPhone: key };
};

/* ===============================
   GET CUSTOMER LIST (aggregated from bills)
=============================== */
const getCustomers = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { search = "" } = req.query;

    const restaurant = await ensureRestaurantAccess(req, restaurantId);
    if (!restaurant) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const restaurantObjectId = new mongoose.Types.ObjectId(restaurantId);
    const customers = await getAggregatedCustomers(restaurantObjectId);

    const filtered = search
      ? customers.filter((c) => {
          const term = search.toLowerCase();
          return (
            String(c._id || "").includes(search) ||
            String(c.customerName || "").toLowerCase().includes(term) ||
            String(c.customerEmail || "").toLowerCase().includes(term)
          );
        })
      : customers;

    // Pull average feedback rating per customer (phone or email) in one pass
    const feedbackAverages = await Feedback.aggregate([
      {
        $match: {
          restaurant: restaurantObjectId,
          $or: [{ customerPhone: { $nin: [null, ""] } }, { customerEmail: { $nin: [null, ""] } }],
        },
      },
      {
        $addFields: {
          customerKey: {
            $cond: [
              hasValue("$customerPhone"),
              "$customerPhone",
              { $concat: [EMAIL_KEY_PREFIX, "$customerEmail"] },
            ],
          },
        },
      },
      {
        $group: {
          _id: "$customerKey",
          averageRating: { $avg: "$rating" },
          feedbackCount: { $sum: 1 },
        },
      },
    ]);
    const feedbackByKey = new Map(feedbackAverages.map((f) => [f._id, f]));

    const data = filtered.map((c) => ({
      id: c._id,
      phone: c.customerPhone || "",
      email: c.customerEmail || "",
      name: c.customerName || "Guest",
      totalVisits: c.totalVisits,
      totalSpend: c.totalSpend,
      lastVisit: c.lastVisit,
      averageRating: feedbackByKey.get(c._id)?.averageRating
        ? Number(feedbackByKey.get(c._id).averageRating.toFixed(2))
        : null,
      feedbackCount: feedbackByKey.get(c._id)?.feedbackCount || 0,
    }));

    res.json({ success: true, data });
  } catch (err) {
    logger.error({ err }, "Failed to load CRM customers");
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ===============================
   GET SINGLE CUSTOMER DETAIL
=============================== */
const getCustomerDetail = async (req, res) => {
  try {
    const { restaurantId, phone: key } = req.params;

    const restaurant = await ensureRestaurantAccess(req, restaurantId);
    if (!restaurant) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const isEmailKey = key.startsWith(EMAIL_KEY_PREFIX);
    const keyMatch = matchByCustomerKey(key);

    const [bills, feedback, reservations, notes] = await Promise.all([
      Bill.find({ restaurant: restaurantId, ...keyMatch })
        .sort({ createdAt: -1 })
        .select("billNo totalAmount paymentStatus createdAt paidAt customerPhone customerEmail")
        .lean(),
      Feedback.find({ restaurant: restaurantId, ...keyMatch })
        .sort({ createdAt: -1 })
        .select("rating serviceRating ambianceRating comment createdAt")
        .lean(),
      // Reservations only carry a phone field, so an email-only customer has none.
      isEmailKey
        ? []
        : Reservation.find({ restaurant: restaurantId, phone: key })
            .sort({ bookingTime: -1 })
            .select("partySize bookingTime status notes")
            .lean(),
      CrmNote.find({ restaurant: restaurantId, customerPhone: key })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const name = bills[0]?.customerName || "Guest";

    res.json({
      success: true,
      data: {
        phone: bills[0]?.customerPhone || "",
        email: bills[0]?.customerEmail || (isEmailKey ? key.slice(EMAIL_KEY_PREFIX.length) : ""),
        name,
        bills,
        feedback,
        reservations,
        notes,
      },
    });
  } catch (err) {
    logger.error({ err }, "Failed to load CRM customer detail");
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ===============================
   ADD A NOTE FOR A CUSTOMER
=============================== */
const addCustomerNote = async (req, res) => {
  try {
    const { restaurantId, phone } = req.params;
    const { note } = req.body;

    const restaurant = await ensureRestaurantAccess(req, restaurantId);
    if (!restaurant) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const trimmed = String(note || "").trim();
    if (!trimmed) {
      return res.status(400).json({ success: false, message: "Note cannot be empty" });
    }

    const created = await CrmNote.create({
      restaurant: restaurantId,
      customerPhone: phone,
      note: trimmed,
      createdBy: req.user.id,
      createdByModel: req.user.role === "admin" ? "Admin" : "Employee",
      createdByName: req.user.name || "",
    });

    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ===============================
   DELETE A NOTE
=============================== */
const deleteCustomerNote = async (req, res) => {
  try {
    const { restaurantId, noteId } = req.params;

    const restaurant = await ensureRestaurantAccess(req, restaurantId);
    if (!restaurant) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const deleted = await CrmNote.findOneAndDelete({ _id: noteId, restaurant: restaurantId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    res.json({ success: true, message: "Note deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ===============================
   CAMPAIGNS · SEGMENT RESOLUTION
=============================== */
const resolveSegment = (customers, { segment, minVisits, inactiveDays }) => {
  const now = Date.now();
  if (segment === "repeat") {
    const threshold = Number(minVisits) || 2;
    return customers.filter((c) => c.totalVisits >= threshold);
  }
  if (segment === "inactive") {
    const days = Number(inactiveDays) || 30;
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    return customers.filter((c) => new Date(c.lastVisit).getTime() < cutoff);
  }
  return customers; // "all"
};

const sendWhatsAppMessageWithFallback = async ({ to, message, mediaUrl = "" }) => {
  if (isTwilioWhatsAppConfigured()) {
    return sendTwilioWhatsAppMessage({ to, message, mediaUrl });
  }
  if (isWhatsAppConfigured()) {
    return sendWhatsAppTextMessage({ to, message, mediaUrl });
  }
  return { sent: false, reason: "WhatsApp is not configured on the server." };
};

/* ===============================
   CAMPAIGNS · LIST
=============================== */
// Only the image is public, and only with a purpose-specific signed token.
const getPublicCampaignImage = async (req, res) => {
  const { campaignId } = req.params;
  if (!/^[a-f0-9]{24}$/i.test(campaignId) || !verifyCampaignImageToken(campaignId, req.query.token)) {
    return res.status(404).json({ success: false, message: "Image not found" });
  }
  try {
    const campaign = await Campaign.findById(campaignId).select("imageUrl").lean();
    const image = parseCampaignImage(campaign?.imageUrl);
    if (!image) return res.status(404).json({ success: false, message: "Image not found" });
    res.set("Cache-Control", "private, max-age=300");
    res.set("X-Content-Type-Options", "nosniff");
    return res.type(image.contentType).send(image.buffer);
  } catch {
    return res.status(500).json({ success: false, message: "Unable to load image" });
  }
};

const getCampaigns = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const restaurant = await ensureRestaurantAccess(req, restaurantId);
    if (!restaurant) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const campaigns = await Campaign.find({ restaurant: restaurantId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: campaigns });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ===============================
   CAMPAIGNS · CREATE & SEND
=============================== */
const createCampaign = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { segment, minVisits, inactiveDays, message, channel, imageDataUrl } = req.body;

    const restaurant = await ensureRestaurantAccess(req, restaurantId);
    if (!restaurant) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const trimmedMessage = String(message || "").trim();
    if (!trimmedMessage) {
      return res.status(400).json({ success: false, message: "Campaign message is required" });
    }
    if (trimmedMessage.length > 1000) {
      return res.status(400).json({ success: false, message: "Campaign message must be at most 1000 characters" });
    }
    if (!["all", "repeat", "inactive"].includes(segment)) {
      return res.status(400).json({ success: false, message: "Invalid segment" });
    }
    const finalChannel = ["whatsapp", "email", "both"].includes(channel) ? channel : "whatsapp";
    const wantsWhatsApp = finalChannel === "whatsapp" || finalChannel === "both";
    const wantsEmail = finalChannel === "email" || finalChannel === "both";

    const restaurantObjectId = new mongoose.Types.ObjectId(restaurantId);
    const customers = await getAggregatedCustomers(restaurantObjectId);
    const targeted = resolveSegment(customers, { segment, minVisits, inactiveDays });

    let imageUrl = "";
    let imagePublicId = "";
    if (imageDataUrl) {
      if (!parseCampaignImage(imageDataUrl)) {
        return res.status(400).json({ success: false, message: "Choose a valid JPG or PNG image up to 1 MB" });
      }
      // Campaigns use MongoDB by default. Shared Cloudinary credentials may
      // belong to other features and do not opt campaigns into cloud uploads.
      imageUrl = imageDataUrl;
      const useCloudinary = String(process.env.CRM_CAMPAIGN_IMAGE_STORAGE || "mongodb").trim().toLowerCase() === "cloudinary";
      if (useCloudinary && process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
        try {
          const uploaded = await configureCloudinary().uploader.upload(imageDataUrl, {
            folder: `crm-campaigns/${restaurantId}`,
            resource_type: "image",
            allowed_formats: ["jpg", "png"],
            timeout: 15000,
          });
          if (!uploaded.secure_url) throw new Error("Image URL missing");
          imageUrl = uploaded.secure_url;
          imagePublicId = uploaded.public_id;
        } catch (err) {
          logger.warn({ status: err?.http_code }, "Cloudinary unavailable; storing campaign image in MongoDB");
        }
      }
    }

    const waConfigured = isTwilioWhatsAppConfigured() || isWhatsAppConfigured();
    const mailConfigured = isMailerConfigured();
    const deliverable = (wantsWhatsApp && waConfigured) || (wantsEmail && mailConfigured);

    const recipients = [];
    let sentCount = 0;
    let failedCount = 0;

    const campaign = await Campaign.create({
      restaurant: restaurantId,
      message: trimmedMessage,
      imageUrl,
      imagePublicId,
      segment,
      channel: finalChannel,
      segmentParams: {
        minVisits: Number(minVisits) || 2,
        inactiveDays: Number(inactiveDays) || 30,
      },
      recipients: [],
      recipientCount: targeted.length,
      sentCount: 0,
      failedCount: 0,
      deliverable,
      createdBy: req.user.id,
      createdByModel: req.user.role === "admin" ? "Admin" : "Employee",
    });

    const mediaUrl = imageUrl.startsWith("data:") ? buildCampaignImageUrl(campaign._id) : imageUrl;
    const mediaUnavailable = Boolean(imageUrl && !mediaUrl);

    for (const customer of targeted) {
      const recipient = {
        phone: customer.customerPhone || "",
        email: customer.customerEmail || "",
        name: customer.customerName || "Guest",
        waAttempted: false,
        waSent: false,
        waError: "",
        mailAttempted: false,
        mailSent: false,
        mailError: "",
      };

      let anySucceeded = false;

      if (wantsWhatsApp) {
        recipient.waAttempted = true;
        if (!customer.customerPhone) {
          recipient.waError = "No phone on file";
        } else if (!waConfigured) {
          recipient.waError = "WhatsApp delivery is not configured on the server";
        } else if (mediaUnavailable) {
          recipient.waError = "WhatsApp image was not sent: set PUBLIC_API_URL to a publicly reachable HTTPS backend URL and configure JWT_SECRET, or enable Cloudinary campaign storage with upload access";
        } else {
          try {
            const result = await sendWhatsAppMessageWithFallback({
              to: customer.customerPhone,
              message: trimmedMessage,
              mediaUrl,
            });
            recipient.waSent = result.sent;
            recipient.waError = result.sent ? "" : result.reason || "Failed to send";
            if (result.sent) anySucceeded = true;
          } catch {
            recipient.waError = "WhatsApp delivery failed. Please check the messaging service connection";
          }
        }
      }

      if (wantsEmail) {
        recipient.mailAttempted = true;
        if (!customer.customerEmail) {
          recipient.mailError = "No email on file";
        } else if (!mailConfigured) {
          recipient.mailError = "Email not configured";
        } else {
          try {
            await sendCampaignEmail({
              to: customer.customerEmail,
              restaurantName: restaurant.name,
              message: trimmedMessage,
              imageUrl,
            });
            recipient.mailSent = true;
            anySucceeded = true;
          } catch (err) {
            recipient.mailError = err.message || "Failed to send";
          }
        }
      }

      if (anySucceeded) sentCount += 1;
      else failedCount += 1;
      recipients.push(recipient);
    }

    const deliveryWarnings = [...new Set(recipients.flatMap((recipient) => [recipient.waError, recipient.mailError]).filter(Boolean))];
    Object.assign(campaign, { recipients, sentCount, failedCount, deliveryWarnings });
    await campaign.save();

    res.status(201).json({
      success: true,
      message: `Campaign saved. Sent to ${sentCount} of ${targeted.length} customers.${deliveryWarnings.length ? ` Delivery issues: ${deliveryWarnings.join("; ")}.` : ""}`,
      data: campaign,
    });
  } catch (err) {
    logger.error({ err }, "Failed to create campaign");
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ===============================
   CAMPAIGNS · DELETE
=============================== */
const deleteCampaign = async (req, res) => {
  try {
    const { restaurantId, campaignId } = req.params;

    const restaurant = await ensureRestaurantAccess(req, restaurantId);
    if (!restaurant) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const deleted = await Campaign.findOneAndDelete({ _id: campaignId, restaurant: restaurantId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Campaign not found" });
    }

    res.json({ success: true, message: "Campaign deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ===============================
   LOYALTY · GET SETTINGS
=============================== */
const getLoyaltySettings = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const restaurant = await ensureRestaurantAccess(req, restaurantId);
    if (!restaurant) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const settings = (await LoyaltySettings.findOne({ restaurant: restaurantId }).lean()) || {
      enabled: false,
      minVisits: 3,
      discountPercent: 10,
      couponValidityDays: 30,
    };

    res.json({ success: true, data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ===============================
   LOYALTY · UPDATE SETTINGS (admin, manager)
=============================== */
const updateLoyaltySettings = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const restaurant = await ensureRestaurantAccess(req, restaurantId);
    if (!restaurant) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const { enabled, minVisits, discountPercent, couponValidityDays } = req.body;
    const updates = {};
    if (typeof enabled === "boolean") updates.enabled = enabled;
    if (minVisits !== undefined) {
      const num = Number(minVisits);
      if (!num || num < 2) {
        return res.status(400).json({ success: false, message: "Minimum visits must be at least 2" });
      }
      updates.minVisits = num;
    }
    if (discountPercent !== undefined) {
      const num = Number(discountPercent);
      if (!num || num < 1 || num > 100) {
        return res.status(400).json({ success: false, message: "Discount percent must be between 1 and 100" });
      }
      updates.discountPercent = num;
    }
    if (couponValidityDays !== undefined) {
      const num = Number(couponValidityDays);
      if (!num || num < 1) {
        return res.status(400).json({ success: false, message: "Coupon validity must be at least 1 day" });
      }
      updates.couponValidityDays = num;
    }

    const settings = await LoyaltySettings.findOneAndUpdate(
      { restaurant: restaurantId },
      { $set: updates, $setOnInsert: { restaurant: restaurantId } },
      { new: true, upsert: true }
    ).lean();

    res.json({ success: true, message: "Loyalty settings updated", data: settings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ===============================
   COUPONS · LIST
=============================== */
const getCoupons = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const restaurant = await ensureRestaurantAccess(req, restaurantId);
    if (!restaurant) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const coupons = await Coupon.find({ restaurant: restaurantId })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, data: coupons });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ===============================
   COUPONS · ISSUE ONE FOR A CUSTOMER
=============================== */
const generateCouponCode = () => `LOYAL-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

const issueCoupon = async (req, res) => {
  try {
    const { restaurantId, phone: key } = req.params;
    const { discountPercent, validityDays, channel } = req.body;
    const manual = !key;
    const phone = String(req.body.customerPhone || "").trim();
    const email = String(req.body.customerEmail || "").trim().toLowerCase();
    const customerName = String(req.body.customerName || "").trim();
    const reasonNote = String(req.body.reasonNote || "").trim();

    const restaurant = await ensureRestaurantAccess(req, restaurantId);
    if (!restaurant) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const loyaltySettings = (await LoyaltySettings.findOne({ restaurant: restaurantId }).lean()) || {
      discountPercent: 10,
      couponValidityDays: 30,
    };

    const finalDiscount = discountPercent === undefined ? loyaltySettings.discountPercent : Number(discountPercent);
    if (!Number.isFinite(finalDiscount) || finalDiscount < 1 || finalDiscount > 100) {
      return res.status(400).json({ success: false, message: "Discount percent must be between 1 and 100" });
    }
    const finalValidityDays = validityDays === undefined ? loyaltySettings.couponValidityDays : Number(validityDays);
    if (!Number.isInteger(finalValidityDays) || finalValidityDays < 1 || finalValidityDays > 365) {
      return res.status(400).json({ success: false, message: "Coupon validity must be between 1 and 365 whole days" });
    }
    if (manual && !["whatsapp", "email", "both"].includes(channel)) {
      return res.status(400).json({ success: false, message: "Choose a delivery channel" });
    }
    const finalChannel = ["whatsapp", "email", "both"].includes(channel) ? channel : "whatsapp";
    const wantsWhatsApp = finalChannel === "whatsapp" || finalChannel === "both";
    const wantsEmail = finalChannel === "email" || finalChannel === "both";

    if (manual) {
      if (!reasonNote || reasonNote.length > 500 || customerName.length > 100) {
        return res.status(400).json({ success: false, message: "Enter a reason (up to 500 characters) and a name of at most 100 characters" });
      }
      if ((wantsWhatsApp && !phone) || (phone && !/^\+?[1-9]\d{7,14}$/.test(phone))) {
        return res.status(400).json({ success: false, message: "Enter a valid WhatsApp number with country code, e.g. +919876543210" });
      }
      if ((wantsEmail && !email) || (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)))) {
        return res.status(400).json({ success: false, message: "Enter a valid email address" });
      }
    }

    const latestBill = manual ? { customerPhone: phone, customerEmail: email, customerName } : await Bill.findOne({ restaurant: restaurantId, ...matchByCustomerKey(key) })
      .sort({ createdAt: -1 })
      .select("customerName customerEmail customerPhone")
      .lean();

    const expiresAt = new Date(Date.now() + finalValidityDays * 24 * 60 * 60 * 1000);

    const coupon = await Coupon.create({
      restaurant: restaurantId,
      code: generateCouponCode(),
      customerPhone: manual ? phone : key,
      customerEmail: latestBill?.customerEmail || "",
      reasonNote: manual ? reasonNote : "",
      discountPercent: finalDiscount,
      customerName: latestBill?.customerName || "",
      reason: manual ? "manual" : "loyalty",
      expiresAt,
      createdBy: req.user.id,
      createdByModel: req.user.role === "admin" ? "Admin" : "Employee",
    });

    let whatsappResult = null;
    let emailResult = null;

    if (wantsWhatsApp) {
      const customerPhone = latestBill?.customerPhone || "";
      if (!customerPhone) {
        whatsappResult = { sent: false, reason: "No phone number on file for this customer" };
      } else {
        const message = [
          `You've earned a special discount!`,
          `Use code ${coupon.code} for ${finalDiscount}% off your next visit.`,
          `Valid until ${expiresAt.toLocaleDateString()}.`,
        ].join("\n");
        try {
          whatsappResult = await sendWhatsAppMessageWithFallback({ to: customerPhone, message });
        } catch {
          whatsappResult = { sent: false, reason: "WhatsApp delivery failed. The coupon was still created." };
        }
      }
    }

    if (wantsEmail) {
      const customerEmail = latestBill?.customerEmail || "";
      if (!customerEmail) {
        emailResult = { sent: false, reason: "No email on file for this customer" };
      } else if (!isMailerConfigured()) {
        emailResult = { sent: false, reason: "Email not configured" };
      } else {
        try {
          await sendCouponEmail({
            to: customerEmail,
            restaurantName: restaurant.name,
            customerName: coupon.customerName,
            code: coupon.code,
            discountPercent: finalDiscount,
            expiresAt,
          });
          emailResult = { sent: true };
        } catch (err) {
          emailResult = { sent: false, reason: err.message || "Failed to send" };
        }
      }
    }

    res.status(201).json({
      success: true,
      message: "Coupon issued",
      data: coupon,
      whatsapp: whatsappResult,
      email: emailResult,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "Coupon code collision, please retry" });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

export default {
  getPublicCampaignImage,
  getCustomers,
  getCustomerDetail,
  addCustomerNote,
  deleteCustomerNote,
  getCampaigns,
  createCampaign,
  deleteCampaign,
  getLoyaltySettings,
  updateLoyaltySettings,
  getCoupons,
  issueCoupon,
};
