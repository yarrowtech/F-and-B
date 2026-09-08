import Admin from "../models/Admin.model.js";
import Employee from "../models/Employee.model.js";
import Restaurant from "../models/Restaurant.model.js";
import SuperAdmin from "../models/superAdmin.js";
import Vendor from "../models/Vendor.model.js";
import UsageAlertState from "../models/UsageAlertState.model.js";
import { DAY_MS } from "../utils/accountUsageStatus.js";
import { isPushConfigured, sendPushToUser } from "../utils/webPush.js";

/* =========================================================
   INACTIVITY ALERTS JOB
   Scans admin / employee / vendor accounts for inactivity
   and pushes a browser notification to the people who
   should care (super admins always; the owning admin for
   their own staff and local vendors). De-duplicated via
   UsageAlertState so each idle episode alerts at most once
   per RE_ALERT_HOURS.
========================================================= */

const RE_ALERT_HOURS = Number(process.env.INACTIVITY_RE_ALERT_HOURS) || 24;

const alertDays = () =>
  Math.min(365, Math.max(1, Number(process.env.INACTIVITY_ALERT_DAYS) || 3));

const lastActive = (acc) => acc.lastActivityAt || acc.lastLoginAt || null;

/* Returns { idle:boolean, idleDays:number, reason } */
const evaluate = (acc, idleMs, now) => {
  const active = lastActive(acc);
  if (!active) {
    const ageMs = now - new Date(acc.createdAt).getTime();
    if (ageMs >= idleMs) {
      return {
        idle: true,
        idleDays: Math.floor(ageMs / DAY_MS),
        reason: "has never logged in",
      };
    }
    return { idle: false };
  }
  const sinceMs = now - new Date(active).getTime();
  if (sinceMs >= idleMs) {
    return {
      idle: true,
      idleDays: Math.floor(sinceMs / DAY_MS),
      reason: `no activity for ${Math.floor(sinceMs / DAY_MS)} days`,
    };
  }
  return { idle: false };
};

const notifyWatcher = async (watcher, account) => {
  const key = {
    watcherRole: watcher.role,
    watcherId: watcher.id,
    accountType: account.type,
    accountId: account.id,
  };

  const existing = await UsageAlertState.findOne(key).lean();
  if (
    existing &&
    Date.now() - new Date(existing.lastNotifiedAt).getTime() <
      RE_ALERT_HOURS * 60 * 60 * 1000
  ) {
    return false;
  }

  const res = await sendPushToUser(watcher.role, watcher.id, {
    title: "Inactive account",
    body: `${account.label} ${account.reason}.`,
    tag: `usage-idle-${account.type}-${account.id}`,
    url: watcher.role === "super_admin" ? "/superadmin" : "/admin",
  });

  await UsageAlertState.findOneAndUpdate(
    key,
    { $set: { lastNotifiedAt: new Date() } },
    { upsert: true, setDefaultsOnInsert: true }
  );

  return res.sent > 0;
};

/* Drop dedupe rows for accounts that are active again, so a
   future idle episode fires a fresh alert. */
const clearResolved = async (activeAccountIds) => {
  if (!activeAccountIds.length) return;
  await UsageAlertState.deleteMany({ accountId: { $in: activeAccountIds } });
};

export const runInactivityScan = async () => {
  if (!isPushConfigured()) return;

  const now = Date.now();
  const idleMs = alertDays() * DAY_MS;

  const [superAdmins, admins, employees, vendors, restaurants] =
    await Promise.all([
      SuperAdmin.find({}).select("_id").lean(),
      Admin.find({}).select("businessName adminId isActive lastLoginAt lastActivityAt createdAt").lean(),
      Employee.find({})
        .select("name employeeId role isActive restaurant createdBy lastLoginAt lastActivityAt createdAt")
        .lean(),
      Vendor.find({ vendorType: "local", createdByRole: "admin" })
        .select("name vendorId isActive loginAccess createdByAdmin lastLoginAt lastActivityAt createdAt")
        .lean(),
      Restaurant.find({}).select("admin").lean(),
    ]);

  const restaurantAdmin = new Map(
    restaurants.map((r) => [String(r._id), r.admin ? String(r.admin) : null])
  );
  const superWatchers = superAdmins.map((s) => ({
    role: "super_admin",
    id: s._id,
  }));

  const resolved = [];
  let pushed = 0;

  /* ---------- admins ---------- */
  for (const a of admins) {
    if (a.isActive === false) continue;
    const verdict = evaluate(a, idleMs, now);
    if (!verdict.idle) {
      resolved.push(a._id);
      continue;
    }
    const account = {
      type: "admin",
      id: a._id,
      label: `Admin "${a.businessName || a.adminId}"`,
      reason: verdict.reason,
    };
    for (const w of superWatchers) {
      if (await notifyWatcher(w, account)) pushed += 1;
    }
  }

  /* ---------- employees ---------- */
  for (const e of employees) {
    if (e.isActive === false) continue;
    const verdict = evaluate(e, idleMs, now);
    if (!verdict.idle) {
      resolved.push(e._id);
      continue;
    }
    const ownerAdminId =
      (e.restaurant && restaurantAdmin.get(String(e.restaurant))) ||
      (e.createdBy ? String(e.createdBy) : null);

    const account = {
      type: "employee",
      id: e._id,
      label: `${e.role || "Staff"} "${e.name}" (${e.employeeId})`,
      reason: verdict.reason,
    };

    const watchers = [...superWatchers];
    if (ownerAdminId) watchers.push({ role: "admin", id: ownerAdminId });

    for (const w of watchers) {
      if (await notifyWatcher(w, account)) pushed += 1;
    }
  }

  /* ---------- local vendors ---------- */
  for (const v of vendors) {
    if (v.isActive === false || v.loginAccess === "not_required") continue;
    const verdict = evaluate(v, idleMs, now);
    if (!verdict.idle) {
      resolved.push(v._id);
      continue;
    }
    const account = {
      type: "vendor",
      id: v._id,
      label: `Vendor "${v.name}" (${v.vendorId})`,
      reason: verdict.reason,
    };
    const watchers = [...superWatchers];
    if (v.createdByAdmin)
      watchers.push({ role: "admin", id: String(v.createdByAdmin) });

    for (const w of watchers) {
      if (await notifyWatcher(w, account)) pushed += 1;
    }
  }

  await clearResolved(resolved);

  if (pushed) {
    console.log(`🔔 Inactivity scan: sent ${pushed} push notification(s)`);
  }
};

let timer = null;

export const startInactivityAlerts = () => {
  if (!isPushConfigured()) {
    console.warn("⚠️  Inactivity alert job not started (web push not configured)");
    return;
  }
  const minutes =
    Math.max(5, Number(process.env.INACTIVITY_SCAN_INTERVAL_MINUTES) || 30);

  // first run shortly after boot, then on the interval
  setTimeout(() => {
    runInactivityScan().catch((err) =>
      console.error("Inactivity scan failed:", err.message)
    );
  }, 60 * 1000);

  timer = setInterval(() => {
    runInactivityScan().catch((err) =>
      console.error("Inactivity scan failed:", err.message)
    );
  }, minutes * 60 * 1000);

  console.log(`🔔 Inactivity alert job started (every ${minutes} min)`);
};

export const stopInactivityAlerts = () => {
  if (timer) clearInterval(timer);
  timer = null;
};
