import mongoose from "mongoose";
import Bill from "../models/Bill.model.js";
import Feedback from "../models/Feedback.model.js";
import Reservation from "../models/Reservation.model.js";
import CrmNote from "../models/CrmNote.model.js";
import Restaurant from "../models/Restaurant.model.js";
import logger from "../utils/pinoLogger.js";

const ensureRestaurantAccess = async (req, restaurantId) => {
  if (req.user.role === "admin") {
    return Restaurant.findOne({ _id: restaurantId, admin: req.user.id });
  }
  if (req.user.role === "manager") {
    if (String(req.user.restaurant) !== String(restaurantId)) return null;
    return Restaurant.findById(restaurantId);
  }
  return null;
};

/* ===============================
   GET CUSTOMER LIST (aggregated from bills)
=============================== */
const getCustomers = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { search = "" } = req.query;

    const restaurant = await ensureRestaurantAccess(req, restaurantId);
    if (!restaurant) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const restaurantObjectId = new mongoose.Types.ObjectId(restaurantId);

    const matchStage = {
      restaurant: restaurantObjectId,
      customerPhone: { $nin: [null, ""] },
    };

    const customers = await Bill.aggregate([
      { $match: matchStage },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$customerPhone",
          customerName: { $first: "$customerName" },
          customerEmail: { $first: "$customerEmail" },
          totalVisits: { $sum: 1 },
          totalSpend: {
            $sum: { $cond: [{ $eq: ["$paymentStatus", "PAID"] }, "$totalAmount", 0] },
          },
          lastVisit: { $max: "$createdAt" },
        },
      },
      { $sort: { lastVisit: -1 } },
    ]);

    const filtered = search
      ? customers.filter((c) => {
          const term = search.toLowerCase();
          return (
            String(c._id || "").includes(search) ||
            String(c.customerName || "").toLowerCase().includes(term) ||
            String(c.customerEmail || "").toLowerCase().includes(term)
          );
        })
      : customers;

    // Pull average feedback rating per phone in one pass
    const feedbackAverages = await Feedback.aggregate([
      { $match: { restaurant: restaurantObjectId, customerPhone: { $nin: [null, ""] } } },
      {
        $group: {
          _id: "$customerPhone",
          averageRating: { $avg: "$rating" },
          feedbackCount: { $sum: 1 },
        },
      },
    ]);
    const feedbackByPhone = new Map(feedbackAverages.map((f) => [f._id, f]));

    const data = filtered.map((c) => ({
      phone: c._id,
      name: c.customerName || "Guest",
      email: c.customerEmail || "",
      totalVisits: c.totalVisits,
      totalSpend: c.totalSpend,
      lastVisit: c.lastVisit,
      averageRating: feedbackByPhone.get(c._id)?.averageRating
        ? Number(feedbackByPhone.get(c._id).averageRating.toFixed(2))
        : null,
      feedbackCount: feedbackByPhone.get(c._id)?.feedbackCount || 0,
    }));

    res.json({ success: true, data });
  } catch (err) {
    logger.error({ err }, "Failed to load CRM customers");
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ===============================
   GET SINGLE CUSTOMER DETAIL
=============================== */
const getCustomerDetail = async (req, res) => {
  try {
    const { restaurantId, phone } = req.params;

    const restaurant = await ensureRestaurantAccess(req, restaurantId);
    if (!restaurant) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const [bills, feedback, reservations, notes] = await Promise.all([
      Bill.find({ restaurant: restaurantId, customerPhone: phone })
        .sort({ createdAt: -1 })
        .select("billNo totalAmount paymentStatus createdAt paidAt")
        .lean(),
      Feedback.find({ restaurant: restaurantId, customerPhone: phone })
        .sort({ createdAt: -1 })
        .select("rating serviceRating ambianceRating comment createdAt")
        .lean(),
      Reservation.find({ restaurant: restaurantId, phone })
        .sort({ bookingTime: -1 })
        .select("partySize bookingTime status notes")
        .lean(),
      CrmNote.find({ restaurant: restaurantId, customerPhone: phone })
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const name = bills[0]?.customerName || "Guest";

    res.json({
      success: true,
      data: {
        phone,
        name,
        bills,
        feedback,
        reservations,
        notes,
      },
    });
  } catch (err) {
    logger.error({ err }, "Failed to load CRM customer detail");
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ===============================
   ADD A NOTE FOR A CUSTOMER
=============================== */
const addCustomerNote = async (req, res) => {
  try {
    const { restaurantId, phone } = req.params;
    const { note } = req.body;

    const restaurant = await ensureRestaurantAccess(req, restaurantId);
    if (!restaurant) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const trimmed = String(note || "").trim();
    if (!trimmed) {
      return res.status(400).json({ success: false, message: "Note cannot be empty" });
    }

    const created = await CrmNote.create({
      restaurant: restaurantId,
      customerPhone: phone,
      note: trimmed,
      createdBy: req.user.id,
      createdByModel: req.user.role === "admin" ? "Admin" : "Employee",
      createdByName: req.user.name || "",
    });

    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ===============================
   DELETE A NOTE
=============================== */
const deleteCustomerNote = async (req, res) => {
  try {
    const { restaurantId, noteId } = req.params;

    const restaurant = await ensureRestaurantAccess(req, restaurantId);
    if (!restaurant) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const deleted = await CrmNote.findOneAndDelete({ _id: noteId, restaurant: restaurantId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    res.json({ success: true, message: "Note deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export default {
  getCustomers,
  getCustomerDetail,
  addCustomerNote,
  deleteCustomerNote,
};
