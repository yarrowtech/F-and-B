import Order from "../models/Order.model.js";
import Attendance from "../models/Attendance.model.js";

export const getWaiterDashboard = async (req, res) => {
  try {

    const { restaurant, _id } = req.user;

    const today = new Date();
    today.setHours(0,0,0,0);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const currentMonth = new Date().toISOString().slice(0,7);

    /* ===== TODAY ORDERS ===== */

    const todayOrders = await Order.countDocuments({
      restaurant,
      waiter: _id,
      createdAt: { $gte: today }
    });

    /* ===== MONTHLY ORDERS ===== */

    const monthlyOrders = await Order.countDocuments({
      restaurant,
      waiter: _id,
      createdAt: { $gte: monthStart }
    });

    /* ===== ATTENDANCE ===== */

    const totalDays = new Date().getDate();

    const presentDays = await Attendance.countDocuments({
      employee: _id,
      status: "present",
      date: { $regex: `^${currentMonth}` }
    });

    const presentPercent = ((presentDays / totalDays) * 100).toFixed(2);

    res.json({
      todayOrders,
      monthlyOrders,
      attendance: {
        totalDays,
        presentDays,
        presentPercent
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};