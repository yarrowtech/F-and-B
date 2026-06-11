import mongoose from "mongoose";
import Order from "../models/Order.model.js";
import Bill from "../models/Bill.model.js";
import Attendance from "../models/Attendance.model.js";
import Employee from "../models/Employee.model.js";
import ExcelJS from "exceljs";

const sendError = (res, message, status = 400) =>
  res.status(status).json({
    success: false,
    message,
  });

const getManagerRestaurantId = (req, res) => {
  const restaurantId = req.user?.restaurant;

  if (!restaurantId || !mongoose.Types.ObjectId.isValid(restaurantId)) {
    sendError(res, "Invalid restaurant assigned to manager", 400);
    return null;
  }

  return restaurantId;
};

const parseSelectedRange = (req) => {
  const now = new Date();
  const { startDate, endDate } = req.query;

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const selectedStart = startDate ? new Date(startDate) : null;
  const selectedEnd = endDate ? new Date(endDate) : null;

  if (selectedStart && Number.isNaN(selectedStart.getTime())) {
    return { error: "Invalid startDate" };
  }

  if (selectedEnd && Number.isNaN(selectedEnd.getTime())) {
    return { error: "Invalid endDate" };
  }

  if (selectedStart) {
    selectedStart.setHours(0, 0, 0, 0);
  }

  if (selectedEnd) {
    selectedEnd.setHours(23, 59, 59, 999);
  }

  return {
    now,
    todayStart,
    todayEnd,
    selectedStart,
    selectedEnd,
  };
};

const aggregateRange = async (restaurantId, startDate, endDate) => {
  const [orderSummary, billSummary] = await Promise.all([
    Order.aggregate([
      {
        $match: {
          restaurant: new mongoose.Types.ObjectId(restaurantId),
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
          restaurant: new mongoose.Types.ObjectId(restaurantId),
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

export const getManagerDashboard = async (req, res) => {
  try {
    const restaurantId = getManagerRestaurantId(req, res);
    if (!restaurantId) return;

    const range = parseSelectedRange(req);
    if (range.error) {
      return sendError(res, range.error, 400);
    }

    const {
      todayStart,
      todayEnd,
      selectedStart,
      selectedEnd,
    } = range;

    const lastWeekStart = new Date(todayStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 6);

    const lastMonthStart = new Date(todayStart);
    lastMonthStart.setDate(lastMonthStart.getDate() - 29);

    const selectedRangeStats =
      selectedStart || selectedEnd
        ? await aggregateRange(
            restaurantId,
            selectedStart || new Date(0),
            selectedEnd || todayEnd
          )
        : null;

    const [
      todayStats,
      lastWeekStats,
      lastMonthStats,
      todayPresentStaff,
      totalStaff,
    ] = await Promise.all([
      aggregateRange(restaurantId, todayStart, todayEnd),
      aggregateRange(restaurantId, lastWeekStart, todayEnd),
      aggregateRange(restaurantId, lastMonthStart, todayEnd),
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
        selectedStartDate: req.query.startDate || "",
        selectedEndDate: req.query.endDate || "",
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

export const getManagerAccountHistory = async (req, res) => {
  try {
    const restaurantId = getManagerRestaurantId(req, res);
    if (!restaurantId) return;

    const range = parseSelectedRange(req);
    if (range.error) {
      return sendError(res, range.error, 400);
    }

    const { todayStart, todayEnd, selectedStart, selectedEnd } = range;

    const match = {
      restaurant: restaurantId,
      paymentStatus: "PAID",
    };

    if (selectedStart || selectedEnd) {
      match.paidAt = {};
      if (selectedStart) match.paidAt.$gte = selectedStart;
      if (selectedEnd) match.paidAt.$lte = selectedEnd;
      if (!selectedStart) match.paidAt.$gte = new Date(0);
      if (!selectedEnd) match.paidAt.$lte = todayEnd;
    }

    const bills = await Bill.find(match)
      .populate({
        path: "order",
        select: "orderNo table waiter createdAt paidAt orderType items",
        populate: [
          { path: "table", select: "tableNumber" },
          { path: "waiter", select: "name" },
          { path: "items.menuItem", select: "name price cuisine courseType" },
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

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalOrders,
          totalRevenue,
          averageBillValue,
          restaurantId,
          todayCollections: bills.filter((bill) => {
            const paidAt = bill.paidAt ? new Date(bill.paidAt) : null;
            return paidAt && paidAt >= todayStart && paidAt <= todayEnd;
          }).length,
        },
        filters: {
          startDate: req.query.startDate || "",
          endDate: req.query.endDate || "",
        },
        bills,
      },
    });
  } catch (error) {
    console.error("Manager Account History Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load manager account history",
    });
  }
};

export const exportManagerAccountHistoryExcel = async (req, res) => {
  try {
    const restaurantId = getManagerRestaurantId(req, res);
    if (!restaurantId) return;

    const range = parseSelectedRange(req);
    if (range.error) {
      return sendError(res, range.error, 400);
    }

    const { todayEnd, selectedStart, selectedEnd } = range;

    const match = {
      restaurant: restaurantId,
      paymentStatus: "PAID",
    };

    if (selectedStart || selectedEnd) {
      match.paidAt = {};
      if (selectedStart) match.paidAt.$gte = selectedStart;
      if (selectedEnd) match.paidAt.$lte = selectedEnd;
      if (!selectedStart) match.paidAt.$gte = new Date(0);
      if (!selectedEnd) match.paidAt.$lte = todayEnd;
    }

    const bills = await Bill.find(match)
      .populate({
        path: "order",
        select: "orderNo table waiter",
        populate: [
          { path: "table", select: "tableNumber" },
          { path: "waiter", select: "name" },
        ],
      })
      .sort({ paidAt: -1, createdAt: -1 })
      .lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Manager Account History");

    worksheet.columns = [
      { header: "Bill No", key: "billNo", width: 18 },
      { header: "Order No", key: "orderNo", width: 18 },
      { header: "Table", key: "table", width: 12 },
      { header: "Waiter", key: "waiter", width: 20 },
      { header: "Payment Method", key: "paymentMethod", width: 18 },
      { header: "Paid At", key: "paidAt", width: 24 },
      { header: "Billing Amount", key: "billingAmount", width: 18 },
    ];

    const totalAmount = bills.reduce(
      (sum, bill) => sum + Number(bill.totalAmount || 0),
      0
    );

    bills.forEach((bill) => {
      worksheet.addRow({
        billNo: bill.billNo || "-",
        orderNo: bill.order?.orderNo || "-",
        table: bill.order?.table?.tableNumber || "-",
        waiter: bill.order?.waiter?.name || "-",
        paymentMethod: bill.paymentMethod || "PAID",
        paidAt: bill.paidAt ? new Date(bill.paidAt).toLocaleString("en-IN") : "-",
        billingAmount: Number(bill.totalAmount || 0),
      });
    });

    worksheet.addRow({});
    worksheet.addRow({
      billNo: "Total Amount",
      billingAmount: totalAmount,
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getColumn("billingAmount").numFmt = "0.00";

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=manager-account-history-${req.query.startDate || "all"}-to-${req.query.endDate || "latest"}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Manager Account History Excel Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export manager account history",
    });
  }
};
