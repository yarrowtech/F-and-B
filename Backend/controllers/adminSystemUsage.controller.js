import mongoose from "mongoose";
import Admin from "../models/Admin.model.js";
import Employee from "../models/Employee.model.js";
import Restaurant from "../models/Restaurant.model.js";
import Vendor from "../models/Vendor.model.js";
import {
  DAY_MS,
  byName,
  computeStatus,
  parseIdleDays,
  roleLabel,
} from "../utils/accountUsageStatus.js";
import { applySeenState, markAlertsSeen } from "../utils/usageAlertSeen.js";

/* =========================================================
   ADMIN · SYSTEM USAGE
   Login / logout / activity for the accounts THIS admin
   created — their restaurant staff and the LOCAL vendors
   they created — plus idle-account notifications.
   Global / connected vendors are intentionally excluded.
   Scoped to req.user.id.
========================================================= */

export const getAdminSystemUsage = async (req, res) => {
  try {
    const adminId = req.user?.id;
    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const idleDays = parseIdleDays(req.query.idleDays);
    const idleMs = idleDays * DAY_MS;
    const now = Date.now();

    const restaurants = await Restaurant.find({ admin: adminId })
      .select("name")
      .lean();
    const restaurantIds = restaurants.map((r) => r._id);
    const restaurantMap = new Map(
      restaurants.map((r) => [String(r._id), r])
    );

    const [self, employees, vendors] = await Promise.all([
      Admin.findById(adminId)
        .select(
          "adminId businessName email isActive lastLoginAt lastLogoutAt lastActivityAt"
        )
        .lean(),
      Employee.find({
        $or: [
          { createdBy: adminId },
          restaurantIds.length ? { restaurant: { $in: restaurantIds } } : null,
        ].filter(Boolean),
      })
        .select(
          "employeeId name role isActive restaurant lastLoginAt lastLogoutAt lastActivityAt createdAt"
        )
        .lean(),
      Vendor.find({
        vendorType: "local",
        createdByAdmin: adminId,
        createdByRole: "admin",
      })
        .select(
          "vendorId name email vendorType isActive loginAccess createdByAdmin lastLoginAt lastLogoutAt lastActivityAt createdAt"
        )
        .lean(),
    ]);

    const notifications = [];

    /* ---------- self ---------- */
    const selfStatus = self
      ? computeStatus(self, idleMs, now)
      : { status: "never", idleDays: null };
    const selfRow = self
      ? {
          id: String(self._id),
          accountType: "admin",
          displayId: self.adminId || "—",
          name: self.businessName,
          email: self.email,
          isActive: self.isActive !== false,
          lastLoginAt: self.lastLoginAt || null,
          lastLogoutAt: self.lastLogoutAt || null,
          lastActivityAt: self.lastActivityAt || null,
          status: selfStatus.status,
          idleDays: selfStatus.idleDays,
        }
      : null;

    /* ---------- staff ---------- */
    const seenEmployee = new Set();
    const staffRows = [];
    for (const emp of employees) {
      if (seenEmployee.has(String(emp._id))) continue;
      seenEmployee.add(String(emp._id));

      const rest = emp.restaurant
        ? restaurantMap.get(String(emp.restaurant))
        : null;
      const { status, idleDays: idle } = computeStatus(emp, idleMs, now);
      const row = {
        id: String(emp._id),
        accountType: "employee",
        displayId: emp.employeeId || "—",
        employeeId: emp.employeeId || "—",
        name: emp.name,
        role: roleLabel(emp.role),
        rawRole: emp.role,
        restaurantName: rest?.name || null,
        isActive: emp.isActive !== false,
        lastLoginAt: emp.lastLoginAt || null,
        lastLogoutAt: emp.lastLogoutAt || null,
        lastActivityAt: emp.lastActivityAt || null,
        status,
        idleDays: idle,
      };
      staffRows.push(row);

      if (status === "idle" || status === "never") {
        notifications.push({
          accountType: "employee",
          id: row.id,
          name: row.name,
          displayId: row.employeeId,
          role: row.role,
          status,
          idleDays: idle,
          lastLoginAt: row.lastLoginAt,
          lastActivityAt: row.lastActivityAt,
        });
      }
    }
    staffRows.sort(byName);

    /* ---------- vendors (only local vendors this admin created) ---------- */
    const vendorRows = vendors.map((v) => {
      const { status, idleDays: idle } = computeStatus(v, idleMs, now);
      const row = {
        id: String(v._id),
        accountType: "vendor",
        displayId: v.vendorId || "—",
        name: v.name,
        email: v.email || null,
        vendorType: v.vendorType,
        loginAccess: v.loginAccess,
        relationship: "created",
        isActive: v.isActive !== false,
        lastLoginAt: v.lastLoginAt || null,
        lastLogoutAt: v.lastLogoutAt || null,
        lastActivityAt: v.lastActivityAt || null,
        status,
        idleDays: idle,
      };

      if (
        v.loginAccess !== "not_required" &&
        (status === "idle" || status === "never")
      ) {
        notifications.push({
          accountType: "vendor",
          id: row.id,
          name: row.name,
          displayId: row.displayId,
          role: "Vendor",
          status,
          idleDays: idle,
          lastLoginAt: row.lastLoginAt,
          lastActivityAt: row.lastActivityAt,
        });
      }

      return row;
    });
    vendorRows.sort(byName);

    notifications.sort((a, b) => {
      if (a.status !== b.status) return a.status === "never" ? 1 : -1;
      return (b.idleDays || 0) - (a.idleDays || 0);
    });

    const unseenCount = await applySeenState("admin", adminId, notifications);

    const trackable = [
      ...staffRows,
      ...vendorRows
        .filter((v) => v.loginAccess !== "not_required")
        .map((v) => ({ ...v, role: "Vendor" })),
    ];
    const countBy = (status) =>
      trackable.filter((a) => a.status === status).length;

    const LOGIN_WINDOW_HOURS = 24;
    const recentLogins = trackable
      .filter(
        (a) =>
          a.lastLoginAt &&
          now - new Date(a.lastLoginAt).getTime() <=
            LOGIN_WINDOW_HOURS * 60 * 60 * 1000
      )
      .sort(
        (x, y) =>
          new Date(y.lastLoginAt).getTime() - new Date(x.lastLoginAt).getTime()
      )
      .slice(0, 25)
      .map((a) => ({
        accountType: a.accountType,
        id: a.id,
        name: a.name,
        displayId: a.displayId,
        role: a.role || "",
        restaurantName: a.restaurantName || null,
        lastLoginAt: a.lastLoginAt,
        lastLogoutAt: a.lastLogoutAt,
        lastActivityAt: a.lastActivityAt,
        status: a.status,
      }));

    res.json({
      success: true,
      data: {
        idleDays,
        generatedAt: new Date().toISOString(),
        onlineWindowMinutes: 5,
        loginWindowHours: LOGIN_WINDOW_HOURS,
        self: selfRow,
        summary: {
          totalAccounts: trackable.length,
          staff: staffRows.length,
          vendors: vendorRows.length,
          onlineNow: countBy("online"),
          idleCount: countBy("idle"),
          neverLoggedIn: countBy("never"),
          notificationCount: notifications.length,
          unseenCount,
        },
        staff: staffRows,
        vendors: vendorRows,
        notifications,
        recentLogins,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const markAdminSystemUsageSeen = async (req, res) => {
  try {
    const adminId = req.user?.id;
    if (!mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const accountIds = Array.isArray(req.body?.accountIds)
      ? req.body.accountIds
      : [];
    const marked = await markAlertsSeen("admin", adminId, accountIds);
    res.json({ success: true, marked });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
