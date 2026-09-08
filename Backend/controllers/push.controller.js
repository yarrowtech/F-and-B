import PushSubscription from "../models/PushSubscription.model.js";
import { isPushConfigured, sendPushToUser } from "../utils/webPush.js";

/* =========================================================
   PUSH · SUBSCRIPTION MANAGEMENT
========================================================= */

export const getVapidPublicKey = (_req, res) => {
  res.json({
    success: true,
    configured: isPushConfigured(),
    publicKey: process.env.VAPID_PUBLIC_KEY || null,
  });
};

export const subscribe = async (req, res) => {
  try {
    const { id, role } = req.user || {};
    const sub = req.body?.subscription || req.body;

    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid subscription payload" });
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint: sub.endpoint },
      {
        role: String(role).toLowerCase(),
        userId: id,
        endpoint: sub.endpoint,
        keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
        userAgent: String(req.headers["user-agent"] || "").slice(0, 300),
        lastUsedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, message: "Subscribed to notifications" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const unsubscribe = async (req, res) => {
  try {
    const endpoint = req.body?.endpoint || req.body?.subscription?.endpoint;
    if (!endpoint) {
      return res
        .status(400)
        .json({ success: false, message: "endpoint is required" });
    }
    await PushSubscription.deleteOne({ endpoint });
    res.json({ success: true, message: "Unsubscribed" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendTestPush = async (req, res) => {
  try {
    const { id, role } = req.user || {};
    const result = await sendPushToUser(role, id, {
      title: "Test notification",
      body: "Browser alerts are working on this device.",
      tag: "usage-test",
      url: "/",
    });
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
