import mongoose from "mongoose";
import Order from "../models/Order.model.js";
import Bill from "../models/Bill.model.js";
import Restaurant from "../models/Restaurant.model.js";
import Employee from "../models/Employee.model.js";
import ExcelJS from "exceljs";
import VendorOrder from "../models/VendorOrder.model.js";
import VendorSettlement from "../models/VendorSettlement.model.js";

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

const normalizeComplimentaryType = (value) => {
  const type = String(value || "").trim().toUpperCase();
  if (["FULL_ORDER", "FULL", "ORDER"].includes(type)) return "FULL_ORDER";
  if (["ITEMS", "ITEM", "DISH", "DISHES"].includes(type)) return "ITEMS";
  return "NONE";
};

const getOrderItemId = (item) => String(item?._id || "");

const getBillComplimentaryMeta = (bill) => {
  const orderItems = Array.isArray(bill?.order?.items) ? bill.order.items : [];
  const selectedIds = new Set((bill?.complimentaryItems || []).map(String));
  const amount = Number(bill?.complimentaryAmount || 0);
  const rawType = normalizeComplimentaryType(bill?.complimentaryType);
  const hasSelectedItems = selectedIds.size > 0;
  const type =
    rawType === "FULL_ORDER"
      ? "FULL_ORDER"
      : rawType === "ITEMS" || hasSelectedItems || amount > 0
      ? "ITEMS"
      : "NONE";

  const items =
    type === "FULL_ORDER"
      ? orderItems
      : type === "ITEMS"
      ? orderItems.filter((item) => selectedIds.has(getOrderItemId(item)))
      : [];

  const itemCount =
    type === "ITEMS" && items.length === 0 && hasSelectedItems
      ? selectedIds.size
      : items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return {
    type,
    amount,
    itemCount,
    billCount: type === "NONE" ? 0 : 1,
    items: items.map((item) => ({
      _id: item._id,
      name: item.menuItem?.name || item.name || "Dish",
      quantity: item.quantity || 0,
    })),
    note: bill?.complimentaryNote || "",
  };
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

    const vendorOrderMatch = {
      restaurant: { $in: restaurantIds },
      status: { $ne: "cancelled" },
      ...buildDateFilter({ startDate, endDate }),
    };

    const [vendorSpendAgg, vendorOutstandingAgg, vendorCountAgg, vendorSettlementAgg] =
      await Promise.all([
        VendorOrder.aggregate([
          { $match: vendorOrderMatch },
          {
            $group: {
              _id: null,
              totalVendorSpend: {
                $sum: { $ifNull: ["$billing.totalAmount", "$totalAmount"] },
              },
            },
          },
        ]),
        VendorOrder.aggregate([
          {
            $match: {
              ...vendorOrderMatch,
              paymentStatus: { $ne: "paid" },
            },
          },
          {
            $group: {
              _id: null,
              pendingVendorPayables: {
                $sum: { $ifNull: ["$billing.totalAmount", "$totalAmount"] },
              },
            },
          },
        ]),
        VendorOrder.aggregate([
          { $match: vendorOrderMatch },
          { $group: { _id: "$vendor" } },
          { $count: "totalActiveVendors" },
        ]),
        VendorSettlement.aggregate([
          {
            $match: {
              restaurant: { $in: restaurantIds },
              ...buildDateFilter({ startDate, endDate }),
            },
          },
          {
            $group: {
              _id: null,
              totalVendorSettlements: { $sum: 1 },
              paidVendorSettlements: {
                $sum: { $cond: [{ $eq: ["$status", "paid"] }, 1, 0] },
              },
              settledVendorAmount: {
                $sum: {
                  $cond: [
                    { $eq: ["$status", "paid"] },
                    { $ifNull: ["$totals.netPayable", 0] },
                    0,
                  ],
                },
              },
            },
          },
        ]),
      ]);

    const totalVendorSpend = vendorSpendAgg[0]?.totalVendorSpend || 0;
    const pendingVendorPayables = vendorOutstandingAgg[0]?.pendingVendorPayables || 0;
    const totalActiveVendors = vendorCountAgg[0]?.totalActiveVendors || 0;
    const totalVendorSettlements = vendorSettlementAgg[0]?.totalVendorSettlements || 0;
    const paidVendorSettlements = vendorSettlementAgg[0]?.paidVendorSettlements || 0;
    const settledVendorAmount = vendorSettlementAgg[0]?.settledVendorAmount || 0;

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        totalRestaurants,
        totalEmployees,
        totalVendorSpend,
        pendingVendorPayables,
        totalActiveVendors,
        totalVendorSettlements,
        paidVendorSettlements,
        settledVendorAmount,
      },
    });
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
    const { restaurantId, startDate, endDate } = req.query;
    const scopedRestaurantIds = await getAdminRestaurantIds(adminId, restaurantId);
    if (scopedRestaurantIds === null) {
      return res.status(403).json({ success: false, message: "Access denied to this restaurant" });
    }

    const restaurants = await Restaurant.find({ _id: { $in: scopedRestaurantIds } })
      .select("_id name")
      .lean();
    if (!restaurants.length) return res.json({ success: true, data: [] });

    const restaurantIds = restaurants.map((r) => r._id);
    const dateFilter    = buildDateFilter({ startDate, endDate });
    const paidAtFilter  = buildPaidAtFilter({ startDate, endDate });

    const [orderCounts, revenueCounts, employeeCounts, topItems, vendorStats, vendorTopLists] = await Promise.all([
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
      VendorOrder.aggregate([
        {
          $match: {
            restaurant: { $in: restaurantIds },
            status: { $ne: "cancelled" },
            ...dateFilter,
          },
        },
        {
          $group: {
            _id: "$restaurant",
            vendorOrders: { $sum: 1 },
            vendorSpend: { $sum: { $ifNull: ["$billing.totalAmount", "$totalAmount"] } },
            vendorOutstanding: {
              $sum: {
                $cond: [
                  { $ne: ["$paymentStatus", "paid"] },
                  { $ifNull: ["$billing.totalAmount", "$totalAmount"] },
                  0,
                ],
              },
            },
            activeVendors: { $addToSet: "$vendor" },
          },
        },
        {
          $project: {
            vendorOrders: 1,
            vendorSpend: 1,
            vendorOutstanding: 1,
            activeVendorCount: { $size: "$activeVendors" },
          },
        },
      ]),
      VendorOrder.aggregate([
        {
          $match: {
            restaurant: { $in: restaurantIds },
            status: { $ne: "cancelled" },
            ...dateFilter,
          },
        },
        {
          $group: {
            _id: { restaurant: "$restaurant", vendor: "$vendor" },
            spend: { $sum: { $ifNull: ["$billing.totalAmount", "$totalAmount"] } },
            orders: { $sum: 1 },
            outstanding: {
              $sum: {
                $cond: [
                  { $ne: ["$paymentStatus", "paid"] },
                  { $ifNull: ["$billing.totalAmount", "$totalAmount"] },
                  0,
                ],
              },
            },
          },
        },
        {
          $lookup: {
            from: "vendors",
            localField: "_id.vendor",
            foreignField: "_id",
            as: "vendorDoc",
          },
        },
        {
          $project: {
            _id: 0,
            restaurant: "$_id.restaurant",
            vendorId: "$_id.vendor",
            name: { $ifNull: [{ $arrayElemAt: ["$vendorDoc.name", 0] }, "Vendor"] },
            code: { $ifNull: [{ $arrayElemAt: ["$vendorDoc.vendorId", 0] }, "-"] },
            spend: 1,
            orders: 1,
            outstanding: 1,
          },
        },
        { $sort: { restaurant: 1, spend: -1 } },
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
    const vendorStatsMap = Object.fromEntries(
      vendorStats.map((x) => [
        x._id.toString(),
        {
          vendorOrders: x.vendorOrders || 0,
          vendorSpend: x.vendorSpend || 0,
          vendorOutstanding: x.vendorOutstanding || 0,
          activeVendorCount: x.activeVendorCount || 0,
        },
      ])
    );
    const vendorTopMap = vendorTopLists.reduce((acc, entry) => {
      const key = entry.restaurant?.toString?.() || String(entry.restaurant);
      if (!acc[key]) acc[key] = [];
      if (acc[key].length < 5) {
        acc[key].push({
          _id: entry.vendorId,
          name: entry.name,
          vendorCode: entry.code,
          spend: entry.spend || 0,
          orders: entry.orders || 0,
          outstanding: entry.outstanding || 0,
        });
      }
      return acc;
    }, {});

    const data = restaurants.map((r) => ({
      _id:          r._id,
      name:         r.name,
      totalOrders:  orderMap[r._id.toString()]   || 0,
      totalRevenue: revenueMap[r._id.toString()] || 0,
      totalEmployees: employeeMap[r._id.toString()]?.totalEmployees || 0,
      employeeRoles: employeeMap[r._id.toString()]?.roles || [],
      topItems: topItemsMap[r._id.toString()] || [],
      vendorOrders: vendorStatsMap[r._id.toString()]?.vendorOrders || 0,
      vendorSpend: vendorStatsMap[r._id.toString()]?.vendorSpend || 0,
      vendorOutstanding: vendorStatsMap[r._id.toString()]?.vendorOutstanding || 0,
      activeVendorCount: vendorStatsMap[r._id.toString()]?.activeVendorCount || 0,
      topVendors: vendorTopMap[r._id.toString()] || [],
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

    const billsWithComplimentaryMeta = bills.map((bill) => ({
      ...bill,
      complimentaryMeta: getBillComplimentaryMeta(bill),
    }));

    const totalRevenue = billsWithComplimentaryMeta.reduce(
      (sum, bill) => sum + Number(bill.totalAmount || 0),
      0
    );

    const totalOrders = billsWithComplimentaryMeta.length;
    const averageBillValue = totalOrders
      ? Number((totalRevenue / totalOrders).toFixed(2))
      : 0;
    const complimentarySummary = billsWithComplimentaryMeta.reduce(
      (stats, bill) => {
        const meta = bill.complimentaryMeta;
        if (meta.type !== "NONE") {
          stats.billCount += 1;
          stats.itemCount += Number(meta.itemCount || 0);
          stats.amount += Number(meta.amount || 0);
        }
        return stats;
      },
      { billCount: 0, itemCount: 0, amount: 0 }
    );

    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const todayCollections = billsWithComplimentaryMeta.filter((bill) => {
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
          complimentary: complimentarySummary,
        },
        filters: { restaurantId: restaurantId || "", startDate: startDate || "", endDate: endDate || "" },
        bills: billsWithComplimentaryMeta,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const exportAdminAccountHistoryExcel = async (req, res) => {
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
      .populate("restaurant", "name")
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
    const worksheet = workbook.addWorksheet("Admin Account History");

    worksheet.columns = [
      { header: "Restaurant", key: "restaurant", width: 24 },
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
        restaurant: bill.restaurant?.name || "-",
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
      restaurant: "Total Amount",
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
      `attachment; filename=admin-account-history-${startDate || "all"}-to-${endDate || "latest"}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
