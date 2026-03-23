import mongoose from "mongoose";
import Order from "../models/Order.model.js";
import Restaurant from "../models/Restaurant.model.js";

/* ================= HELPER ================= */
const buildFilter = ({ restaurantId, startDate, endDate }) => {
  const filter = {};

  if (restaurantId && mongoose.Types.ObjectId.isValid(restaurantId)) {
    filter.restaurant = new mongoose.Types.ObjectId(restaurantId);
  }

  if (startDate || endDate) {
    filter.createdAt = {};

    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  return filter;
};

/* ================= ADMIN SUMMARY ================= */
export const getAdminSummary = async (req, res) => {
  try {
    const { restaurantId, startDate, endDate } = req.query;
    const baseFilter = buildFilter({ restaurantId, startDate, endDate });

    const totalOrders = await Order.countDocuments(baseFilter);

    const revenueAgg = await Order.aggregate([
      {
        $match: {
          ...baseFilter,
          status: { $in: ["PAID", "completed"] }, // ✅ FIX
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

    const totalRestaurants = restaurantId
      ? 1
      : await Restaurant.countDocuments();

    res.json({
      success: true,
      data: { totalOrders, totalRevenue, totalRestaurants },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= MONTHLY ================= */
export const getMonthlyChart = async (req, res) => {
  try {
    const { restaurantId, startDate, endDate } = req.query;
    const matchFilter = buildFilter({ restaurantId, startDate, endDate });

    const data = await Order.aggregate([
      {
        $match: {
          ...matchFilter,
          status: { $in: ["PAID", "completed"] }, // ✅ FIX
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const formatted = data.map((d) => ({
      month: `${d._id.month}/${d._id.year}`,
      revenue: d.revenue,
      orders: d.orders,
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= TOP ITEMS ================= */
export const getTopItems = async (req, res) => {
  try {
    const { restaurantId, startDate, endDate } = req.query;
    const matchFilter = buildFilter({ restaurantId, startDate, endDate });

    const data = await Order.aggregate([
      {
        $match: {
          ...matchFilter,
          status: { $in: ["PAID", "completed"] }, // ✅ FIX
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          totalSold: { $sum: "$items.quantity" },
          revenue: {
            $sum: {
              $multiply: ["$items.quantity", "$items.price"],
            },
          },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
    ]);

    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= DAILY ================= */
export const getDailySales = async (req, res) => {
  try {
    const { restaurantId, startDate, endDate } = req.query;
    const matchFilter = buildFilter({ restaurantId, startDate, endDate });

    const data = await Order.aggregate([
      {
        $match: {
          ...matchFilter,
          status: { $in: ["PAID", "completed"] }, // ✅ FIX
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
          "_id.day": 1,
        },
      },
    ]);

    const formatted = data.map((d) => ({
      date: `${d._id.day}/${d._id.month}/${d._id.year}`,
      revenue: d.revenue,
      orders: d.orders,
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};