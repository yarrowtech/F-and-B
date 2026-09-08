import Admin from "../models/Admin.model.js";
import Employee from "../models/Employee.model.js";
import SuperAdmin from "../models/superAdmin.js";
import Vendor from "../models/Vendor.model.js";

/* =========================================================
   SESSION USAGE TRACKING
   Records login / logout / last-activity timestamps for
   every account type so the Super Admin "System Usage"
   screen can show who is active and who has gone idle.
========================================================= */

const EMPLOYEE_ROLES = [
  "manager",
  "inventory_manager",
  "chef",
  "suchef",
  "waiter",
  "cleaner",
  "accountant",
];

export const modelForRole = (role) => {
  const normalized = String(role || "").toLowerCase();
  if (normalized === "super_admin") return SuperAdmin;
  if (normalized === "admin") return Admin;
  if (normalized === "vendor") return Vendor;
  if (EMPLOYEE_ROLES.includes(normalized)) return Employee;
  return null;
};

export const recordLogin = async (role, id) => {
  const Model = modelForRole(role);
  if (!Model || !id) return;
  const now = new Date();
  try {
    await Model.updateOne(
      { _id: id },
      { $set: { lastLoginAt: now, lastActivityAt: now } }
    );
  } catch (err) {
    console.error("recordLogin failed:", err.message);
  }
};

export const recordLogout = async (role, id) => {
  const Model = modelForRole(role);
  if (!Model || !id) return;
  const now = new Date();
  try {
    await Model.updateOne(
      { _id: id },
      { $set: { lastLogoutAt: now, lastActivityAt: now } }
    );
  } catch (err) {
    console.error("recordLogout failed:", err.message);
  }
};

const ACTIVITY_THROTTLE_MS = 60 * 1000;

/* Fire-and-forget: keeps DB writes rare by throttling per account. */
export const touchActivity = (role, id, lastActivityAt) => {
  const Model = modelForRole(role);
  if (!Model || !id) return;
  const now = Date.now();
  if (
    lastActivityAt &&
    now - new Date(lastActivityAt).getTime() < ACTIVITY_THROTTLE_MS
  ) {
    return;
  }
  Model.updateOne({ _id: id }, { $set: { lastActivityAt: new Date(now) } }).catch(
    (err) => console.error("touchActivity failed:", err.message)
  );
};
