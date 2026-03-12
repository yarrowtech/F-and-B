import SalesAnalytics from "../models/SalesAnalytics.model.js";
import Attendance from "../models/Attendance.model.js";

export const getAccountantDashboard = async (req, res) => {
  try {

    const { restaurant, _id } = req.user;

    /* ================= DATE CALCULATIONS ================= */

    const today = new Date().toISOString().split("T")[0];
    const currentMonth = new Date().toISOString().slice(0, 7);

    /* ================= TODAY ANALYTICS ================= */

    const todayData = await SalesAnalytics.find({
      restaurant,
      date: today
    });

    /* ================= MONTHLY ANALYTICS ================= */

    const monthlyData = await SalesAnalytics.find({
      restaurant,
      date: { $regex: `^${currentMonth}` }
    });

    const todayOrders = todayData.reduce(
      (sum, r) => sum + (r.totalOrders || 0),
      0
    );

    const todayRevenue = todayData.reduce(
      (sum, r) => sum + (r.totalRevenue || 0),
      0
    );

    const monthlyOrders = monthlyData.reduce(
      (sum, r) => sum + (r.totalOrders || 0),
      0
    );

    const monthlyRevenue = monthlyData.reduce(
      (sum, r) => sum + (r.totalRevenue || 0),
      0
    );

    /* ================= ATTENDANCE ================= */

    const totalDays = new Date().getDate();

    const presentDays = await Attendance.countDocuments({
      employee: _id,
      status: "present",
      date: { $regex: `^${currentMonth}` }
    });

    const presentPercent =
      totalDays === 0 ? 0 : ((presentDays / totalDays) * 100).toFixed(2);

    /* ================= RESPONSE ================= */

    res.json({
      success: true,

      todayOrders,
      todayRevenue,

      monthlyOrders,
      monthlyRevenue,

      attendance: {
        totalDays,
        presentDays,
        presentPercent
      }
    });

  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};