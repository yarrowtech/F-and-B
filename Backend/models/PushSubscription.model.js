import mongoose from "mongoose";

/* =========================================================
   PUSH SUBSCRIPTION
   One document per browser/device that opted in to
   inactivity alerts. `endpoint` is unique per device.
========================================================= */
const pushSubscriptionSchema = new mongoose.Schema(
  {
    role: { type: String, required: true, lowercase: true, index: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    userAgent: { type: String, default: "" },
    lastUsedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

pushSubscriptionSchema.index({ role: 1, userId: 1 });

export default mongoose.models.PushSubscription ||
  mongoose.model("PushSubscription", pushSubscriptionSchema);
