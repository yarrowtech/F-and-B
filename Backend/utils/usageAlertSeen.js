import mongoose from "mongoose";
import UsageAlertSeen from "../models/UsageAlertSeen.model.js";

/* =========================================================
   USAGE ALERT · SEEN STATE
   Marks each notification with `seen`, prunes rows for
   accounts that are no longer idle, and returns the unseen
   count used by the sidebar badge.
========================================================= */

export const applySeenState = async (watcherRole, watcherId, notifications) => {
  const ids = notifications
    .map((n) => n.id)
    .filter((id) => mongoose.Types.ObjectId.isValid(id));

  const [rows] = await Promise.all([
    UsageAlertSeen.find({
      watcherRole,
      watcherId,
      accountId: { $in: ids },
    }).lean(),
    // drop "seen" rows for accounts that became active again
    UsageAlertSeen.deleteMany({
      watcherRole,
      watcherId,
      accountId: { $nin: ids },
    }),
  ]);

  const seenSet = new Set(rows.map((r) => String(r.accountId)));

  let unseen = 0;
  for (const n of notifications) {
    n.seen = seenSet.has(String(n.id));
    if (!n.seen) unseen += 1;
  }
  return unseen;
};

export const markAlertsSeen = async (watcherRole, watcherId, accountIds) => {
  const now = new Date();
  const ops = (Array.isArray(accountIds) ? accountIds : [])
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((accountId) => ({
      updateOne: {
        filter: { watcherRole, watcherId, accountId },
        update: { $set: { seenAt: now } },
        upsert: true,
      },
    }));

  if (ops.length) {
    await UsageAlertSeen.bulkWrite(ops, { ordered: false });
  }
  return ops.length;
};
