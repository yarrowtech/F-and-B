import SalesAnalytics from "../models/SalesAnalytics.model.js";
import Restaurant from "../models/Restaurant.model.js";

/* ================= SUMMARY ================= */
export const getAdminDashboardSummary = async (req, res) => {
  try {
    const adminId = req.user._id;

    const restaurants = await Restaurant.find({ admin: adminId }).select("_id");
    const ids = restaurants.map(r => r._id);

    if (!ids.length) {
      return res.json({
        todayOrders: 0,
        todayRevenue: 0,
        monthlyOrders: 0,
        monthlyRevenue: 0
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const startMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const todayStats = await SalesAnalytics.aggregate([
      { $match: { restaurant: { $in: ids }, date: { $gte: today, $lt: tomorrow } } },
      { $group: { _id: null, totalOrders: { $sum: "$totalOrders" }, totalRevenue: { $sum: "$totalRevenue" } } }
    ]);

    const monthlyStats = await SalesAnalytics.aggregate([
      { $match: { restaurant: { $in: ids }, date: { $gte: startMonth, $lt: nextMonth } } },
      { $group: { _id: null, totalOrders: { $sum: "$totalOrders" }, totalRevenue: { $sum: "$totalRevenue" } } }
    ]);

    res.json({
      todayOrders: todayStats[0]?.totalOrders || 0,
      todayRevenue: todayStats[0]?.totalRevenue || 0,
      monthlyOrders: monthlyStats[0]?.totalOrders || 0,
      monthlyRevenue: monthlyStats[0]?.totalRevenue || 0
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= MONTHLY ================= */
export const getMonthlyChart = async (req, res) => {
  try {
    const adminId = req.user._id;

    const restaurants = await Restaurant.find({ admin: adminId }).select("_id");
    const ids = restaurants.map(r => r._id);

    const data = await SalesAnalytics.aggregate([
      { $match: { restaurant: { $in: ids } } },
      { $group: { _id: "$date", totalRevenue: { $sum: "$totalRevenue" } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      data: data.map(d => ({
        date: new Date(d._id).toLocaleDateString("en-IN"),
        totalRevenue: d.totalRevenue
      }))
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= TOP ITEMS ================= */
export const getTopItems = async (req, res) => {
  try {
    const adminId = req.user._id;

    const restaurants = await Restaurant.find({ admin: adminId }).select("_id");
    const ids = restaurants.map(r => r._id);

    const data = await SalesAnalytics.aggregate([
      { $match: { restaurant: { $in: ids } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          quantity: { $sum: "$items.quantity" }
        }
      },
      { $sort: { quantity: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      data: data.map(d => ({
        name: d._id,
        quantity: d.quantity
      }))
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};