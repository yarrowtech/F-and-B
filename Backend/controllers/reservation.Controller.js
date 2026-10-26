import Reservation from "../models/Reservation.model.js";
import Table from "../models/Table.model.js";
import Restaurant from "../models/Restaurant.model.js";
import Order from "../models/Order.model.js";

const ensureRestaurantAccess = async (req, restaurantId) => {
  if (req.user.role === "admin") {
    return Restaurant.findOne({ _id: restaurantId, admin: req.user.id });
  }
  if (String(req.user.restaurant) !== String(restaurantId)) {
    return null;
  }
  return Restaurant.findById(restaurantId);
};

const ACTIVE_ORDER_STATUSES = ["PENDING", "ACCEPTED", "PREPARING", "READY", "SERVED"];

const uniqueIds = (ids) => [
  ...new Set((Array.isArray(ids) ? ids : []).map((id) => String(id?._id || id || "")).filter(Boolean)),
];

// Checks the main + joined tables belong to the restaurant; returns the cleaned joined ids.
const resolveJoinedTables = async (restaurantId, mainTableId, joinedInput) => {
  const joinedIds = uniqueIds(joinedInput).filter((id) => id !== String(mainTableId || ""));
  if (joinedIds.length === 0) return [];

  if (!mainTableId) {
    throw new Error("Choose a main table before joining other tables");
  }

  const found = await Table.countDocuments({ _id: { $in: joinedIds }, restaurant: restaurantId });
  if (found !== joinedIds.length) {
    throw new Error("One or more tables to join were not found");
  }

  return joinedIds;
};

/* ===============================
   CREATE RESERVATION
=============================== */
const createReservation = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { customerName, phone, partySize, bookingTime, table, notes, joinedTables } = req.body;

    if (!customerName || !phone || !partySize || !bookingTime) {
      return res.status(400).json({
        success: false,
        message: "Customer name, phone, party size and booking time are required",
      });
    }

    const restaurant = await ensureRestaurantAccess(req, restaurantId);
    if (!restaurant) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (table) {
      const tableDoc = await Table.findOne({ _id: table, restaurant: restaurantId });
      if (!tableDoc) {
        return res.status(404).json({ success: false, message: "Table not found" });
      }
    }

    const joinedTableIds = await resolveJoinedTables(restaurantId, table, joinedTables);

    const reservation = await Reservation.create({
      restaurant: restaurantId,
      table: table || null,
      joinedTables: joinedTableIds,
      customerName,
      phone,
      partySize: Number(partySize),
      bookingTime: new Date(bookingTime),
      notes: notes || "",
      createdBy: req.user.id,
      createdByModel: req.user.userType === "ADMIN" ? "Admin" : "Employee",
    });

    res.status(201).json({
      success: true,
      message: "Reservation created successfully",
      data: reservation,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ===============================
   GET RESERVATIONS BY RESTAURANT
=============================== */
const getReservations = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { status } = req.query;

    const restaurant = await ensureRestaurantAccess(req, restaurantId);
    if (!restaurant) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const filter = { restaurant: restaurantId };
    if (status) filter.status = status;

    const reservations = await Reservation.find(filter)
      .sort({ bookingTime: 1 })
      .populate("table", "tableNumber capacity status")
      .populate("joinedTables", "tableNumber capacity status")
      .populate("createdBy", "name email")
      .lean();

    res.json({ success: true, data: reservations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ===============================
   UPDATE RESERVATION STATUS
   (seating a reservation also occupies the linked table)
=============================== */
const updateReservationStatus = async (req, res) => {
  try {
    const { restaurantId, id } = req.params;
    const { status } = req.body;

    if (!["upcoming", "seated", "cancelled", "no_show"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid reservation status" });
    }

    const restaurant = await ensureRestaurantAccess(req, restaurantId);
    if (!restaurant) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const reservation = await Reservation.findOne({ _id: id, restaurant: restaurantId });
    if (!reservation) {
      return res.status(404).json({ success: false, message: "Reservation not found" });
    }

    if (status === "seated" && reservation.table) {
      const seatTableIds = [reservation.table, ...(reservation.joinedTables || [])];
      const busyOrder = await Order.findOne({
        restaurant: restaurantId,
        status: { $in: ACTIVE_ORDER_STATUSES },
        $or: [{ table: { $in: seatTableIds } }, { joinedTables: { $in: seatTableIds } }],
      });
      if (busyOrder) {
        return res.status(409).json({
          success: false,
          message: "One of the reserved tables already has an active order",
        });
      }
    }

    reservation.status = status;
    await reservation.save();

    if (status === "seated" && reservation.table) {
      await Table.updateMany(
        {
          _id: { $in: [reservation.table, ...(reservation.joinedTables || [])] },
          restaurant: restaurantId,
        },
        { status: "occupied" }
      );
    }

    res.json({ success: true, message: "Reservation updated", data: reservation });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/* ===============================
   UPDATE RESERVATION DETAILS
=============================== */
const updateReservation = async (req, res) => {
  try {
    const { restaurantId, id } = req.params;
    const { customerName, phone, partySize, bookingTime, table, notes, joinedTables } = req.body;

    const restaurant = await ensureRestaurantAccess(req, restaurantId);
    if (!restaurant) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const updates = {};
    if (customerName !== undefined) updates.customerName = customerName;
    if (phone !== undefined) updates.phone = phone;
    if (partySize !== undefined) updates.partySize = Number(partySize);
    if (bookingTime !== undefined) updates.bookingTime = new Date(bookingTime);
    if (notes !== undefined) updates.notes = notes;
    if (table !== undefined) updates.table = table || null;

    if (joinedTables !== undefined || table !== undefined) {
      const existing = await Reservation.findOne({ _id: id, restaurant: restaurantId }).select("table joinedTables");
      const mainTable = table !== undefined ? table || null : existing?.table;
      const requested = joinedTables !== undefined ? joinedTables : existing?.joinedTables;
      updates.joinedTables = await resolveJoinedTables(restaurantId, mainTable, requested);
    }

    const reservation = await Reservation.findOneAndUpdate(
      { _id: id, restaurant: restaurantId },
      updates,
      { new: true }
    );

    if (!reservation) {
      return res.status(404).json({ success: false, message: "Reservation not found" });
    }

    res.json({ success: true, message: "Reservation updated", data: reservation });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

/* ===============================
   DELETE RESERVATION
=============================== */
const deleteReservation = async (req, res) => {
  try {
    const { restaurantId, id } = req.params;

    const restaurant = await ensureRestaurantAccess(req, restaurantId);
    if (!restaurant) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const reservation = await Reservation.findOneAndDelete({ _id: id, restaurant: restaurantId });
    if (!reservation) {
      return res.status(404).json({ success: false, message: "Reservation not found" });
    }

    res.json({ success: true, message: "Reservation deleted successfully" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export default {
  createReservation,
  getReservations,
  updateReservationStatus,
  updateReservation,
  deleteReservation,
};
