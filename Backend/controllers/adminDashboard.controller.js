import mongoose from "mongoose";
import Order from "../models/Order.model.js";
import Restaurant from "../models/Restaurant.model.js";

/* ================= HELPER: get admin's restaurant IDs ================= */
const getAdminRestaurantIds = async (adminId, requestedRestaurantId) => {
  // Fetch only restaurants that belong to this admin
  const ownedRestaurants = await Restaurant.find({ admin: adminId }).select("_id");
  const ownedIds = ownedRestaurants.map((r) => r._id);

  if (requestedRestaurantId && mongoose.Types.ObjectId.isValid(requestedRestaurantId)) {
    const reqId = new mongoose.Types.ObjectId(requestedRestaurantId);
    // Only allow if the admin actually owns this restaurant
    const isOwned = ownedIds.some((id) => id.equals(reqId));
    if (!isOwned) return null; // signals unauthorized
    return [reqId];
  }

  return ownedIds;
};

/* ================= HELPER: build date filter ================= */
const buildDateFilter = ({ startDate, endDate }) => {
  if (!startDate && !endDate) return {};
  const createdAt = {};
  if (startDate) createdAt.$gte = new Date(startDate);
  if (endDate) createdAt.$lte = new Date(endDate);
  return { createdAt };
};

/* ================= ADMIN SUMMARY ================= */
export const getAdminSummary = async (req, res) => {
  try {
    const { restaurantId, startDate, endDate } = req.query;

    const restaurantIds = await getAdminRestaurantIds(req.user.id, restaurantId);
    if (restaurantIds === null) {
      return res.status(403).json({ success: false, message: "Access denied to this restaurant" });
    }

    const baseFilter = {
      restaurant: { $in: restaurantIds },
      ...buildDateFilter({ startDate, endDate }),
    };

    const totalOrders = await Order.countDocuments(baseFilter);

    const revenueAgg = await Order.aggregate([
      { $match: { ...baseFilter, status: { $in: ["PAID", "completed"] } } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
    ]);

    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;
    const totalRestaurants = restaurantIds.length;

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

    const restaurantIds = await getAdminRestaurantIds(req.user.id, restaurantId);
    if (restaurantIds === null) {
      return res.status(403).json({ success: false, message: "Access denied to this restaurant" });
    }

    const matchFilter = {
      restaurant: { $in: restaurantIds },
      status: { $in: ["PAID", "completed"] },
      ...buildDateFilter({ startDate, endDate }),
    };

    const data = await Order.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
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

    const restaurantIds = await getAdminRestaurantIds(req.user.id, restaurantId);
    if (restaurantIds === null) {
      return res.status(403).json({ success: false, message: "Access denied to this restaurant" });
    }

    const matchFilter = {
      restaurant: { $in: restaurantIds },
      status: { $in: ["PAID", "completed"] },
      ...buildDateFilter({ startDate, endDate }),
    };

    const data = await Order.aggregate([
      { $match: matchFilter },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          totalSold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
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

/* ================= RESTAURANT BREAKDOWN ================= */
export const getRestaurantBreakdown = async (req, res) => {
  try {
    const adminId = req.user.id;

    const restaurants = await Restaurant.find({ admin: adminId }).select("_id name").lean();
    if (!restaurants.length) return res.json({ success: true, data: [] });

    const restaurantIds = restaurants.map((r) => r._id);

    const dateFilter = buildDateFilter({ startDate: req.query.startDate, endDate: req.query.endDate });

    const [orderCounts, revenueCounts] = await Promise.all([
      Order.aggregate([
        { $match: { restaurant: { $in: restaurantIds }, ...dateFilter } },
        { $group: { _id: "$restaurant", totalOrders: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { restaurant: { $in: restaurantIds }, status: { $in: ["PAID", "completed"] }, ...dateFilter } },
        { $group: { _id: "$restaurant", totalRevenue: { $sum: "$totalAmount" } } },
      ]),
    ]);

    const orderMap   = Object.fromEntries(orderCounts.map((x) => [x._id.toString(), x.totalOrders]));
    const revenueMap = Object.fromEntries(revenueCounts.map((x) => [x._id.toString(), x.totalRevenue]));

    const data = restaurants.map((r) => ({
      _id:          r._id,
      name:         r.name,
      totalOrders:  orderMap[r._id.toString()]   || 0,
      totalRevenue: revenueMap[r._id.toString()] || 0,
    }));

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

    const restaurantIds = await getAdminRestaurantIds(req.user.id, restaurantId);
    if (restaurantIds === null) {
      return res.status(403).json({ success: false, message: "Access denied to this restaurant" });
    }

    const matchFilter = {
      restaurant: { $in: restaurantIds },
      status: { $in: ["PAID", "completed"] },
      ...buildDateFilter({ startDate, endDate }),
    };

    const data = await Order.aggregate([
      { $match: matchFilter },
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
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
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