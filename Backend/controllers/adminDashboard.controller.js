import mongoose from "mongoose";
import Order from "../models/Order.model.js";
import Bill from "../models/Bill.model.js";
import Restaurant from "../models/Restaurant.model.js";
import Employee from "../models/Employee.model.js";

/* ================= HELPER: get admin's restaurant IDs ================= */
const getAdminRestaurantIds = async (adminId, requestedRestaurantId) => {
  const ownedRestaurants = await Restaurant.find({ admin: adminId }).select("_id");
  const ownedIds = ownedRestaurants.map((r) => r._id);

  if (requestedRestaurantId && mongoose.Types.ObjectId.isValid(requestedRestaurantId)) {
    const reqId = new mongoose.Types.ObjectId(requestedRestaurantId);
    const isOwned = ownedIds.some((id) => id.equals(reqId));
    if (!isOwned) return null;
    return [reqId];
  }

  return ownedIds;
};

/* ================= HELPER: build date filter for createdAt ================= */
const buildDateFilter = ({ startDate, endDate }) => {
  if (!startDate && !endDate) return {};
  const createdAt = {};
  if (startDate) createdAt.$gte = new Date(startDate);
  if (endDate)   createdAt.$lte = new Date(endDate + "T23:59:59");
  return { createdAt };
};

/* ================= HELPER: build paid-at date filter ================= */
const buildPaidAtFilter = ({ startDate, endDate }) => {
  if (!startDate && !endDate) return {};
  const paidAt = {};
  if (startDate) paidAt.$gte = new Date(startDate);
  if (endDate)   paidAt.$lte = new Date(endDate + "T23:59:59");
  return { paidAt };
};

/* ================= ADMIN SUMMARY ================= */
export const getAdminSummary = async (req, res) => {
  try {
    const { restaurantId, startDate, endDate } = req.query;

    const restaurantIds = await getAdminRestaurantIds(req.user.id, restaurantId);
    if (restaurantIds === null) {
      return res.status(403).json({ success: false, message: "Access denied to this restaurant" });
    }

    /* total orders (all statuses) */
    const totalOrders = await Order.countDocuments({
      restaurant: { $in: restaurantIds },
      ...buildDateFilter({ startDate, endDate }),
    });

    /* total revenue from paid bills */
    const revenueAgg = await Bill.aggregate([
      {
        $match: {
          restaurant: { $in: restaurantIds },
          paymentStatus: "PAID",
          ...buildPaidAtFilter({ startDate, endDate }),
        },
      },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
    ]);

    const totalRevenue    = revenueAgg[0]?.totalRevenue || 0;
    const totalRestaurants = restaurantIds.length;
    const totalEmployees = await Employee.countDocuments({
      restaurant: { $in: restaurantIds },
      isActive: true,
    });

    res.json({ success: true, data: { totalOrders, totalRevenue, totalRestaurants, totalEmployees } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= MONTHLY CHART ================= */
export const getMonthlyChart = async (req, res) => {
  try {
    const { restaurantId, startDate, endDate } = req.query;

    const restaurantIds = await getAdminRestaurantIds(req.user.id, restaurantId);
    if (restaurantIds === null) {
      return res.status(403).json({ success: false, message: "Access denied to this restaurant" });
    }

    const data = await Bill.aggregate([
      {
        $match: {
          restaurant: { $in: restaurantIds },
          paymentStatus: "PAID",
          ...buildPaidAtFilter({ startDate, endDate }),
        },
      },
      {
        $group: {
          _id: { year: { $year: "$paidAt" }, month: { $month: "$paidAt" } },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const formatted = data.map((d) => ({
      month:   `${d._id.month}/${d._id.year}`,
      revenue: d.revenue,
      orders:  d.orders,
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

    const data = await Order.aggregate([
      {
        $match: {
          restaurant: { $in: restaurantIds },
          status: "PAID",
          ...buildDateFilter({ startDate, endDate }),
        },
      },
      { $unwind: "$items" },
      {
        $group: {
          _id:       "$items.menuItem",
          totalSold: { $sum: "$items.quantity" },
          revenue:   { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from:         "menus",
          localField:   "_id",
          foreignField: "_id",
          as:           "menu",
        },
      },
      {
        $project: {
          _id:       1,
          name:      { $ifNull: [{ $arrayElemAt: ["$menu.name", 0] }, "Unknown"] },
          totalSold: 1,
          revenue:   1,
        },
      },
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
    const { startDate, endDate } = req.query;

    const restaurants = await Restaurant.find({ admin: adminId }).select("_id name").lean();
    if (!restaurants.length) return res.json({ success: true, data: [] });

    const restaurantIds = restaurants.map((r) => r._id);
    const dateFilter    = buildDateFilter({ startDate, endDate });
    const paidAtFilter  = buildPaidAtFilter({ startDate, endDate });

    const [orderCounts, revenueCounts, employeeCounts, topItems] = await Promise.all([
      /* order counts — all orders */
      Order.aggregate([
        { $match: { restaurant: { $in: restaurantIds }, ...dateFilter } },
        { $group: { _id: "$restaurant", totalOrders: { $sum: 1 } } },
      ]),
      /* revenue — from paid bills */
      Bill.aggregate([
        { $match: { restaurant: { $in: restaurantIds }, paymentStatus: "PAID", ...paidAtFilter } },
        { $group: { _id: "$restaurant", totalRevenue: { $sum: "$totalAmount" } } },
      ]),
      Employee.aggregate([
        { $match: { restaurant: { $in: restaurantIds }, isActive: true } },
        {
          $group: {
            _id: { restaurant: "$restaurant", role: "$role" },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: "$_id.restaurant",
            totalEmployees: { $sum: "$count" },
            roles: { $push: { role: "$_id.role", count: "$count" } },
          },
        },
      ]),
      Order.aggregate([
        { $match: { restaurant: { $in: restaurantIds }, status: "PAID", ...dateFilter } },
        { $unwind: "$items" },
        {
          $group: {
            _id: { restaurant: "$restaurant", menuItem: "$items.menuItem" },
            totalSold: { $sum: "$items.quantity" },
            revenue: { $sum: { $multiply: ["$items.quantity", "$items.price"] } },
          },
        },
        { $sort: { "_id.restaurant": 1, totalSold: -1, revenue: -1 } },
        {
          $group: {
            _id: "$_id.restaurant",
            items: {
              $push: {
                menuItem: "$_id.menuItem",
                totalSold: "$totalSold",
                revenue: "$revenue",
              },
            },
          },
        },
        { $project: { items: { $slice: ["$items", 5] } } },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "menus",
            localField: "items.menuItem",
            foreignField: "_id",
            as: "menu",
          },
        },
        {
          $group: {
            _id: "$_id",
            items: {
              $push: {
                _id: "$items.menuItem",
                name: { $ifNull: [{ $arrayElemAt: ["$menu.name", 0] }, "Unknown"] },
                totalSold: "$items.totalSold",
                revenue: "$items.revenue",
              },
            },
          },
        },
      ]),
    ]);

    const orderMap   = Object.fromEntries(orderCounts.map((x)  => [x._id.toString(), x.totalOrders]));
    const revenueMap = Object.fromEntries(revenueCounts.map((x) => [x._id.toString(), x.totalRevenue]));
    const employeeMap = Object.fromEntries(
      employeeCounts.map((x) => [
        x._id.toString(),
        {
          totalEmployees: x.totalEmployees,
          roles: x.roles || [],
        },
      ])
    );
    const topItemsMap = Object.fromEntries(topItems.map((x) => [x._id.toString(), x.items || []]));

    const data = restaurants.map((r) => ({
      _id:          r._id,
      name:         r.name,
      totalOrders:  orderMap[r._id.toString()]   || 0,
      totalRevenue: revenueMap[r._id.toString()] || 0,
      totalEmployees: employeeMap[r._id.toString()]?.totalEmployees || 0,
      employeeRoles: employeeMap[r._id.toString()]?.roles || [],
      topItems: topItemsMap[r._id.toString()] || [],
    }));

    res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= DAILY SALES ================= */
export const getDailySales = async (req, res) => {
  try {
    const { restaurantId, startDate, endDate } = req.query;

    const restaurantIds = await getAdminRestaurantIds(req.user.id, restaurantId);
    if (restaurantIds === null) {
      return res.status(403).json({ success: false, message: "Access denied to this restaurant" });
    }

    const data = await Bill.aggregate([
      {
        $match: {
          restaurant: { $in: restaurantIds },
          paymentStatus: "PAID",
          ...buildPaidAtFilter({ startDate, endDate }),
        },
      },
      {
        $group: {
          _id: {
            year:  { $year:       "$paidAt" },
            month: { $month:      "$paidAt" },
            day:   { $dayOfMonth: "$paidAt" },
          },
          revenue: { $sum: "$totalAmount" },
          orders:  { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    const formatted = data.map((d) => ({
      date:    `${d._id.day}/${d._id.month}/${d._id.year}`,
      revenue: d.revenue,
      orders:  d.orders,
    }));

    res.json({ success: true, data: formatted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= ACCOUNT HISTORY ================= */
export const getAdminAccountHistory = async (req, res) => {
  try {
    const { restaurantId, startDate, endDate } = req.query;

    const restaurantIds = await getAdminRestaurantIds(req.user.id, restaurantId);
    if (restaurantIds === null) {
      return res
        .status(403)
        .json({ success: false, message: "Access denied to this restaurant" });
    }

    const paidAtFilter = buildPaidAtFilter({ startDate, endDate });

    const bills = await Bill.find({
      restaurant: { $in: restaurantIds },
      paymentStatus: "PAID",
      ...paidAtFilter,
    })
      .populate("restaurant", "name restaurantCode")
      .populate({
        path: "order",
        select: "orderNo table waiter createdAt paidAt",
        populate: [
          { path: "table", select: "tableNumber" },
          { path: "waiter", select: "name" },
        ],
      })
      .populate("accountant", "name employeeId")
      .sort({ paidAt: -1, createdAt: -1 })
      .lean();

    const totalRevenue = bills.reduce(
      (sum, bill) => sum + Number(bill.totalAmount || 0),
      0
    );

    const totalOrders = bills.length;
    const averageBillValue = totalOrders
      ? Number((totalRevenue / totalOrders).toFixed(2))
      : 0;

    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const todayCollections = bills.filter((bill) => {
      const paidAt = bill.paidAt ? new Date(bill.paidAt) : null;
      return paidAt && paidAt >= todayStart && paidAt <= todayEnd;
    }).length;

    res.json({
      success: true,
      data: {
        summary: {
          totalOrders,
          totalRevenue,
          averageBillValue,
          todayCollections,
          selectedRestaurantCount: restaurantIds.length,
        },
        filters: { restaurantId: restaurantId || "", startDate: startDate || "", endDate: endDate || "" },
        bills,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
