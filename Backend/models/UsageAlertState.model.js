import mongoose from "mongoose";

/* =========================================================
   USAGE ALERT STATE
   Dedupe store: remembers that "watcher X was already told
   that account Y is idle", so the background job doesn't
   re-notify on every scan. Cleared when the account becomes
   active again (or re-fires after RE_ALERT_HOURS).
========================================================= */
const usageAlertStateSchema = new mongoose.Schema(
  {
    // who is being notified
    watcherRole: { type: String, required: true },
    watcherId: { type: mongoose.Schema.Types.ObjectId, required: true },
    // which dormant account the alert is about
    accountType: { type: String, required: true }, // admin | employee | vendor
    accountId: { type: mongoose.Schema.Types.ObjectId, required: true },

    lastNotifiedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

usageAlertStateSchema.index(
  { watcherRole: 1, watcherId: 1, accountType: 1, accountId: 1 },
  { unique: true }
);

export default mongoose.models.UsageAlertState ||
  mongoose.model("UsageAlertState", usageAlertStateSchema);
