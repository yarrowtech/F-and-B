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

/* =========================================================
   SUPER ADMIN · SYSTEM USAGE
   Login / logout / activity overview for admin & vendor
   accounts (with each admin's employees nested under it),
   plus idle-account notifications.
========================================================= */

export const getSystemUsage = async (req, res) => {
  try {
    const idleDays = parseIdleDays(req.query.idleDays);
    const idleMs = idleDays * DAY_MS;
    const now = Date.now();

    const [admins, employees, vendors, restaurants] = await Promise.all([
      Admin.find({})
        .select(
          "adminId businessName email isActive lastLoginAt lastLogoutAt lastActivityAt createdAt"
        )
        .lean(),
      Employee.find({})
        .select(
          "employeeId name role isActive restaurant createdBy lastLoginAt lastLogoutAt lastActivityAt createdAt"
        )
        .lean(),
      Vendor.find({})
        .select(
          "vendorId name email vendorType isActive loginAccess createdByRole createdByAdmin lastLoginAt lastLogoutAt lastActivityAt createdAt"
        )
        .lean(),
      Restaurant.find({}).select("name admin").lean(),
    ]);

    const restaurantMap = new Map(
      restaurants.map((r) => [String(r._id), r])
    );

    /* Group employees under the admin that owns their restaurant. */
    const employeesByAdmin = new Map();
    for (const emp of employees) {
      const rest = emp.restaurant
        ? restaurantMap.get(String(emp.restaurant))
        : null;
      const ownerId = rest?.admin
        ? String(rest.admin)
        : emp.createdBy
        ? String(emp.createdBy)
        : "unassigned";

      const { status, idleDays: idle } = computeStatus(emp, idleMs, now);
      const row = {
        id: String(emp._id),
        accountType: "employee",
        employeeId: emp.employeeId || "—",
        displayId: emp.employeeId || "—",
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

      if (!employeesByAdmin.has(ownerId)) employeesByAdmin.set(ownerId, []);
      employeesByAdmin.get(ownerId).push(row);
    }

    const notifications = [];

    const adminRows = admins.map((a) => {
      const { status, idleDays: idle } = computeStatus(a, idleMs, now);
      const emps = (employeesByAdmin.get(String(a._id)) || []).sort(byName);

      const row = {
        id: String(a._id),
        accountType: "admin",
        displayId: a.adminId || "—",
        name: a.businessName,
        email: a.email,
        isActive: a.isActive !== false,
        lastLoginAt: a.lastLoginAt || null,
        lastLogoutAt: a.lastLogoutAt || null,
        lastActivityAt: a.lastActivityAt || null,
        status,
        idleDays: idle,
        employees: emps,
      };

      if (status === "idle" || status === "never") {
        notifications.push({
          accountType: "admin",
          id: row.id,
          name: row.name,
          displayId: row.displayId,
          role: "Admin",
          status,
          idleDays: idle,
          lastLoginAt: row.lastLoginAt,
          lastActivityAt: row.lastActivityAt,
        });
      }

      for (const e of emps) {
        if (e.status === "idle" || e.status === "never") {
          notifications.push({
            accountType: "employee",
            id: e.id,
            name: e.name,
            displayId: e.employeeId,
            role: e.role,
            parentAdmin: row.name,
            status: e.status,
            idleDays: e.idleDays,
            lastLoginAt: e.lastLoginAt,
            lastActivityAt: e.lastActivityAt,
          });
        }
      }

      return row;
    });
    adminRows.sort(byName);

    const knownAdminIds = new Set(admins.map((a) => String(a._id)));
    const orphanEmployees = [];
    for (const [ownerId, emps] of employeesByAdmin.entries()) {
      if (!knownAdminIds.has(ownerId)) orphanEmployees.push(...emps);
    }
    orphanEmployees.sort(byName);
    for (const e of orphanEmployees) {
      if (e.status === "idle" || e.status === "never") {
        notifications.push({
          accountType: "employee",
          id: e.id,
          name: e.name,
          displayId: e.employeeId,
          role: e.role,
          parentAdmin: null,
          status: e.status,
          idleDays: e.idleDays,
          lastLoginAt: e.lastLoginAt,
          lastActivityAt: e.lastActivityAt,
        });
      }
    }

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
        createdByRole: v.createdByRole,
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

    const trackableAccounts = [
      ...adminRows,
      ...adminRows.flatMap((a) => a.employees),
      ...orphanEmployees,
      ...vendorRows.filter((v) => v.loginAccess !== "not_required"),
    ];

    const countBy = (status) =>
      trackableAccounts.filter((a) => a.status === status).length;

    res.json({
      success: true,
      data: {
        idleDays,
        generatedAt: new Date().toISOString(),
        onlineWindowMinutes: 5,
        summary: {
          totalAccounts: trackableAccounts.length,
          admins: adminRows.length,
          vendors: vendorRows.length,
          onlineNow: countBy("online"),
          idleCount: countBy("idle"),
          neverLoggedIn: countBy("never"),
          notificationCount: notifications.length,
        },
        admins: adminRows,
        vendors: vendorRows,
        orphanEmployees,
        notifications,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
