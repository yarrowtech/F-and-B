import mongoose from "mongoose";
import Order from "../models/Order.model.js";
import Attendance from "../models/Attendance.model.js";
import Employee from "../models/Employee.model.js";

/* =========================================================
   📊 MANAGER DASHBOARD CONTROLLER
   - Only manager's restaurant data
========================================================= */
export const getManagerDashboard = async (req, res) => {
  try {
    /* =========================================================
       🔐 GET RESTAURANT FROM LOGGED-IN MANAGER
    ========================================================= */
    const restaurantId = req.user?.restaurant;

    if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid restaurant assigned to manager",
      });
    }

    const filter = { restaurant: restaurantId };

    /* =========================================================
       📅 TODAY DATE RANGE
    ========================================================= */
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    /* =========================================================
       📊 BASIC STATS
    ========================================================= */

    // Total Orders
    const totalOrders = await Order.countDocuments(filter);

    // Total Revenue
    const totalRevenueAgg = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
        },
      },
    ]);
    const totalRevenue = totalRevenueAgg[0]?.total || 0;

    /* =========================================================
       📅 TODAY STATS
    ========================================================= */

    // Today Orders
    const todayOrders = await Order.countDocuments({
      ...filter,
      createdAt: { $gte: start, $lte: end },
    });

    // Today Revenue
    const todayRevenueAgg = await Order.aggregate([
      {
        $match: {
          ...filter,
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
        },
      },
    ]);
    const todayRevenue = todayRevenueAgg[0]?.total || 0;

    /* =========================================================
       📈 LAST 7 DAYS (CHART DATA)
    ========================================================= */
    const last7Days = await Order.aggregate([
      {
        $match: {
          ...filter,
          createdAt: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%d %b", date: "$createdAt" },
          },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    /* =========================================================
       📦 ORDER STATUS DISTRIBUTION
    ========================================================= */
    const orderStatusStats = await Order.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    /* =========================================================
       👨‍🍳 STAFF ATTENDANCE (TODAY)
    ========================================================= */

   // Present Staff Today (FIXED)
const todayPresentStaff = await Attendance.countDocuments({
  restaurant: restaurantId,
  status: "present",
});

    // Total Staff (from Employee model)
    const totalStaff = await Employee.countDocuments({
      restaurant: restaurantId,
      // optional: isActive: true
    });

    // Attendance %
    const attendanceRate = totalStaff
      ? ((todayPresentStaff / totalStaff) * 100).toFixed(1)
      : 0;

    /* =========================================================
       🚀 FINAL RESPONSE
    ========================================================= */
    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        todayOrders,
        todayRevenue,
        last7Days,
        orderStatusStats,

        // 👇 STAFF DATA
        todayPresentStaff,
        totalStaff,
        attendanceRate,
      },
    });

  } catch (error) {
    console.error("Manager Dashboard Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load manager dashboard",
    });
  }
};