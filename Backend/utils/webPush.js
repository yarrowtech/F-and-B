import webpush from "web-push";
import PushSubscription from "../models/PushSubscription.model.js";

/* =========================================================
   WEB PUSH
   Thin wrapper around the `web-push` library. Configured
   once from VAPID env vars; silently no-ops if unset.
========================================================= */

let configured = false;

export const isPushConfigured = () => configured;

export const initWebPush = () => {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

  if (!publicKey || !privateKey) {
    console.warn("⚠️  Web Push disabled: VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY not set");
    configured = false;
    return;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
  console.log("🔔 Web Push configured");
};

/* Send one payload to every device a user has registered.
   Dead subscriptions (410/404) are pruned automatically. */
export const sendPushToUser = async (role, userId, payload) => {
  if (!configured || !role || !userId) return { sent: 0, failed: 0 };

  const subs = await PushSubscription.find({
    role: String(role).toLowerCase(),
    userId,
  }).lean();

  if (!subs.length) return { sent: 0, failed: 0 };

  const body = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;
  const staleIds = [];

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          body,
          { TTL: 24 * 60 * 60 }
        );
        sent += 1;
      } catch (err) {
        failed += 1;
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          staleIds.push(sub._id);
        } else {
          console.error("Push send error:", err?.statusCode, err?.body || err?.message);
        }
      }
    })
  );

  if (staleIds.length) {
    await PushSubscription.deleteMany({ _id: { $in: staleIds } });
  }
  if (sent) {
    await PushSubscription.updateMany(
      { role: String(role).toLowerCase(), userId },
      { $set: { lastUsedAt: new Date() } }
    );
  }

  return { sent, failed };
};
