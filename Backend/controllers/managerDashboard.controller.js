import mongoose from "mongoose";
import Order from "../models/Order.model.js";
import Bill from "../models/Bill.model.js";
import Attendance from "../models/Attendance.model.js";
import Employee from "../models/Employee.model.js";

export const getManagerDashboard = async (req, res) => {
  try {
    const restaurantId = req.user?.restaurant;

    if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid restaurant assigned to manager",
      });
    }

    const filter = { restaurant: restaurantId };
    const now = new Date();
    const { startDate, endDate } = req.query;

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const lastWeekStart = new Date(todayStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 6);

    const lastMonthStart = new Date(todayStart);
    lastMonthStart.setDate(lastMonthStart.getDate() - 29);

    const selectedStart = startDate ? new Date(startDate) : null;
    const selectedEnd = endDate ? new Date(endDate) : null;

    if (selectedStart && Number.isNaN(selectedStart.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid startDate",
      });
    }

    if (selectedEnd && Number.isNaN(selectedEnd.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid endDate",
      });
    }

    if (selectedStart) {
      selectedStart.setHours(0, 0, 0, 0);
    }

    if (selectedEnd) {
      selectedEnd.setHours(23, 59, 59, 999);
    }

    const aggregateRange = async (startDate, endDate) => {
      const [orderSummary, billSummary] = await Promise.all([
        Order.aggregate([
          {
            $match: {
              ...filter,
              createdAt: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
            },
          },
        ]),
        Bill.aggregate([
          {
            $match: {
              restaurant: restaurantId,
              paymentStatus: "PAID",
              paidAt: { $gte: startDate, $lte: endDate },
            },
          },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: { $ifNull: ["$totalAmount", 0] } },
            },
          },
        ]),
      ]);

      return {
        totalOrders: orderSummary[0]?.totalOrders || 0,
        totalRevenue: billSummary[0]?.totalRevenue || 0,
      };
    };

    const selectedRangeStats =
      selectedStart || selectedEnd
        ? await aggregateRange(
            selectedStart || new Date(0),
            selectedEnd || todayEnd
          )
        : null;

    const [todayStats, lastWeekStats, lastMonthStats, todayPresentStaff, totalStaff] =
      await Promise.all([
        aggregateRange(todayStart, todayEnd),
        aggregateRange(lastWeekStart, todayEnd),
        aggregateRange(lastMonthStart, todayEnd),
        Attendance.countDocuments({
          restaurant: restaurantId,
          status: "PRESENT",
          date: { $gte: todayStart, $lte: todayEnd },
        }),
        Employee.countDocuments({
          restaurant: restaurantId,
          isActive: true,
        }),
      ]);

    const attendanceRate = totalStaff
      ? Number(((todayPresentStaff / totalStaff) * 100).toFixed(1))
      : 0;

    res.status(200).json({
      success: true,
      data: {
        todayOrders: todayStats.totalOrders,
        todayRevenue: todayStats.totalRevenue,
        lastWeekOrders: lastWeekStats.totalOrders,
        lastWeekRevenue: lastWeekStats.totalRevenue,
        lastMonthOrders: lastMonthStats.totalOrders,
        lastMonthRevenue: lastMonthStats.totalRevenue,
        selectedOrders: selectedRangeStats?.totalOrders || 0,
        selectedRevenue: selectedRangeStats?.totalRevenue || 0,
        selectedStartDate: startDate || "",
        selectedEndDate: endDate || "",
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
