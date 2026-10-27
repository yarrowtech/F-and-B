import WaiterTableAssignment from "../models/WaiterTableAssignment.model.js";
import Employee from "../models/Employee.model.js";
import Restaurant from "../models/Restaurant.model.js";
import Table from "../models/Table.model.js";

const ASSIGNMENT_TYPES = ["REGULAR", "EXTRA"];

const ensureRestaurantAccess = async (req, restaurantId) => {
  if (req.user.role === "admin") {
    return Restaurant.findOne({ _id: restaurantId, admin: req.user.id });
  }
  if (String(req.user.restaurant) !== String(restaurantId)) {
    return null;
  }
  return Restaurant.findById(restaurantId);
};

/* What an order should be marked with, given who took it and on which table.

   ""        - the waiter has no assigned tables at all (system works as usual)
   ASSIGNED  - one of the waiter's regular tables
   EXTRA     - an extra / cover table given by admin or manager
   OTHER     - a table that is not assigned to this waiter */
export const getTableAssignmentMark = async (restaurantId, waiterId, tableId) => {
  if (!restaurantId || !waiterId || !tableId) return "";

  const assignments = await WaiterTableAssignment.find({
    restaurant: restaurantId,
    waiter: waiterId,
  })
    .select("table type")
    .lean();

  if (assignments.length === 0) return "";

  const match = assignments.find((item) => String(item.table) === String(tableId));
  if (!match) return "OTHER";
  return match.type === "EXTRA" ? "EXTRA" : "ASSIGNED";
};

/* ===============================
   GET ALL ASSIGNMENTS OF A RESTAURANT (admin / manager)
   GET /api/waiter-tables/:restaurantId
=============================== */
export const getRestaurantAssignments = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const restaurant = await ensureRestaurantAccess(req, restaurantId);
    if (!restaurant) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const [waiters, assignments] = await Promise.all([
      Employee.find({ restaurant: restaurantId, role: "WAITER", isActive: { $ne: false } })
        .select("name employeeId")
        .sort({ name: 1 })
        .lean(),
      WaiterTableAssignment.find({ restaurant: restaurantId })
        .populate("table", "tableNumber capacity")
        .sort({ createdAt: 1 })
        .lean(),
    ]);

    res.json({ success: true, data: { waiters, assignments } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ===============================
   REPLACE ONE WAITER'S TABLES (admin / manager)
   PUT /api/waiter-tables/:restaurantId/waiters/:waiterId
   body: { assignments: [{ table, type: "REGULAR" | "EXTRA", reason }] }
   An empty list clears the waiter's tables (they go back to working normally).
=============================== */
export const setWaiterAssignments = async (req, res) => {
  try {
    const { restaurantId, waiterId } = req.params;
    const input = Array.isArray(req.body.assignments) ? req.body.assignments : [];

    const restaurant = await ensureRestaurantAccess(req, restaurantId);
    if (!restaurant) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const waiter = await Employee.findOne({
      _id: waiterId,
      restaurant: restaurantId,
      role: "WAITER",
    }).select("_id");
    if (!waiter) {
      return res.status(404).json({ success: false, message: "Waiter not found" });
    }

    // One entry per table; if a table is listed twice the last one wins.
    const byTable = new Map();
    for (const entry of input) {
      const tableId = String(entry?.table?._id || entry?.table || "");
      if (!tableId) continue;
      byTable.set(tableId, {
        table: tableId,
        type: ASSIGNMENT_TYPES.includes(entry.type) ? entry.type : "REGULAR",
        reason: String(entry.reason || "").trim().slice(0, 120),
      });
    }

    const tableIds = [...byTable.keys()];
    if (tableIds.length > 0) {
      const found = await Table.countDocuments({ _id: { $in: tableIds }, restaurant: restaurantId });
      if (found !== tableIds.length) {
        return res.status(400).json({ success: false, message: "One or more tables were not found" });
      }
    }

    const assignedByModel = req.user.role === "admin" ? "Admin" : "Employee";
    const assignedByName = req.user.name || "";

    await WaiterTableAssignment.deleteMany({
      restaurant: restaurantId,
      waiter: waiterId,
      table: { $nin: tableIds },
    });

    if (tableIds.length > 0) {
      await WaiterTableAssignment.bulkWrite(
        [...byTable.values()].map((entry) => ({
          updateOne: {
            filter: { restaurant: restaurantId, waiter: waiterId, table: entry.table },
            update: {
              $set: {
                type: entry.type,
                reason: entry.type === "EXTRA" ? entry.reason : "",
                assignedBy: req.user.id,
                assignedByModel,
                assignedByName,
              },
            },
            upsert: true,
          },
        }))
      );
    }

    const assignments = await WaiterTableAssignment.find({ restaurant: restaurantId, waiter: waiterId })
      .populate("table", "tableNumber capacity")
      .lean();

    res.json({ success: true, message: "Waiter tables updated", data: assignments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ===============================
   MY TABLES (waiter)
   GET /api/waiter-tables/me
=============================== */
export const getMyAssignments = async (req, res) => {
  try {
    const assignments = await WaiterTableAssignment.find({
      restaurant: req.user.restaurant,
      waiter: req.user.id,
    })
      .select("table type reason")
      .lean();

    res.json({ success: true, data: assignments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
