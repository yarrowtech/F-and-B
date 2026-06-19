import mongoose from "mongoose";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import Bill from "../models/Bill.model.js";
import InventoryLog from "../models/InventoryLog.model.js";
import KotPrintJob from "../models/KotPrintJob.model.js";
import Menu from "../models/Menu.model.js";
import Order from "../models/Order.model.js";
import Restaurant from "../models/Restaurant.model.js";

const REPORTS = [
  ["daily-sales-report", "Daily Sales Report", "sales", "dailySales"],
  ["table-wise-sale-report", "Table Wise Sale Report", "sales", "tableSales"],
  ["server-wise-sale-report", "Server Wise Sale Report", "sales", "serverSales"],
  ["cashier-wise-sale-report", "Cashier Wise Sale Report", "sales", "cashierSales"],
  ["daily-sales-settlement-wise", "Daily Sales Settlement Wise", "sales", "dailySettlement"],
  ["daily-sales-settlement-wise-summary", "Daily Sales Settlement Wise Summary", "sales", "settlementSummary"],
  ["sale-report", "Sale Report", "sales", "saleDetail"],
  ["monthly-yearly-sales-bill-report", "Monthly/Yearly Sales Bill Report", "sales", "monthlyBillSales"],
  ["sales-settlement-wise-detail", "Sales Settlement Wise Detail", "sales", "settlementDetail"],
  ["monthly-yearly-sales-date-summary", "Monthly/Yearly Sales Date Summary", "sales", "dateSalesSummary"],
  ["summarised-sale-report", "Summarised Sale Report", "sales", "salesSummary"],
  ["food-sale", "Food Sale", "sales", "foodSales"],
  ["projected-sale", "Projected Sale", "sales", "projectedSales"],
  ["complimentary-sale", "Complimentary Sale", "sales", "complimentarySales"],
  ["bill-detail-report", "Bill Detail Report", "billing", "billDetail"],
  ["discount-report", "Discount Report", "billing", "discount"],
  ["continues-bills", "Continues Bills", "billing", "continuousBills"],
  ["canceled-item-report", "Canceled Item Report", "billing", "cancelledItems"],
  ["detail-tax-report", "Detail Tax Report", "billing", "taxDetail"],
  ["summary-tax-report", "Summary Tax Report", "billing", "taxRateSummary"],
  ["summarised-tax-report", "Summarised Tax Report", "billing", "taxSummary"],
  ["bill-item-wise-tax", "Bill & Item Wise Tax", "billing", "billItemTax"],
  ["bank-report", "Bank Report", "billing", "bankReport"],
  ["credit-account-payment-detail", "Credit A/c Payment Detail", "billing", "creditPayments"],
  ["menu-mix-sales-wise", "Menu Mix Sales Wise", "menu", "menuMixSales"],
  ["menu-mix-sales-wise-pax-wise", "Menu Mix Sales Wise Pax Wise", "menu", "menuMixPax"],
  ["menu-mix-product-wise", "Menu Mix Product Wise", "menu", "menuMixProduct"],
  ["menu-report-section-wise", "Menu Report Section Wise", "menu", "menuSectionSales"],
  ["top-selling-items", "Top Selling Items", "menu", "topItems"],
  ["least-selling-items", "Least Selling Items", "menu", "leastItems"],
  ["non-moving-items", "Non Moving Items", "menu", "nonMoving"],
  ["kot-analysis", "KOT Analysis", "menu", "kotAnalysis"],
  ["mrp-change-report", "MRP Change Report", "menu", "menuPrices"],
  ["item-qty-sold", "Item Qty Sold", "menu", "itemQuantitySales"],
  ["item-week-day-wise", "Item Week Day Wise", "menu", "itemWeekday"],
  ["item-date-wise", "Item Date Wise", "menu", "itemDate"],
  ["item-month-wise", "Item Month Wise", "menu", "itemMonth"],
  ["product-wise-sale", "Product Wise Sale", "menu", "productSales"],
  ["cost-report", "Cost Report", "menu", "inventoryUsage"],
  ["liquor-report", "Liquor Report", "operations", "liquorDetail"],
  ["liquor-summary", "Liquor Summary", "operations", "liquorSummary"],
  ["time-periodical-report", "Time Periodical Report", "operations", "hourlySales"],
  ["time-week-day-wise", "Time Week Day Wise", "operations", "weekdaySales"],
  ["canceled-report", "Canceled Report", "operations", "cancelledOrders"],
].map(([key, title, group, type]) => ({ key, title, group, type }));

const REPORT_BY_KEY = new Map(REPORTS.map((report) => [report.key, report]));
const BUSINESS_TIMEZONE = "Asia/Kolkata";
const money = (value) => Number(Number(value || 0).toFixed(2));
const reportError = (message, status = 400) =>
  Object.assign(new Error(message), { status });
const businessDateString = (date = new Date()) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

const parseRange = (query) => {
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  if (
    (query.startDate && !datePattern.test(query.startDate)) ||
    (query.endDate && !datePattern.test(query.endDate))
  ) {
    throw reportError("Dates must use YYYY-MM-DD format");
  }

  const endDate = query.endDate || businessDateString();
  const end = new Date(`${endDate}T23:59:59.999+05:30`);
  const defaultStart = new Date(end);
  defaultStart.setUTCDate(defaultStart.getUTCDate() - 29);
  const start = query.startDate
    ? new Date(`${query.startDate}T00:00:00.000+05:30`)
    : new Date(`${businessDateString(defaultStart)}T00:00:00.000+05:30`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    (query.startDate && businessDateString(start) !== query.startDate) ||
    (query.endDate && businessDateString(end) !== query.endDate) ||
    start > end
  ) {
    throw reportError("Invalid report date range");
  }

  return { start, end };
};

const getRestaurantScope = async (adminId, requestedRestaurantId) => {
  const filter = { admin: adminId };
  if (requestedRestaurantId) {
    if (!mongoose.Types.ObjectId.isValid(requestedRestaurantId)) {
      throw reportError("Invalid restaurant");
    }
    filter._id = requestedRestaurantId;
  }

  const restaurants = await Restaurant.find(filter).select("_id name").lean();
  if (requestedRestaurantId && restaurants.length === 0) {
    const error = new Error("Restaurant not found or access denied");
    error.status = 403;
    throw error;
  }
  return restaurants;
};

const billMatch = (restaurantIds, start, end) => ({
  restaurant: { $in: restaurantIds },
  paymentStatus: "PAID",
  $or: [
    { paidAt: { $gte: start, $lte: end } },
    { paidAt: null, updatedAt: { $gte: start, $lte: end } },
  ],
});

const addTimeRangeToBillMatch = (match, startTime, endTime) => {
  if (!startTime || !endTime) return match;

  const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
  const startMatch = startTime.match(timePattern);
  const endMatch = endTime.match(timePattern);
  if (!startMatch || !endMatch) {
    throw reportError("Times must use HH:mm format");
  }

  const startMinutes = Number(startMatch[1]) * 60 + Number(startMatch[2]);
  const endMinutes = Number(endMatch[1]) * 60 + Number(endMatch[2]);
  const reportDate = { $ifNull: ["$paidAt", "$updatedAt"] };
  const minutesOfDay = {
    $add: [
      {
        $multiply: [
          { $hour: { date: reportDate, timezone: BUSINESS_TIMEZONE } },
          60,
        ],
      },
      { $minute: { date: reportDate, timezone: BUSINESS_TIMEZONE } },
    ],
  };
  const timeExpression =
    startMinutes <= endMinutes
      ? {
          $and: [
            { $gte: [minutesOfDay, startMinutes] },
            { $lte: [minutesOfDay, endMinutes] },
          ],
        }
      : {
          $or: [
            { $gte: [minutesOfDay, startMinutes] },
            { $lte: [minutesOfDay, endMinutes] },
          ],
        };

  return { $and: [match, { $expr: timeExpression }] };
};

const billBasePipeline = (match) => [
  { $match: match },
  { $addFields: { reportDate: { $ifNull: ["$paidAt", "$updatedAt"] } } },
  {
    $lookup: {
      from: "restaurants",
      localField: "restaurant",
      foreignField: "_id",
      as: "restaurantDoc",
    },
  },
  { $unwind: { path: "$restaurantDoc", preserveNullAndEmptyArrays: true } },
  {
    $lookup: {
      from: "orders",
      localField: "order",
      foreignField: "_id",
      as: "orderDoc",
    },
  },
  { $unwind: { path: "$orderDoc", preserveNullAndEmptyArrays: true } },
];

const reportResponse = (report, columns, rows, summary = {}) => ({
  key: report.key,
  title: report.title,
  group: report.group,
  columns,
  rows,
  summary,
});

const detailResponse = (columns, rows) => ({ columns, rows });

const runBillDetail = async (context, report) => {
  const rows = await Bill.aggregate([
    ...billBasePipeline(context.billMatch),
    {
      $lookup: {
        from: "employees",
        localField: "orderDoc.waiter",
        foreignField: "_id",
        as: "waiterDoc",
      },
    },
    { $unwind: { path: "$waiterDoc", preserveNullAndEmptyArrays: true } },
    { $sort: { reportDate: -1 } },
    { $limit: context.limit },
    {
      $project: {
        _id: 0,
        date: { $dateToString: { date: "$reportDate", format: "%Y-%m-%d %H:%M" } },
        restaurant: { $ifNull: ["$restaurantDoc.name", "-"] },
        billNo: 1,
        orderNo: { $ifNull: ["$orderDoc.orderNo", "-"] },
        waiter: { $ifNull: ["$waiterDoc.name", "-"] },
        paymentMethod: { $ifNull: ["$paymentMethod", "-"] },
        itemsTotal: { $round: ["$itemsTotal", 2] },
        discount: { $round: ["$discount", 2] },
        totalAmount: { $round: ["$totalAmount", 2] },
      },
    },
  ]);

  return reportResponse(
    report,
    ["date", "restaurant", "billNo", "orderNo", "waiter", "paymentMethod", "itemsTotal", "discount", "totalAmount"],
    rows,
    { bills: rows.length, revenue: money(rows.reduce((sum, row) => sum + Number(row.totalAmount || 0), 0)) }
  );
};

const runGroupedBills = async (context, report, config) => {
  const rows = await Bill.aggregate([
    ...billBasePipeline(context.billMatch),
    ...(config.lookup || []),
    {
      $group: {
        _id: config.id,
        restaurantName: {
          $first: { $ifNull: ["$restaurantDoc.name", "-"] },
        },
        bills: { $sum: 1 },
        itemsTotal: { $sum: "$itemsTotal" },
        discount: { $sum: "$discount" },
        cgst: { $sum: "$cgst" },
        sgst: { $sum: "$sgst" },
        revenue: { $sum: "$totalAmount" },
      },
    },
    { $sort: config.sort || { revenue: -1 } },
    { $limit: context.limit },
    {
      $project: {
        _id: 0,
        label: config.label,
        bills: 1,
        itemsTotal: { $round: ["$itemsTotal", 2] },
        discount: { $round: ["$discount", 2] },
        cgst: { $round: ["$cgst", 2] },
        sgst: { $round: ["$sgst", 2] },
        revenue: { $round: ["$revenue", 2] },
      },
    },
  ]);

  return reportResponse(
    report,
    ["label", "bills", "itemsTotal", "discount", "cgst", "sgst", "revenue"],
    rows,
    { groups: rows.length, revenue: money(rows.reduce((sum, row) => sum + Number(row.revenue || 0), 0)) }
  );
};

const runSalesGrouped = async (context, report, config) => {
  const rows = await Bill.aggregate([
    ...billBasePipeline(context.billMatch),
    ...(config.lookup || []),
    {
      $group: {
        _id: config.id,
        restaurantName: {
          $first: { $ifNull: ["$restaurantDoc.name", "-"] },
        },
        bills: { $sum: 1 },
        grossSales: { $sum: "$itemsTotal" },
        complimentary: { $sum: "$complimentaryAmount" },
        discounts: { $sum: "$discount" },
        cgst: { $sum: "$cgst" },
        sgst: { $sum: "$sgst" },
        serviceCharge: { $sum: "$serviceCharge" },
        packagingCharge: { $sum: "$packagingCharge" },
        extraCharge: { $sum: "$extraCharge" },
        netSales: {
          $sum: {
            $max: [
              {
                $subtract: [
                  { $ifNull: ["$itemsTotal", 0] },
                  { $ifNull: ["$discount", 0] },
                ],
              },
              0,
            ],
          },
        },
        totalCollected: { $sum: "$totalAmount" },
      },
    },
    { $sort: config.sort || { totalCollected: -1 } },
    { $limit: context.limit },
    {
      $project: {
        _id: 0,
        ...config.project,
        bills: 1,
        grossSales: { $round: ["$grossSales", 2] },
        complimentary: { $round: ["$complimentary", 2] },
        discounts: { $round: ["$discounts", 2] },
        cgst: { $round: ["$cgst", 2] },
        sgst: { $round: ["$sgst", 2] },
        serviceCharge: { $round: ["$serviceCharge", 2] },
        packagingCharge: { $round: ["$packagingCharge", 2] },
        extraCharge: { $round: ["$extraCharge", 2] },
        netSales: { $round: ["$netSales", 2] },
        tax: { $round: [{ $add: ["$cgst", "$sgst"] }, 2] },
        charges: {
          $round: [
            { $add: ["$serviceCharge", "$packagingCharge", "$extraCharge"] },
            2,
          ],
        },
        expectedCollection: {
          $round: [
            {
              $add: [
                "$netSales",
                "$cgst",
                "$sgst",
                "$serviceCharge",
                "$packagingCharge",
                "$extraCharge",
              ],
            },
            2,
          ],
        },
        totalCollected: { $round: ["$totalCollected", 2] },
        variance: {
          $round: [
            {
              $subtract: [
                "$totalCollected",
                {
                  $add: [
                    "$netSales",
                    "$cgst",
                    "$sgst",
                    "$serviceCharge",
                    "$packagingCharge",
                    "$extraCharge",
                  ],
                },
              ],
            },
            2,
          ],
        },
        averageBill: {
          $round: [{ $cond: [{ $gt: ["$bills", 0] }, { $divide: ["$netSales", "$bills"] }, 0] }, 2],
        },
      },
    },
  ]);

  const summary = {
    groups: rows.length,
    bills: rows.reduce((sum, row) => sum + Number(row.bills || 0), 0),
    grossSales: money(rows.reduce((sum, row) => sum + Number(row.grossSales || 0), 0)),
    discounts: money(rows.reduce((sum, row) => sum + Number(row.discounts || 0), 0)),
    netSales: money(rows.reduce((sum, row) => sum + Number(row.netSales || 0), 0)),
    totalCollected: money(rows.reduce((sum, row) => sum + Number(row.totalCollected || 0), 0)),
  };

  if (config.includeReconciliationSummary) {
    summary.settlementGroups = summary.groups;
    delete summary.groups;
    summary.tax = money(rows.reduce((sum, row) => sum + Number(row.tax || 0), 0));
    summary.charges = money(rows.reduce((sum, row) => sum + Number(row.charges || 0), 0));
    summary.expectedCollection = money(
      rows.reduce((sum, row) => sum + Number(row.expectedCollection || 0), 0)
    );
    summary.variance = money(rows.reduce((sum, row) => sum + Number(row.variance || 0), 0));
  }

  return reportResponse(report, config.columns, rows, summary);
};

const runSaleDetail = async (context, report, { settlementOnly = false } = {}) => {
  const rows = await Bill.aggregate([
    ...billBasePipeline(context.billMatch),
    {
      $lookup: {
        from: "tables",
        localField: "orderDoc.table",
        foreignField: "_id",
        as: "tableDoc",
      },
    },
    { $unwind: { path: "$tableDoc", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "employees",
        localField: "orderDoc.waiter",
        foreignField: "_id",
        as: "waiterDoc",
      },
    },
    { $unwind: { path: "$waiterDoc", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "employees",
        localField: "accountant",
        foreignField: "_id",
        as: "cashierDoc",
      },
    },
    { $unwind: { path: "$cashierDoc", preserveNullAndEmptyArrays: true } },
    { $sort: { reportDate: -1 } },
    { $limit: context.limit },
    {
      $project: {
        _id: 0,
        date: {
          $dateToString: {
            date: "$reportDate",
            format: "%Y-%m-%d %H:%M",
            timezone: BUSINESS_TIMEZONE,
          },
        },
        restaurant: { $ifNull: ["$restaurantDoc.name", "-"] },
        billNo: 1,
        orderNo: { $ifNull: ["$orderDoc.orderNo", "-"] },
        orderType: { $ifNull: ["$orderDoc.orderType", "OTHER"] },
        table: {
          $cond: [
            { $ne: [{ $ifNull: ["$tableDoc.tableNumber", null] }, null] },
            { $concat: ["Table ", { $toString: "$tableDoc.tableNumber" }] },
            "-",
          ],
        },
        waiter: { $ifNull: ["$waiterDoc.name", "Unassigned"] },
        cashier: { $ifNull: ["$cashierDoc.name", "Unassigned"] },
        settlement: { $ifNull: ["$paymentMethod", "UNKNOWN"] },
        grossSales: { $round: ["$itemsTotal", 2] },
        complimentary: { $round: ["$complimentaryAmount", 2] },
        discount: { $round: ["$discount", 2] },
        tax: {
          $round: [
            {
              $add: [
                { $ifNull: ["$cgst", 0] },
                { $ifNull: ["$sgst", 0] },
              ],
            },
            2,
          ],
        },
        charges: {
          $round: [
            {
              $add: [
                { $ifNull: ["$serviceCharge", 0] },
                { $ifNull: ["$packagingCharge", 0] },
                { $ifNull: ["$extraCharge", 0] },
              ],
            },
            2,
          ],
        },
        netSales: {
          $round: [
            {
              $max: [
                {
                  $subtract: [
                    { $ifNull: ["$itemsTotal", 0] },
                    { $ifNull: ["$discount", 0] },
                  ],
                },
                0,
              ],
            },
            2,
          ],
        },
        expectedCollection: {
          $round: [
            {
              $add: [
                {
                  $max: [
                    {
                      $subtract: [
                        { $ifNull: ["$itemsTotal", 0] },
                        { $ifNull: ["$discount", 0] },
                      ],
                    },
                    0,
                  ],
                },
                { $ifNull: ["$cgst", 0] },
                { $ifNull: ["$sgst", 0] },
                { $ifNull: ["$serviceCharge", 0] },
                { $ifNull: ["$packagingCharge", 0] },
                { $ifNull: ["$extraCharge", 0] },
              ],
            },
            2,
          ],
        },
        totalCollected: { $round: ["$totalAmount", 2] },
        variance: {
          $round: [
            {
              $subtract: [
                { $ifNull: ["$totalAmount", 0] },
                {
                  $add: [
                    {
                      $max: [
                        {
                          $subtract: [
                            { $ifNull: ["$itemsTotal", 0] },
                            { $ifNull: ["$discount", 0] },
                          ],
                        },
                        0,
                      ],
                    },
                    { $ifNull: ["$cgst", 0] },
                    { $ifNull: ["$sgst", 0] },
                    { $ifNull: ["$serviceCharge", 0] },
                    { $ifNull: ["$packagingCharge", 0] },
                    { $ifNull: ["$extraCharge", 0] },
                  ],
                },
              ],
            },
            2,
          ],
        },
      },
    },
  ]);

  const columns = settlementOnly
    ? ["date", "restaurant", "billNo", "orderNo", "settlement", "cashier", "netSales", "totalCollected"]
    : [
        "date",
        "restaurant",
        "billNo",
        "orderNo",
        "orderType",
        "table",
        "waiter",
        "cashier",
        "settlement",
        "grossSales",
        "complimentary",
        "discount",
        "tax",
        "charges",
        "netSales",
        "totalCollected",
      ];

  return reportResponse(report, columns, rows, {
    bills: rows.length,
    grossSales: money(rows.reduce((sum, row) => sum + Number(row.grossSales || 0), 0)),
    discounts: money(rows.reduce((sum, row) => sum + Number(row.discount || 0), 0)),
    netSales: money(rows.reduce((sum, row) => sum + Number(row.netSales || 0), 0)),
    totalCollected: money(rows.reduce((sum, row) => sum + Number(row.totalCollected || 0), 0)),
  });
};

const runItemTransactionDetails = async (context, extraMatch = {}) => {
  const rows = await Bill.aggregate([
    { $match: context.billMatch },
    { $addFields: { reportDate: { $ifNull: ["$paidAt", "$updatedAt"] } } },
    { $lookup: { from: "restaurants", localField: "restaurant", foreignField: "_id", as: "restaurantDoc" } },
    { $unwind: { path: "$restaurantDoc", preserveNullAndEmptyArrays: true } },
    { $lookup: { from: "orders", localField: "order", foreignField: "_id", as: "orderDoc" } },
    { $unwind: "$orderDoc" },
    { $unwind: "$orderDoc.items" },
    { $match: { "orderDoc.items.status": { $ne: "CANCELLED" } } },
    { $lookup: { from: "menus", localField: "orderDoc.items.menuItem", foreignField: "_id", as: "menuDoc" } },
    { $unwind: { path: "$menuDoc", preserveNullAndEmptyArrays: true } },
    { $match: extraMatch },
    { $sort: { reportDate: -1, billNo: 1 } },
    { $limit: context.limit },
    {
      $project: {
        _id: 0,
        date: {
          $dateToString: {
            date: "$reportDate",
            format: "%Y-%m-%d %H:%M",
            timezone: BUSINESS_TIMEZONE,
          },
        },
        restaurant: { $ifNull: ["$restaurantDoc.name", "-"] },
        billNo: 1,
        orderNo: "$orderDoc.orderNo",
        orderType: "$orderDoc.orderType",
        menuCode: { $ifNull: ["$menuDoc.menuCode", "-"] },
        item: { $ifNull: ["$menuDoc.name", "Deleted Menu Item"] },
        cuisine: { $ifNull: ["$menuDoc.cuisine", "-"] },
        section: { $ifNull: ["$menuDoc.courseType", "-"] },
        quantity: "$orderDoc.items.quantity",
        rate: { $round: ["$orderDoc.items.price", 2] },
        amount: {
          $round: [
            { $multiply: ["$orderDoc.items.quantity", "$orderDoc.items.price"] },
            2,
          ],
        },
        settlement: { $ifNull: ["$paymentMethod", "UNKNOWN"] },
      },
    },
  ]);

  return detailResponse(
    [
      "date",
      "restaurant",
      "billNo",
      "orderNo",
      "orderType",
      "menuCode",
      "item",
      "cuisine",
      "section",
      "quantity",
      "rate",
      "amount",
      "settlement",
    ],
    rows
  );
};

const runReportDetails = async (context, report, reportData) => {
  const nativeDetailTypes = new Set([
    "saleDetail",
    "settlementDetail",
    "billDetail",
    "discount",
    "continuousBills",
    "cancelledItems",
    "taxDetail",
    "billItemTax",
    "bankReport",
    "creditPayments",
    "complimentarySales",
    "nonMoving",
    "menuPrices",
    "inventoryUsage",
    "kotAnalysis",
    "cancelledOrders",
  ]);

  if (nativeDetailTypes.has(report.type)) {
    return detailResponse(reportData.columns || [], reportData.rows || []);
  }

  if (["taxRateSummary", "taxSummary"].includes(report.type)) {
    const taxDetails = await runSpecialReport(context, {
      ...report,
      type: "taxDetail",
    });
    return detailResponse(taxDetails.columns, taxDetails.rows);
  }

  if (["dailySettlement", "settlementSummary"].includes(report.type)) {
    const settlementDetails = await runSaleDetail(context, report, {
      settlementOnly: true,
    });
    return detailResponse(settlementDetails.columns, settlementDetails.rows);
  }

  if (report.group === "menu") {
    const listedItems = (reportData.rows || [])
      .map((row) => row.menuCode)
      .filter((menuCode) => menuCode && menuCode !== "-");
    const itemMatch =
      ["topItems", "leastItems"].includes(report.type) && listedItems.length > 0
        ? { "menuDoc.menuCode": { $in: listedItems } }
        : {};
    return runItemTransactionDetails(context, itemMatch);
  }

  if (report.type === "liquorDetail" || report.type === "liquorSummary") {
    return runItemTransactionDetails(context, {
      $or: [
        { "menuDoc.cuisine": /liquor|bar|beverage|alcohol/i },
        { "menuDoc.courseType": /liquor|bar|beverage|alcohol/i },
      ],
    });
  }

  if (report.type === "foodSales") {
    return runItemTransactionDetails(context, {
      $nor: [
        { "menuDoc.cuisine": /liquor|bar|beverage|alcohol/i },
        { "menuDoc.courseType": /liquor|bar|beverage|alcohol/i },
      ],
    });
  }

  if (report.type === "projectedSales") {
    const projectedDetails = await runSaleDetail(context, report);
    return detailResponse(
      ["date", "billNo", "orderNo", "settlement", "netSales", "totalCollected"],
      projectedDetails.rows
    );
  }

  const detailReport = await runSaleDetail(context, report);
  if (report.type === "hourlySales") {
    const rows = detailReport.rows.map((row) => {
      const hour = Number(String(row.date || "").slice(11, 13));
      const validHour = Number.isInteger(hour) && hour >= 0 && hour <= 23;
      const nextHour = validHour ? (hour + 1) % 24 : null;
      const formatHour = (value) => String(value).padStart(2, "0");

      return {
        timePeriod: validHour
          ? `${formatHour(hour)}:00 - ${formatHour(nextHour)}:00`
          : "-",
        date: row.date,
        billNo: row.billNo,
        orderNo: row.orderNo,
        settlement: row.settlement,
        grossSales: row.grossSales,
        discount: row.discount,
        netSales: row.netSales,
        totalCollected: row.totalCollected,
      };
    });
    return detailResponse(
      [
        "timePeriod",
        "date",
        "billNo",
        "orderNo",
        "settlement",
        "grossSales",
        "discount",
        "netSales",
        "totalCollected",
      ],
      rows
    );
  }

  if (report.type === "weekdaySales") {
    const rows = detailReport.rows.map((row) => {
      const date = new Date(`${String(row.date || "").slice(0, 10)}T00:00:00+05:30`);
      return {
        weekday: Number.isNaN(date.getTime())
          ? "-"
          : new Intl.DateTimeFormat("en-IN", {
              weekday: "long",
              timeZone: BUSINESS_TIMEZONE,
            }).format(date),
        date: row.date,
        billNo: row.billNo,
        orderNo: row.orderNo,
        settlement: row.settlement,
        netSales: row.netSales,
        totalCollected: row.totalCollected,
      };
    });
    return detailResponse(
      ["weekday", "date", "billNo", "orderNo", "settlement", "netSales", "totalCollected"],
      rows
    );
  }

  const columnsByType = {
    dailySales: [
      "date",
      "billNo",
      "orderNo",
      "orderType",
      "grossSales",
      "discount",
      "tax",
      "charges",
      "netSales",
      "totalCollected",
    ],
    monthlyBillSales: [
      "date",
      "billNo",
      "orderNo",
      "grossSales",
      "discount",
      "tax",
      "netSales",
      "totalCollected",
    ],
    dateSalesSummary: [
      "date",
      "billNo",
      "orderNo",
      "settlement",
      "netSales",
      "totalCollected",
    ],
    salesSummary: [
      "date",
      "billNo",
      "grossSales",
      "complimentary",
      "discount",
      "tax",
      "charges",
      "netSales",
      "totalCollected",
    ],
    tableSales: [
      "date",
      "table",
      "billNo",
      "orderNo",
      "waiter",
      "netSales",
      "totalCollected",
    ],
    serverSales: [
      "date",
      "waiter",
      "billNo",
      "orderNo",
      "table",
      "netSales",
      "totalCollected",
    ],
    cashierSales: [
      "date",
      "cashier",
      "billNo",
      "orderNo",
      "settlement",
      "netSales",
      "totalCollected",
    ],
  };
  const columns = columnsByType[report.type] || detailReport.columns;
  return detailResponse(
    columns,
    detailReport.rows.map((row) =>
      Object.fromEntries(columns.map((column) => [column, row[column]]))
    )
  );
};

const runContinuousBills = async (context, report) => {
  const bills = await Bill.find(context.billMatch)
    .populate("restaurant", "name")
    .populate("order", "orderNo")
    .sort({ restaurant: 1, paidAt: 1, updatedAt: 1 })
    .limit(context.limit)
    .lean();

  const previousByRestaurant = new Map();
  const rows = bills.map((bill, index) => {
    const restaurantId = String(bill.restaurant?._id || bill.restaurant || "");
    const numericBillNo = /^\d+$/.test(String(bill.billNo || ""))
      ? Number(bill.billNo)
      : null;
    const previousNumber = previousByRestaurant.get(restaurantId);
    const gap =
      numericBillNo !== null && previousNumber !== undefined
        ? Math.max(0, numericBillNo - previousNumber - 1)
        : 0;

    if (numericBillNo !== null) previousByRestaurant.set(restaurantId, numericBillNo);

    return {
      serial: index + 1,
      date: bill.paidAt || bill.updatedAt,
      restaurant: bill.restaurant?.name || "-",
      billNo: bill.billNo || "-",
      orderNo: bill.order?.orderNo || "-",
      previousBillNo: previousNumber ?? "-",
      missingBills: gap,
      status: gap > 0 ? "GAP FOUND" : "CONTINUOUS",
      amount: money(bill.totalAmount),
    };
  });

  return reportResponse(
    report,
    [
      "serial",
      "date",
      "restaurant",
      "billNo",
      "orderNo",
      "previousBillNo",
      "missingBills",
      "status",
      "amount",
    ],
    rows,
    {
      bills: rows.length,
      gaps: rows.reduce((sum, row) => sum + row.missingBills, 0),
      revenue: money(rows.reduce((sum, row) => sum + row.amount, 0)),
    }
  );
};

const runTaxRateSummary = async (context, report) => {
  const rows = await Bill.aggregate([
    ...billBasePipeline(context.billMatch),
    {
      $group: {
        _id: {
          cgstRate: { $ifNull: ["$cgstRate", 0] },
          sgstRate: { $ifNull: ["$sgstRate", 0] },
        },
        bills: { $sum: 1 },
        taxable: { $sum: "$itemsTotal" },
        cgst: { $sum: "$cgst" },
        sgst: { $sum: "$sgst" },
        total: { $sum: "$totalAmount" },
      },
    },
    { $sort: { "_id.cgstRate": 1, "_id.sgstRate": 1 } },
    {
      $project: {
        _id: 0,
        cgstRate: "$_id.cgstRate",
        sgstRate: "$_id.sgstRate",
        bills: 1,
        taxable: { $round: ["$taxable", 2] },
        cgst: { $round: ["$cgst", 2] },
        sgst: { $round: ["$sgst", 2] },
        totalTax: { $round: [{ $add: ["$cgst", "$sgst"] }, 2] },
        total: { $round: ["$total", 2] },
      },
    },
  ]);

  return reportResponse(
    report,
    ["cgstRate", "sgstRate", "bills", "taxable", "cgst", "sgst", "totalTax", "total"],
    rows,
    {
      taxSlabs: rows.length,
      taxable: money(rows.reduce((sum, row) => sum + Number(row.taxable || 0), 0)),
      totalTax: money(rows.reduce((sum, row) => sum + Number(row.totalTax || 0), 0)),
    }
  );
};

const runBillItemTax = async (context, report) => {
  const rows = await Bill.aggregate([
    { $match: context.billMatch },
    { $addFields: { reportDate: { $ifNull: ["$paidAt", "$updatedAt"] } } },
    {
      $lookup: {
        from: "restaurants",
        localField: "restaurant",
        foreignField: "_id",
        as: "restaurantDoc",
      },
    },
    { $unwind: { path: "$restaurantDoc", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "orders",
        localField: "order",
        foreignField: "_id",
        as: "orderDoc",
      },
    },
    { $unwind: "$orderDoc" },
    { $unwind: "$orderDoc.items" },
    { $match: { "orderDoc.items.status": { $ne: "CANCELLED" } } },
    {
      $lookup: {
        from: "menus",
        localField: "orderDoc.items.menuItem",
        foreignField: "_id",
        as: "menuDoc",
      },
    },
    { $unwind: { path: "$menuDoc", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        itemTaxable: {
          $multiply: ["$orderDoc.items.quantity", "$orderDoc.items.price"],
        },
      },
    },
    {
      $addFields: {
        itemRatio: {
          $cond: [
            { $gt: ["$itemsTotal", 0] },
            { $divide: ["$itemTaxable", "$itemsTotal"] },
            0,
          ],
        },
      },
    },
    { $sort: { reportDate: -1, billNo: 1 } },
    { $limit: context.limit },
    {
      $project: {
        _id: 0,
        date: {
          $dateToString: {
            date: "$reportDate",
            format: "%Y-%m-%d",
            timezone: BUSINESS_TIMEZONE,
          },
        },
        restaurant: { $ifNull: ["$restaurantDoc.name", "-"] },
        billNo: 1,
        orderNo: "$orderDoc.orderNo",
        item: { $ifNull: ["$menuDoc.name", "Deleted Menu Item"] },
        quantity: "$orderDoc.items.quantity",
        rate: { $round: ["$orderDoc.items.price", 2] },
        taxable: { $round: ["$itemTaxable", 2] },
        cgstRate: 1,
        cgst: {
          $round: [
            { $multiply: [{ $ifNull: ["$cgst", 0] }, "$itemRatio"] },
            2,
          ],
        },
        sgstRate: 1,
        sgst: {
          $round: [
            { $multiply: [{ $ifNull: ["$sgst", 0] }, "$itemRatio"] },
            2,
          ],
        },
      },
    },
  ]);

  return reportResponse(
    report,
    [
      "date",
      "restaurant",
      "billNo",
      "orderNo",
      "item",
      "quantity",
      "rate",
      "taxable",
      "cgstRate",
      "cgst",
      "sgstRate",
      "sgst",
    ],
    rows,
    {
      lineItems: rows.length,
      taxable: money(rows.reduce((sum, row) => sum + Number(row.taxable || 0), 0)),
      tax: money(
        rows.reduce(
          (sum, row) => sum + Number(row.cgst || 0) + Number(row.sgst || 0),
          0
        )
      ),
    }
  );
};

const itemSalesPipeline = (context, extraMatch = {}) => [
  { $match: context.billMatch },
  { $addFields: { reportDate: { $ifNull: ["$paidAt", "$updatedAt"] } } },
  { $lookup: { from: "restaurants", localField: "restaurant", foreignField: "_id", as: "restaurantDoc" } },
  { $unwind: { path: "$restaurantDoc", preserveNullAndEmptyArrays: true } },
  { $lookup: { from: "orders", localField: "order", foreignField: "_id", as: "orderDoc" } },
  { $unwind: "$orderDoc" },
  { $unwind: "$orderDoc.items" },
  { $match: { "orderDoc.items.status": { $ne: "CANCELLED" } } },
  { $lookup: { from: "menus", localField: "orderDoc.items.menuItem", foreignField: "_id", as: "menuDoc" } },
  { $unwind: { path: "$menuDoc", preserveNullAndEmptyArrays: true } },
  { $match: extraMatch },
  {
    $group: {
      _id: "$orderDoc.items.menuItem",
      restaurant: { $first: { $ifNull: ["$restaurantDoc.name", "-"] } },
      menuCode: { $first: { $ifNull: ["$menuDoc.menuCode", "-"] } },
      name: { $first: { $ifNull: ["$menuDoc.name", "Deleted Menu Item"] } },
      cuisine: { $first: { $ifNull: ["$menuDoc.cuisine", "-"] } },
      courseType: { $first: { $ifNull: ["$menuDoc.courseType", "-"] } },
      billIds: { $addToSet: "$_id" },
      quantity: { $sum: "$orderDoc.items.quantity" },
      revenue: {
        $sum: { $multiply: ["$orderDoc.items.quantity", "$orderDoc.items.price"] },
      },
    },
  },
];

const runItemSales = async (
  context,
  report,
  { sort = { revenue: -1 }, extraMatch = {}, includeAveragePerBill = false } = {}
) => {
  const rows = await Bill.aggregate([
    ...itemSalesPipeline(context, extraMatch),
    { $sort: sort },
    { $limit: context.limit },
    {
      $project: {
        _id: 0,
        restaurant: 1,
        menuCode: 1,
        name: 1,
        cuisine: 1,
        courseType: 1,
        bills: { $size: "$billIds" },
        quantity: 1,
        averagePrice: {
          $round: [
            { $cond: [{ $gt: ["$quantity", 0] }, { $divide: ["$revenue", "$quantity"] }, 0] },
            2,
          ],
        },
        averagePerBill: {
          $round: [
            {
              $cond: [
                { $gt: [{ $size: "$billIds" }, 0] },
                { $divide: ["$quantity", { $size: "$billIds" }] },
                0,
              ],
            },
            2,
          ],
        },
        revenue: { $round: ["$revenue", 2] },
      },
    },
  ]);
  const columns = [
    "restaurant",
    "menuCode",
    "name",
    "cuisine",
    "courseType",
    "bills",
    "quantity",
    ...(includeAveragePerBill ? ["averagePerBill"] : []),
    "averagePrice",
    "revenue",
  ];
  return reportResponse(report, columns, rows, {
    items: rows.length,
    bills: rows.reduce((sum, row) => sum + Number(row.bills || 0), 0),
    quantity: rows.reduce((sum, row) => sum + Number(row.quantity || 0), 0),
    revenue: money(rows.reduce((sum, row) => sum + Number(row.revenue || 0), 0)),
    ...(includeAveragePerBill
      ? { note: "Pax is not stored on orders; average quantity per bill is shown instead." }
      : {}),
  });
};

const runMenuSectionSales = async (context, report, extraMatch = {}) => {
  const rows = await Bill.aggregate([
    { $match: context.billMatch },
    { $lookup: { from: "orders", localField: "order", foreignField: "_id", as: "orderDoc" } },
    { $unwind: "$orderDoc" },
    { $unwind: "$orderDoc.items" },
    { $match: { "orderDoc.items.status": { $ne: "CANCELLED" } } },
    { $lookup: { from: "menus", localField: "orderDoc.items.menuItem", foreignField: "_id", as: "menuDoc" } },
    { $unwind: { path: "$menuDoc", preserveNullAndEmptyArrays: true } },
    { $match: extraMatch },
    {
      $group: {
        _id: {
          cuisine: { $ifNull: ["$menuDoc.cuisine", "Uncategorised"] },
          courseType: { $ifNull: ["$menuDoc.courseType", "Uncategorised"] },
        },
        bills: { $addToSet: "$_id" },
        items: { $addToSet: "$orderDoc.items.menuItem" },
        quantity: { $sum: "$orderDoc.items.quantity" },
        revenue: {
          $sum: {
            $multiply: ["$orderDoc.items.quantity", "$orderDoc.items.price"],
          },
        },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: context.limit },
    {
      $project: {
        _id: 0,
        cuisine: "$_id.cuisine",
        section: "$_id.courseType",
        bills: { $size: "$bills" },
        items: { $size: "$items" },
        quantity: 1,
        revenue: { $round: ["$revenue", 2] },
      },
    },
  ]);

  return reportResponse(
    report,
    ["cuisine", "section", "bills", "items", "quantity", "revenue"],
    rows,
    {
      sections: rows.length,
      quantity: rows.reduce((sum, row) => sum + Number(row.quantity || 0), 0),
      revenue: money(rows.reduce((sum, row) => sum + Number(row.revenue || 0), 0)),
    }
  );
};

const runTemporalItems = async (context, report, unit) => {
  const dateExpression =
    unit === "weekday"
      ? {
          $dayOfWeek: {
            date: { $ifNull: ["$paidAt", "$updatedAt"] },
            timezone: BUSINESS_TIMEZONE,
          },
        }
      : {
          $dateToString: {
            date: { $ifNull: ["$paidAt", "$updatedAt"] },
            format: unit === "month" ? "%Y-%m" : "%Y-%m-%d",
            timezone: BUSINESS_TIMEZONE,
          },
        };
  const rows = await Bill.aggregate([
    { $match: context.billMatch },
    { $lookup: { from: "orders", localField: "order", foreignField: "_id", as: "orderDoc" } },
    { $unwind: "$orderDoc" },
    { $unwind: "$orderDoc.items" },
    { $match: { "orderDoc.items.status": { $ne: "CANCELLED" } } },
    { $lookup: { from: "menus", localField: "orderDoc.items.menuItem", foreignField: "_id", as: "menuDoc" } },
    { $unwind: { path: "$menuDoc", preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { period: dateExpression, item: "$orderDoc.items.menuItem" },
        item: { $first: { $ifNull: ["$menuDoc.name", "Deleted Menu Item"] } },
        quantity: { $sum: "$orderDoc.items.quantity" },
        revenue: { $sum: { $multiply: ["$orderDoc.items.quantity", "$orderDoc.items.price"] } },
      },
    },
    { $sort: { "_id.period": 1, revenue: -1 } },
    { $limit: context.limit },
    {
      $project: {
        _id: 0,
        period:
          unit === "weekday"
            ? {
                $arrayElemAt: [
                  ["", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                  "$_id.period",
                ],
              }
            : "$_id.period",
        item: 1,
        quantity: 1,
        revenue: { $round: ["$revenue", 2] },
      },
    },
  ]);
  return reportResponse(report, ["period", "item", "quantity", "revenue"], rows);
};

const runSpecialReport = async (context, report) => {
  switch (report.type) {
    case "summary":
    case "salesSummary": {
      const [row = {}] = await Bill.aggregate([
        { $match: context.billMatch },
        {
          $group: {
            _id: null,
            bills: { $sum: 1 },
            grossSales: { $sum: "$itemsTotal" },
            complimentary: { $sum: "$complimentaryAmount" },
            discounts: { $sum: "$discount" },
            tax: { $sum: { $add: ["$cgst", "$sgst"] } },
            charges: {
              $sum: {
                $add: [
                  { $ifNull: ["$serviceCharge", 0] },
                  { $ifNull: ["$packagingCharge", 0] },
                  { $ifNull: ["$extraCharge", 0] },
                ],
              },
            },
            revenue: { $sum: "$totalAmount" },
          },
        },
        {
          $project: {
            _id: 0,
            bills: 1,
            grossSales: { $round: ["$grossSales", 2] },
            complimentary: { $round: ["$complimentary", 2] },
            discounts: { $round: ["$discounts", 2] },
            tax: { $round: ["$tax", 2] },
            charges: { $round: ["$charges", 2] },
            revenue: { $round: ["$revenue", 2] },
            averageBill: {
              $round: [
                { $cond: [{ $gt: ["$bills", 0] }, { $divide: ["$revenue", "$bills"] }, 0] },
                2,
              ],
            },
          },
        },
      ]);
      return reportResponse(
        report,
        ["bills", "grossSales", "complimentary", "discounts", "tax", "charges", "revenue", "averageBill"],
        row.bills ? [row] : [],
        row
      );
    }
    case "discount": {
      const rows = await Bill.aggregate([
        ...billBasePipeline({ ...context.billMatch, discount: { $gt: 0 } }),
        { $sort: { reportDate: -1 } },
        { $limit: context.limit },
        { $project: { _id: 0, date: { $dateToString: { date: "$reportDate", format: "%Y-%m-%d" } }, restaurant: "$restaurantDoc.name", billNo: 1, discountType: 1, discountValue: 1, discount: { $round: ["$discount", 2] }, totalAmount: { $round: ["$totalAmount", 2] } } },
      ]);
      return reportResponse(report, ["date", "restaurant", "billNo", "discountType", "discountValue", "discount", "totalAmount"], rows);
    }
    case "taxDetail": {
      const rows = await Bill.aggregate([
        ...billBasePipeline(context.billMatch),
        { $sort: { reportDate: -1 } },
        { $limit: context.limit },
        { $project: { _id: 0, date: { $dateToString: { date: "$reportDate", format: "%Y-%m-%d" } }, restaurant: "$restaurantDoc.name", billNo: 1, taxable: { $round: ["$itemsTotal", 2] }, cgstRate: 1, cgst: { $round: ["$cgst", 2] }, sgstRate: 1, sgst: { $round: ["$sgst", 2] }, total: { $round: ["$totalAmount", 2] } } },
      ]);
      return reportResponse(report, ["date", "restaurant", "billNo", "taxable", "cgstRate", "cgst", "sgstRate", "sgst", "total"], rows);
    }
    case "taxSummary": {
      const [row = {}] = await Bill.aggregate([
        { $match: context.billMatch },
        {
          $group: {
            _id: null,
            bills: { $sum: 1 },
            taxable: { $sum: "$itemsTotal" },
            cgst: { $sum: "$cgst" },
            sgst: { $sum: "$sgst" },
            invoiceTotal: { $sum: "$totalAmount" },
          },
        },
        {
          $project: {
            _id: 0,
            bills: 1,
            taxable: { $round: ["$taxable", 2] },
            cgst: { $round: ["$cgst", 2] },
            sgst: { $round: ["$sgst", 2] },
            totalTax: { $round: [{ $add: ["$cgst", "$sgst"] }, 2] },
            invoiceTotal: { $round: ["$invoiceTotal", 2] },
          },
        },
      ]);
      return reportResponse(
        report,
        ["bills", "taxable", "cgst", "sgst", "totalTax", "invoiceTotal"],
        row.bills ? [row] : [],
        row
      );
    }
    case "complimentary":
    case "complimentarySales": {
      const rows = await Bill.aggregate([
        ...billBasePipeline({ ...context.billMatch, complimentaryAmount: { $gt: 0 } }),
        { $sort: { reportDate: -1 } },
        { $limit: context.limit },
        { $project: { _id: 0, date: { $dateToString: { date: "$reportDate", format: "%Y-%m-%d" } }, restaurant: "$restaurantDoc.name", billNo: 1, type: "$complimentaryType", note: "$complimentaryNote", amount: { $round: ["$complimentaryAmount", 2] }, total: { $round: ["$totalAmount", 2] } } },
      ]);
      return reportResponse(report, ["date", "restaurant", "billNo", "type", "note", "amount", "total"], rows);
    }
    case "cancelledOrders": {
      const rows = await Order.find({ restaurant: { $in: context.restaurantIds }, status: "CANCELLED", updatedAt: { $gte: context.start, $lte: context.end } })
        .populate("restaurant", "name")
        .populate("table", "tableNumber")
        .populate("waiter", "name")
        .populate("items.menuItem", "name")
        .sort({ updatedAt: -1 })
        .limit(context.limit)
        .lean();
      const reportRows = rows.map((row) => ({
        date: row.updatedAt,
        restaurant: row.restaurant?.name || "-",
        orderNo: row.orderNo,
        orderType: row.orderType || "OTHER",
        table: row.table?.tableNumber || "-",
        waiter: row.waiter?.name || "-",
        items: row.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
        amount: money(
          row.items.reduce(
            (sum, item) =>
              sum + Number(item.quantity || 0) * Number(item.price || 0),
            0
          )
        ),
      }));
      return reportResponse(
        report,
        ["date", "restaurant", "orderNo", "orderType", "table", "waiter", "items", "amount"],
        reportRows,
        {
          cancelledOrders: reportRows.length,
          items: reportRows.reduce((sum, row) => sum + Number(row.items || 0), 0),
          amount: money(reportRows.reduce((sum, row) => sum + Number(row.amount || 0), 0)),
        }
      );
    }
    case "cancelledItems": {
      const rows = await Order.aggregate([
        { $match: { restaurant: { $in: context.restaurantIds } } },
        { $unwind: "$items" },
        { $match: { "items.status": "CANCELLED" } },
        {
          $addFields: {
            cancellationDate: { $ifNull: ["$items.cancelledAt", "$updatedAt"] },
          },
        },
        {
          $match: {
            cancellationDate: { $gte: context.start, $lte: context.end },
          },
        },
        { $lookup: { from: "restaurants", localField: "restaurant", foreignField: "_id", as: "restaurantDoc" } },
        { $unwind: { path: "$restaurantDoc", preserveNullAndEmptyArrays: true } },
        { $lookup: { from: "menus", localField: "items.menuItem", foreignField: "_id", as: "menuDoc" } },
        { $unwind: { path: "$menuDoc", preserveNullAndEmptyArrays: true } },
        { $lookup: { from: "employees", localField: "items.cancelledBy", foreignField: "_id", as: "employeeDoc" } },
        { $unwind: { path: "$employeeDoc", preserveNullAndEmptyArrays: true } },
        { $sort: { cancellationDate: -1 } },
        { $limit: context.limit },
        {
          $project: {
            _id: 0,
            date: "$cancellationDate",
            restaurant: { $ifNull: ["$restaurantDoc.name", "-"] },
            orderNo: 1,
            item: { $ifNull: ["$menuDoc.name", "Deleted Menu Item"] },
            quantity: "$items.quantity",
            rate: { $round: ["$items.price", 2] },
            amount: {
              $round: [{ $multiply: ["$items.quantity", "$items.price"] }, 2],
            },
            reason: "$items.cancellationReason",
            stage: "$items.cancellationStage",
            cancelledBy: { $ifNull: ["$employeeDoc.name", "-"] },
          },
        },
      ]);
      return reportResponse(
        report,
        ["date", "restaurant", "orderNo", "item", "quantity", "rate", "amount", "reason", "stage", "cancelledBy"],
        rows,
        {
          cancelledItems: rows.length,
          quantity: rows.reduce((sum, row) => sum + Number(row.quantity || 0), 0),
          amount: money(rows.reduce((sum, row) => sum + Number(row.amount || 0), 0)),
        }
      );
    }
    case "kotAnalysis": {
      let rows = await KotPrintJob.aggregate([
        {
          $match: {
            restaurant: { $in: context.restaurantIds },
            createdAt: { $gte: context.start, $lte: context.end },
          },
        },
        {
          $addFields: {
            itemCount: {
              $sum: {
                $map: {
                  input: { $ifNull: ["$payload.items", []] },
                  as: "item",
                  in: { $ifNull: ["$$item.quantity", 0] },
                },
              },
            },
          },
        },
        {
          $group: {
            _id: {
              date: {
                $dateToString: {
                  date: "$createdAt",
                  format: "%Y-%m-%d",
                  timezone: BUSINESS_TIMEZONE,
                },
              },
              cuisine: { $ifNull: ["$cuisine", "GENERAL"] },
              status: { $ifNull: ["$status", "PENDING"] },
            },
            kots: { $sum: 1 },
            items: { $sum: "$itemCount" },
          },
        },
        { $sort: { "_id.date": 1, "_id.cuisine": 1, "_id.status": 1 } },
        {
          $project: {
            _id: 0,
            date: "$_id.date",
            cuisine: "$_id.cuisine",
            status: "$_id.status",
            kots: 1,
            items: 1,
            averageItemsPerKot: {
              $round: [
                { $cond: [{ $gt: ["$kots", 0] }, { $divide: ["$items", "$kots"] }, 0] },
                2,
              ],
            },
          },
        },
      ]);

      if (rows.length === 0) {
        rows = await Order.aggregate([
          {
            $match: {
              restaurant: { $in: context.restaurantIds },
              "kot.printed": true,
              "kot.printedAt": { $gte: context.start, $lte: context.end },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  date: "$kot.printedAt",
                  format: "%Y-%m-%d",
                  timezone: BUSINESS_TIMEZONE,
                },
              },
              kots: { $sum: 1 },
              items: { $sum: { $sum: "$items.quantity" } },
            },
          },
          { $sort: { _id: 1 } },
          {
            $project: {
              _id: 0,
              date: "$_id",
              cuisine: "ALL",
              status: "PRINTED",
              kots: 1,
              items: 1,
              averageItemsPerKot: {
                $round: [
                  { $cond: [{ $gt: ["$kots", 0] }, { $divide: ["$items", "$kots"] }, 0] },
                  2,
                ],
              },
            },
          },
        ]);
      }

      if (rows.length === 0) {
        rows = await Order.aggregate([
          {
            $match: {
              restaurant: { $in: context.restaurantIds },
              status: { $in: ["SERVED", "PAID"] },
              createdAt: { $gte: context.start, $lte: context.end },
            },
          },
          { $unwind: "$items" },
          { $match: { "items.status": { $ne: "CANCELLED" } } },
          {
            $lookup: {
              from: "menus",
              localField: "items.menuItem",
              foreignField: "_id",
              as: "menuDoc",
            },
          },
          { $unwind: { path: "$menuDoc", preserveNullAndEmptyArrays: true } },
          {
            $group: {
              _id: {
                order: "$_id",
                date: {
                  $dateToString: {
                    date: "$createdAt",
                    format: "%Y-%m-%d",
                    timezone: BUSINESS_TIMEZONE,
                  },
                },
                cuisine: { $ifNull: ["$menuDoc.cuisine", "GENERAL"] },
              },
              items: { $sum: "$items.quantity" },
            },
          },
          {
            $group: {
              _id: {
                date: "$_id.date",
                cuisine: "$_id.cuisine",
              },
              kots: { $sum: 1 },
              items: { $sum: "$items" },
            },
          },
          { $sort: { "_id.date": 1, "_id.cuisine": 1 } },
          {
            $project: {
              _id: 0,
              date: "$_id.date",
              cuisine: "$_id.cuisine",
              status: "RECORDED_FROM_ORDER",
              kots: 1,
              items: 1,
              averageItemsPerKot: {
                $round: [
                  { $cond: [{ $gt: ["$kots", 0] }, { $divide: ["$items", "$kots"] }, 0] },
                  2,
                ],
              },
            },
          },
        ]);
      }

      return reportResponse(report, ["date", "cuisine", "status", "kots", "items", "averageItemsPerKot"], rows, {
        kots: rows.reduce((sum, row) => sum + Number(row.kots || 0), 0),
        items: rows.reduce((sum, row) => sum + Number(row.items || 0), 0),
        pending: rows.reduce((sum, row) => sum + (row.status === "PENDING" ? Number(row.kots || 0) : 0), 0),
        printed: rows.reduce((sum, row) => sum + (row.status === "PRINTED" ? Number(row.kots || 0) : 0), 0),
        failed: rows.reduce((sum, row) => sum + (row.status === "FAILED" ? Number(row.kots || 0) : 0), 0),
        recordedFromOrders: rows.reduce((sum, row) => sum + (row.status === "RECORDED_FROM_ORDER" ? Number(row.kots || 0) : 0), 0),
      });
    }
    case "nonMoving": {
      const soldIds = await Bill.aggregate([...itemSalesPipeline(context), { $project: { _id: 1 } }]);
      const rows = await Menu.find({ restaurant: { $in: context.restaurantIds }, _id: { $nin: soldIds.map((row) => row._id) } })
        .populate("restaurant", "name")
        .select("name menuCode cuisine courseType price restaurant")
        .sort({ name: 1 })
        .limit(context.limit)
        .lean();
      return reportResponse(report, ["restaurant", "menuCode", "name", "cuisine", "courseType", "price"], rows.map((row) => ({ restaurant: row.restaurant?.name || "-", menuCode: row.menuCode, name: row.name, cuisine: row.cuisine, courseType: row.courseType, price: row.price })));
    }
    case "menuPrices": {
      const rows = await Menu.find({ restaurant: { $in: context.restaurantIds } }).populate("restaurant", "name").sort({ updatedAt: -1 }).limit(context.limit).lean();
      return reportResponse(
        report,
        ["restaurant", "menuCode", "name", "cuisine", "courseType", "currentPrice", "lastUpdated"],
        rows.map((row) => ({
          restaurant: row.restaurant?.name || "-",
          menuCode: row.menuCode,
          name: row.name,
          cuisine: row.cuisine,
          courseType: row.courseType,
          currentPrice: money(row.price),
          lastUpdated: row.updatedAt,
        })),
        {
          items: rows.length,
          message: "Historical MRP values are unavailable because menu price history is not stored.",
        }
      );
    }
    case "inventoryUsage": {
      const rows = await InventoryLog.aggregate([
        { $match: { restaurant: { $in: context.restaurantIds }, createdAt: { $gte: context.start, $lte: context.end }, quantityAdded: { $lt: 0 } } },
        { $lookup: { from: "inventories", localField: "item", foreignField: "_id", as: "itemDoc" } },
        { $unwind: { path: "$itemDoc", preserveNullAndEmptyArrays: true } },
        { $group: { _id: "$item", item: { $first: "$itemDoc.name" }, unit: { $first: "$unit" }, consumed: { $sum: { $abs: "$quantityAdded" } } } },
        { $sort: { consumed: -1 } },
        { $limit: context.limit },
        { $project: { _id: 0, item: { $ifNull: ["$item", "Deleted Inventory Item"] }, unit: 1, consumed: { $round: ["$consumed", 2] } } },
      ]);
      return reportResponse(report, ["item", "unit", "consumed"], rows, {
        items: rows.length,
        totalConsumed: money(rows.reduce((sum, row) => sum + Number(row.consumed || 0), 0)),
        message: "Monetary food cost is unavailable because inventory unit cost is not stored.",
      });
    }
    case "projectedSales": {
      const [row = {}] = await Bill.aggregate([
        { $match: context.billMatch },
        { $group: { _id: null, revenue: { $sum: "$totalAmount" }, firstDate: { $min: { $ifNull: ["$paidAt", "$updatedAt"] } }, lastDate: { $max: { $ifNull: ["$paidAt", "$updatedAt"] } } } },
      ]);
      const days = Math.max(1, Math.ceil(((row.lastDate || context.end) - (row.firstDate || context.start)) / 86400000) + 1);
      const averageDaily = money(Number(row.revenue || 0) / days);
      const result = { periodDays: days, actualRevenue: money(row.revenue), averageDaily, projected30Days: money(averageDaily * 30) };
      return reportResponse(report, Object.keys(result), [result], result);
    }
    default:
      return null;
  }
};

const runReport = async (context, report) => {
  const special = await runSpecialReport(context, report);
  if (special) return special;

  switch (report.type) {
    case "dailySales":
      return runSalesGrouped(context, report, {
        id: {
          date: {
            $dateToString: {
              date: "$reportDate",
              format: "%Y-%m-%d",
              timezone: BUSINESS_TIMEZONE,
            },
          },
          restaurant: "$restaurant",
        },
        project: {
          date: "$_id.date",
          restaurant: "$restaurantName",
        },
        sort: { "_id.date": 1, "_id.restaurant": 1 },
        columns: [
          "date",
          "restaurant",
          "bills",
          "grossSales",
          "complimentary",
          "discounts",
          "cgst",
          "sgst",
          "serviceCharge",
          "packagingCharge",
          "extraCharge",
          "netSales",
          "totalCollected",
          "averageBill",
        ],
      });
    case "monthlyBillSales":
      return runSalesGrouped(context, report, {
        id: {
          month: {
            $dateToString: {
              date: "$reportDate",
              format: "%Y-%m",
              timezone: BUSINESS_TIMEZONE,
            },
          },
          restaurant: "$restaurant",
        },
        project: {
          month: "$_id.month",
          restaurant: "$restaurantName",
        },
        sort: { "_id.month": 1, "_id.restaurant": 1 },
        columns: [
          "month",
          "restaurant",
          "bills",
          "grossSales",
          "complimentary",
          "discounts",
          "cgst",
          "sgst",
          "netSales",
          "totalCollected",
          "averageBill",
        ],
      });
    case "dateSalesSummary":
      return runSalesGrouped(context, report, {
        id: {
          $dateToString: {
            date: "$reportDate",
            format: "%Y-%m-%d",
            timezone: BUSINESS_TIMEZONE,
          },
        },
        project: { date: "$_id" },
        sort: { _id: 1 },
        columns: [
          "date",
          "bills",
          "grossSales",
          "complimentary",
          "discounts",
          "cgst",
          "sgst",
          "netSales",
          "totalCollected",
          "averageBill",
        ],
      });
    case "tableSales":
      return runSalesGrouped(context, report, {
        lookup: [
          {
            $lookup: {
              from: "tables",
              localField: "orderDoc.table",
              foreignField: "_id",
              as: "tableDoc",
            },
          },
          { $unwind: { path: "$tableDoc", preserveNullAndEmptyArrays: true } },
        ],
        id: {
          restaurant: "$restaurant",
          table: "$orderDoc.table",
          tableNumber: "$tableDoc.tableNumber",
        },
        project: {
          restaurant: "$restaurantName",
          table: {
            $cond: [
              { $ne: [{ $ifNull: ["$_id.tableNumber", null] }, null] },
              { $concat: ["Table ", { $toString: "$_id.tableNumber" }] },
              "Takeaway / No table",
            ],
          },
        },
        columns: [
          "restaurant",
          "table",
          "bills",
          "grossSales",
          "discounts",
          "netSales",
          "totalCollected",
          "averageBill",
        ],
      });
    case "serverSales":
      return runSalesGrouped(context, report, {
        lookup: [
          {
            $lookup: {
              from: "employees",
              localField: "orderDoc.waiter",
              foreignField: "_id",
              as: "employeeDoc",
            },
          },
          { $unwind: { path: "$employeeDoc", preserveNullAndEmptyArrays: true } },
        ],
        id: {
          restaurant: "$restaurant",
          employee: "$orderDoc.waiter",
          name: "$employeeDoc.name",
          employeeId: "$employeeDoc.employeeId",
        },
        project: {
          restaurant: "$restaurantName",
          server: { $ifNull: ["$_id.name", "Unassigned"] },
          employeeId: { $ifNull: ["$_id.employeeId", "-"] },
        },
        columns: [
          "restaurant",
          "server",
          "employeeId",
          "bills",
          "grossSales",
          "discounts",
          "netSales",
          "totalCollected",
          "averageBill",
        ],
      });
    case "cashierSales":
      return runSalesGrouped(context, report, {
        lookup: [
          {
            $lookup: {
              from: "employees",
              localField: "accountant",
              foreignField: "_id",
              as: "employeeDoc",
            },
          },
          { $unwind: { path: "$employeeDoc", preserveNullAndEmptyArrays: true } },
        ],
        id: {
          restaurant: "$restaurant",
          employee: "$accountant",
          name: "$employeeDoc.name",
          employeeId: "$employeeDoc.employeeId",
        },
        project: {
          restaurant: "$restaurantName",
          cashier: { $ifNull: ["$_id.name", "Unassigned"] },
          employeeId: { $ifNull: ["$_id.employeeId", "-"] },
        },
        columns: [
          "restaurant",
          "cashier",
          "employeeId",
          "bills",
          "grossSales",
          "discounts",
          "netSales",
          "totalCollected",
          "averageBill",
        ],
      });
    case "settlementSummary":
      return runSalesGrouped(context, report, {
        id: { $ifNull: ["$paymentMethod", "UNKNOWN"] },
        project: { settlement: "$_id" },
        columns: [
          "settlement",
          "bills",
          "grossSales",
          "discounts",
          "cgst",
          "sgst",
          "netSales",
          "totalCollected",
          "averageBill",
        ],
      });
    case "dailySettlement":
      return runSalesGrouped(context, report, {
        id: {
          date: {
            $dateToString: {
              date: "$reportDate",
              format: "%Y-%m-%d",
              timezone: BUSINESS_TIMEZONE,
            },
          },
          method: { $ifNull: ["$paymentMethod", "UNKNOWN"] },
        },
        project: { date: "$_id.date", settlement: "$_id.method" },
        sort: { "_id.date": 1, "_id.method": 1 },
        columns: [
          "date",
          "settlement",
          "bills",
          "grossSales",
          "discounts",
          "netSales",
          "totalCollected",
        ],
      });
    case "saleDetail":
      return runSaleDetail(context, report);
    case "settlementDetail":
      return runSaleDetail(context, report, { settlementOnly: true });
    case "billDetail":
      return runBillDetail(context, report);
    case "continuousBills":
      return runContinuousBills(context, report);
    case "taxRateSummary":
      return runTaxRateSummary(context, report);
    case "billItemTax":
      return runBillItemTax(context, report);
    case "bankReport": {
      const bankContext = {
        ...context,
        billMatch: {
          ...context.billMatch,
          paymentMethod: { $in: ["UPI", "CARD"] },
        },
      };
      return runSaleDetail(bankContext, report, { settlementOnly: true });
    }
    case "creditPayments":
      return reportResponse(
        report,
        ["date", "restaurant", "billNo", "account", "received", "balance"],
        [],
        {
          records: 0,
          message:
            "Credit-account payments are not available because the current billing schema supports CASH, UPI, and CARD only.",
        }
      );
    case "foodSales":
      return runItemSales(context, report, {
        extraMatch: {
          $nor: [
            { "menuDoc.cuisine": /liquor|bar|beverage|alcohol/i },
            { "menuDoc.courseType": /liquor|bar|beverage|alcohol/i },
          ],
        },
      });
    case "menuMixSales":
    case "menuMixProduct":
    case "itemQuantitySales":
      return runItemSales(context, report);
    case "menuMixPax":
      return runItemSales(context, report, { includeAveragePerBill: true });
    case "productSales":
      return runItemSales(context, report);
    case "menuSectionSales":
      return runMenuSectionSales(context, report);
    case "itemSales":
    case "foodSale":
      return runItemSales(context, report);
    case "topItems":
      return runItemSales(context, report);
    case "leastItems":
      return runItemSales(context, report, { sort: { quantity: 1, revenue: 1 } });
    case "liquorDetail":
      return runItemSales(context, report, {
        extraMatch: {
          $or: [
            { "menuDoc.cuisine": /liquor|bar|beverage|alcohol/i },
            { "menuDoc.courseType": /liquor|bar|beverage|alcohol/i },
          ],
        },
      });
    case "liquorSummary":
      return runMenuSectionSales(context, report, {
        $or: [
          { "menuDoc.cuisine": /liquor|bar|beverage|alcohol/i },
          { "menuDoc.courseType": /liquor|bar|beverage|alcohol/i },
        ],
      });
    case "liquorSales":
      return runItemSales(context, report, { extraMatch: { $or: [{ "menuDoc.cuisine": /liquor|bar|beverage|alcohol/i }, { "menuDoc.courseType": /liquor|bar|beverage|alcohol/i }] } });
    case "sectionSales":
      return runMenuSectionSales(context, report);
    case "itemWeekday":
      return runTemporalItems(context, report, "weekday");
    case "itemDate":
      return runTemporalItems(context, report, "date");
    case "itemMonth":
      return runTemporalItems(context, report, "month");
    case "hourlySales":
      return runSalesGrouped(context, report, {
        id: {
          $hour: {
            date: "$reportDate",
            timezone: BUSINESS_TIMEZONE,
          },
        },
        project: {
          timePeriod: {
            $concat: [
              {
                $cond: [
                  { $lt: ["$_id", 10] },
                  { $concat: ["0", { $toString: "$_id" }] },
                  { $toString: "$_id" },
                ],
              },
              ":00 - ",
              {
                $cond: [
                  { $lt: [{ $mod: [{ $add: ["$_id", 1] }, 24] }, 10] },
                  {
                    $concat: [
                      "0",
                      { $toString: { $mod: [{ $add: ["$_id", 1] }, 24] } },
                    ],
                  },
                  { $toString: { $mod: [{ $add: ["$_id", 1] }, 24] } },
                ],
              },
              ":00",
            ],
          },
        },
        sort: { _id: 1 },
        columns: [
          "timePeriod",
          "bills",
          "grossSales",
          "discounts",
          "netSales",
          "totalCollected",
          "averageBill",
        ],
      });
    case "weekdaySales":
      return runSalesGrouped(context, report, {
        id: {
          $dayOfWeek: {
            date: "$reportDate",
            timezone: BUSINESS_TIMEZONE,
          },
        },
        project: {
          weekday: {
            $arrayElemAt: [
              ["", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
              "$_id",
            ],
          },
        },
        sort: { _id: 1 },
        columns: [
          "weekday",
          "bills",
          "grossSales",
          "discounts",
          "netSales",
          "totalCollected",
          "averageBill",
        ],
      });
    default:
      return reportResponse(report, [], [], { message: "No data available for this report" });
  }
};

export const getAdminReportCatalog = (_req, res) => {
  res.json({ success: true, data: REPORTS.map(({ type, ...report }) => report) });
};

export const getAdminReportRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find({ admin: req.user.id })
      .select("_id name")
      .sort({ name: 1 })
      .lean();

    res.json({
      success: true,
      data: restaurants.map(({ _id, name }) => ({ _id, name })),
    });
  } catch (error) {
    console.error("ADMIN REPORT RESTAURANTS ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load restaurants",
    });
  }
};

const buildAdminReportData = async (req) => {
  const report = REPORT_BY_KEY.get(req.params.key);
  if (!report) throw reportError("Report not found", 404);

  const { start, end } = parseRange(req.query);
  const restaurants = await getRestaurantScope(req.user.id, req.query.restaurantId);
  const restaurantIds = restaurants.map((restaurant) => restaurant._id);
  const requestedLimit = Number(req.query.limit || 1000);
  if (!Number.isFinite(requestedLimit)) {
    throw reportError("Report limit must be a number");
  }
  const limit = Math.min(Math.max(Math.floor(requestedLimit), 1), 5000);
  const context = {
    start,
    end,
    limit,
    restaurantIds,
    billMatch:
      report.type === "hourlySales"
        ? addTimeRangeToBillMatch(
            billMatch(restaurantIds, start, end),
            req.query.startTime,
            req.query.endTime
          )
        : billMatch(restaurantIds, start, end),
  };

  const data = await runReport(context, report);
  const details = await runReportDetails(context, report, data);
  const selectedRestaurant =
    restaurants.find(
      (restaurant) => String(restaurant._id) === String(req.query.restaurantId)
    ) || restaurants[0] || null;

  return {
    report,
    data: {
      ...data,
      details,
      filters: {
        startDate: start,
        endDate: end,
        restaurantId: req.query.restaurantId || "",
        restaurantName:
          selectedRestaurant?.name ||
          (restaurants.length > 1 ? "All Restaurants" : "Restaurant"),
        restaurants: restaurants.map(({ _id, name }) => ({ _id, name })),
        startTime: req.query.startTime || "",
        endTime: req.query.endTime || "",
      },
    },
  };
};

const exportValue = (value) => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return value;
};

const humanizeColumn = (value) =>
  String(value || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const styleExcelHeader = (row) => {
  row.height = 24;
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
  row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF047857" } };
  row.eachCell((cell) => {
    cell.border = {
      top: { style: "thin", color: { argb: "FFCBD5E1" } },
      left: { style: "thin", color: { argb: "FFCBD5E1" } },
      bottom: { style: "thin", color: { argb: "FFCBD5E1" } },
      right: { style: "thin", color: { argb: "FFCBD5E1" } },
    };
  });
};

const configureExcelSheet = (worksheet) => {
  worksheet.views = [{ state: "frozen", ySplit: 1 }];
  worksheet.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9,
    margins: {
      left: 0.25,
      right: 0.25,
      top: 0.5,
      bottom: 0.5,
      header: 0.2,
      footer: 0.2,
    },
  };
  worksheet.headerFooter.oddFooter = "Page &P of &N";
};

const addExcelDataSheet = (
  workbook,
  name,
  columns,
  rows,
  metadata = null
) => {
  const worksheet = workbook.addWorksheet(name);
  configureExcelSheet(worksheet);
  let headerRowNumber = 1;

  if (metadata) {
    const mergeEnd = Math.max(columns.length, 4);
    worksheet.mergeCells(1, 1, 1, mergeEnd);
    worksheet.getCell(1, 1).value = metadata.restaurantName;
    worksheet.getCell(1, 1).font = {
      bold: true,
      size: 18,
      color: { argb: "FFFFFFFF" },
    };
    worksheet.getCell(1, 1).alignment = {
      horizontal: "center",
      vertical: "middle",
    };
    worksheet.getCell(1, 1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF047857" },
    };
    worksheet.getRow(1).height = 32;

    worksheet.mergeCells(2, 1, 2, mergeEnd);
    worksheet.getCell(2, 1).value = metadata.reportTitle;
    worksheet.getCell(2, 1).font = {
      bold: true,
      size: 14,
      color: { argb: "FF0F172A" },
    };
    worksheet.getCell(2, 1).alignment = { horizontal: "center" };

    worksheet.mergeCells(3, 1, 3, mergeEnd);
    worksheet.getCell(3, 1).value = `Report Period: ${metadata.period}`;
    worksheet.getCell(3, 1).alignment = { horizontal: "center" };
    worksheet.getCell(3, 1).font = { color: { argb: "FF475569" } };
    worksheet.addRow([]);
    headerRowNumber = 5;
  }

  if (!columns.length) {
    const row = worksheet.addRow(["No data available"]);
    row.getCell(1).font = { italic: true, color: { argb: "FF64748B" } };
    worksheet.getColumn(1).width = 24;
    return worksheet;
  }

  const header = worksheet.addRow(columns.map(humanizeColumn));
  styleExcelHeader(header);
  worksheet.autoFilter = {
    from: { row: headerRowNumber, column: 1 },
    to: { row: headerRowNumber, column: columns.length },
  };

  rows.forEach((row, rowIndex) => {
    const excelRow = worksheet.addRow(columns.map((column) => exportValue(row[column])));
    excelRow.alignment = { vertical: "top", wrapText: true };
    if (rowIndex % 2 === 1) {
      excelRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF8FAFC" },
      };
    }
    excelRow.eachCell((cell) => {
      cell.border = {
        bottom: { style: "hair", color: { argb: "FFE2E8F0" } },
      };
      if (typeof cell.value === "number") cell.numFmt = "#,##0.00";
    });
  });

  columns.forEach((column, index) => {
    const values = [humanizeColumn(column), ...rows.map((row) => exportValue(row[column]))];
    worksheet.getColumn(index + 1).width = Math.min(
      36,
      Math.max(12, ...values.map((value) => String(value ?? "").length + 2))
    );
  });
  worksheet.views = [{ state: "frozen", ySplit: headerRowNumber }];

  return worksheet;
};

const writePdfTable = (doc, title, columns, rows, drawPageHeader) => {
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#047857").text(title);
  doc.moveDown(0.5);
  if (!columns.length || !rows.length) {
    doc.font("Helvetica").fontSize(8).fillColor("#475569").text("No data available");
    doc.moveDown();
    return;
  }

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const columnWidth = pageWidth / columns.length;
  const drawRow = (values, header = false) => {
    const rowHeight = header ? 26 : 22;
    if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      drawPageHeader();
      drawRow(columns.map(humanizeColumn), true);
    }
    const y = doc.y;
    if (header) {
      doc
        .rect(doc.page.margins.left, y - 3, pageWidth, rowHeight)
        .fill("#ecfdf5");
    }
    values.forEach((value, index) => {
      doc
        .font(header ? "Helvetica-Bold" : "Helvetica")
        .fontSize(columns.length > 9 ? 5.5 : 7)
        .fillColor(header ? "#065f46" : "#334155")
        .text(String(exportValue(value)), doc.page.margins.left + index * columnWidth, y, {
          width: columnWidth - 4,
          height: rowHeight,
          ellipsis: true,
        });
    });
    doc.y = y + rowHeight;
    doc
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .strokeColor("#e2e8f0")
      .stroke();
  };

  drawRow(columns.map(humanizeColumn), true);
  rows.forEach((row) => drawRow(columns.map((column) => row[column])));
  doc.moveDown();
};

export const generateAdminReport = async (req, res) => {
  try {
    const { data } = await buildAdminReportData(req);
    res.json({ success: true, data });
  } catch (error) {
    console.error("ADMIN REPORT ERROR:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to generate report",
    });
  }
};

export const exportAdminReport = async (req, res) => {
  try {
    const format = String(req.query.format || "xlsx").toLowerCase();
    if (!["xlsx", "pdf", "csv"].includes(format)) {
      throw reportError("Export format must be xlsx, pdf, or csv");
    }

    const { report, data } = await buildAdminReportData(req);
    const generatedAt = new Date();
    const periodStart = businessDateString(data.filters.startDate);
    const periodEnd = businessDateString(data.filters.endDate);
    const periodLabel =
      data.filters.startTime && data.filters.endTime
        ? `${periodStart} ${data.filters.startTime} to ${periodEnd} ${data.filters.endTime}`
        : `${periodStart} to ${periodEnd}`;
    const safeRestaurantName = String(data.filters.restaurantName || "restaurant")
      .replace(/[<>:"/\\|?*]+/g, "-")
      .replace(/\s+/g, "-")
      .toLowerCase();
    const fileBase = `${safeRestaurantName}-${report.key}-${periodStart}-to-${periodEnd}`;
    const detailColumns = data.details?.columns || [];
    const detailRows = data.details?.rows || [];
    const summaryRows = Object.entries(data.summary || {}).map(([label, value]) => ({
      label: humanizeColumn(label),
      value: exportValue(value),
    }));

    if (format === "xlsx") {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Restaurant Admin Reports";
      workbook.created = generatedAt;
      workbook.modified = generatedAt;
      workbook.subject = report.title;
      workbook.title = `${data.filters.restaurantName} - ${report.title}`;

      const excelDetailColumns =
        detailColumns.length > 0 ? detailColumns : data.columns || [];
      const excelDetailRows =
        detailColumns.length > 0 ? detailRows : data.rows || [];
      addExcelDataSheet(
        workbook,
        "Detailed Report",
        excelDetailColumns,
        excelDetailRows,
        {
          restaurantName: data.filters.restaurantName,
          reportTitle: report.title,
          period: periodLabel,
        }
      );
      workbook.views = [{ activeTab: 0, firstSheet: 0, visibility: "visible" }];

      const overview = workbook.addWorksheet("Overview", {
        properties: { tabColor: { argb: "FF047857" } },
      });
      configureExcelSheet(overview);
      overview.mergeCells("A1:D1");
      overview.getCell("A1").value = data.filters.restaurantName;
      overview.getCell("A1").font = {
        bold: true,
        size: 20,
        color: { argb: "FFFFFFFF" },
      };
      overview.getCell("A1").alignment = { vertical: "middle", horizontal: "center" };
      overview.getCell("A1").fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF047857" },
      };
      overview.getRow(1).height = 34;
      overview.mergeCells("A2:D2");
      overview.getCell("A2").value = report.title;
      overview.getCell("A2").font = { bold: true, size: 16, color: { argb: "FF0F172A" } };
      overview.getCell("A2").alignment = { horizontal: "center" };
      overview.addRow([]);
      [
        ["Report Period", periodLabel],
        ["Generated At", generatedAt.toLocaleString("en-IN", { timeZone: BUSINESS_TIMEZONE })],
        ["Summary Rows", (data.rows || []).length],
        ["Detailed Records", detailRows.length],
      ].forEach(([label, value]) => {
        const row = overview.addRow([label, value]);
        row.getCell(1).font = { bold: true, color: { argb: "FF475569" } };
        row.getCell(2).font = { bold: true, color: { argb: "FF0F172A" } };
      });
      overview.addRow([]);
      const summaryHeader = overview.addRow(["Summary Metric", "Value"]);
      styleExcelHeader(summaryHeader);
      summaryRows.forEach((item, index) => {
        const row = overview.addRow([item.label, item.value]);
        if (index % 2 === 1) {
          row.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF8FAFC" },
          };
        }
        if (typeof item.value === "number") row.getCell(2).numFmt = "#,##0.00";
      });
      overview.getColumn(1).width = 28;
      overview.getColumn(2).width = 30;
      overview.views = [{ state: "frozen", ySplit: 2 }];

      addExcelDataSheet(workbook, "Report Summary", data.columns || [], data.rows || []);

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", `attachment; filename="${fileBase}.xlsx"`);
      await workbook.xlsx.write(res);
      return res.end();
    }

    if (format === "pdf") {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${fileBase}.pdf"`);
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margin: 30,
        bufferPages: true,
        info: {
          Title: `${data.filters.restaurantName} - ${report.title}`,
          Author: "Restaurant Admin Reports",
          Subject: periodLabel,
        },
      });
      doc.pipe(res);

      const drawPageHeader = () => {
        const left = doc.page.margins.left;
        const width = doc.page.width - left - doc.page.margins.right;
        doc.rect(left, 22, width, 46).fill("#047857");
        doc
          .font("Helvetica-Bold")
          .fontSize(15)
          .fillColor("#ffffff")
          .text(data.filters.restaurantName, left + 12, 31, {
            width: width - 24,
            align: "center",
          });
        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor("#d1fae5")
          .text(report.title, left + 12, 51, {
            width: width - 24,
            align: "center",
          });
        doc.y = 78;
      };

      drawPageHeader();
      doc
        .font("Helvetica-Bold")
        .fontSize(18)
        .fillColor("#0f172a")
        .text(report.title);
      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor("#475569")
        .text(`Report period: ${periodLabel}`)
        .text(
          `Generated: ${generatedAt.toLocaleString("en-IN", {
            timeZone: BUSINESS_TIMEZONE,
          })}`
        );
      doc.moveDown();
      writePdfTable(doc, "Executive Summary", ["label", "value"], summaryRows, drawPageHeader);
      writePdfTable(
        doc,
        "Report Summary Data",
        data.columns || [],
        data.rows || [],
        drawPageHeader
      );
      if (detailColumns.length > 0) {
        writePdfTable(
          doc,
          "Detailed Records",
          detailColumns,
          detailRows,
          drawPageHeader
        );
      }

      const pageRange = doc.bufferedPageRange();
      for (let index = 0; index < pageRange.count; index += 1) {
        doc.switchToPage(pageRange.start + index);
        const footerY = doc.page.height - 22;
        doc
          .font("Helvetica")
          .fontSize(7)
          .fillColor("#64748b")
          .text(
            `${data.filters.restaurantName}  •  ${report.title}`,
            doc.page.margins.left,
            footerY,
            { continued: true }
          )
          .text(`Page ${index + 1} of ${pageRange.count}`, {
            align: "right",
          });
      }
      return doc.end();
    }

    const csvCell = (value) => `"${String(exportValue(value)).replaceAll('"', '""')}"`;
    const section = (title, columns, rows) => [
      csvCell(title),
      columns.map((column) => csvCell(humanizeColumn(column))).join(","),
      ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(",")),
      "",
    ];
    const csv = [
      [csvCell("Restaurant"), csvCell(data.filters.restaurantName)].join(","),
      [csvCell("Report"), csvCell(report.title)].join(","),
      [csvCell("Report Period"), csvCell(periodLabel)].join(","),
      [
        csvCell("Generated At"),
        csvCell(generatedAt.toLocaleString("en-IN", { timeZone: BUSINESS_TIMEZONE })),
      ].join(","),
      "",
      ...section("EXECUTIVE SUMMARY", ["label", "value"], summaryRows),
      ...section("REPORT SUMMARY DATA", data.columns || [], data.rows || []),
      ...(detailColumns.length > 0
        ? section("DETAILED RECORDS", detailColumns, detailRows)
        : []),
    ].join("\r\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${fileBase}.csv"`);
    return res.send(`\uFEFF${csv}`);
  } catch (error) {
    console.error("ADMIN REPORT EXPORT ERROR:", error);
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "Failed to export report",
    });
  }
};
