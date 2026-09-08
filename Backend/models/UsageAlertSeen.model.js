import mongoose from "mongoose";

/* =========================================================
   USAGE ALERT SEEN
   Remembers that a watcher (super admin / admin) has
   already viewed the inactivity alert for a given account,
   so the sidebar badge stops counting it. Rows are removed
   once the account becomes active again, so a fresh idle
   episode shows up as new.
========================================================= */
const usageAlertSeenSchema = new mongoose.Schema(
  {
    watcherRole: { type: String, required: true },
    watcherId: { type: mongoose.Schema.Types.ObjectId, required: true },
    accountId: { type: mongoose.Schema.Types.ObjectId, required: true },
    seenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

usageAlertSeenSchema.index(
  { watcherRole: 1, watcherId: 1, accountId: 1 },
  { unique: true }
);

export default mongoose.models.UsageAlertSeen ||
  mongoose.model("UsageAlertSeen", usageAlertSeenSchema);
