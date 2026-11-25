import ExcelJS from "exceljs";
import Bill from "../models/Bill.model.js";
import Restaurant from "../models/Restaurant.model.js";
import { isTestModeActive } from "../utils/testMode.js";
import { salesDateRange, buildSalesReport, buildSalesReceipt, reportColumns } from "../utils/accountantSalesReport.js";

export const getAccountantSalesReport = async (req, res) => {
  try {
    const { date, type = "daily", format = "json" } = req.query;
    if (!["daily", "items"].includes(type) || !["json", "excel"].includes(format)) return res.status(400).json({ message: "Invalid report type or format" });
    if (!req.user.restaurant) return res.status(403).json({ message: "Restaurant access required" });
    let range;
    try { range = salesDateRange(date); } catch (error) { return res.status(400).json({ message: error.message }); }
    const [restaurant, bills] = await Promise.all([
      Restaurant.findById(req.user.restaurant).select("name").lean(),
      Bill.find({ restaurant: req.user.restaurant, paymentStatus: "PAID", paidAt: { $gte: range.start, $lt: range.end } })
        .populate({ path: "order", populate: [{ path: "table", select: "tableNumber" }, { path: "items.menuItem", select: "name price" }] })
        .sort({ paidAt: 1, _id: 1 }).lean(),
    ]);
    const report = buildSalesReport(bills, { date, restaurantName: restaurant?.name || "Restaurant", isTest: isTestModeActive() });
    if (format === "json") return res.json({ success: true, data: { ...report, receiptText: buildSalesReceipt(report, type) } });
    const book = new ExcelJS.Workbook();
    const sheet = book.addWorksheet(type === "items" ? "Item-wise Sales" : "Daily Sales");
    sheet.addRow([report.restaurantName]);
    sheet.addRow([type === "items" ? "Item-wise Sales Report" : "Daily Sales Report", date, "Asia/Kolkata"]);
    sheet.addRow([report.isTest ? "TEST REPORT - paid test bills only" : "Paid bills only; voided bills excluded"]);
    if (type === "items") sheet.addRow(["Item values before bill discounts and GST; complimentary quantities shown separately"]);
    if (report.missingOrders && type === "items") sheet.addRow([`Warning: ${report.missingOrders} bill(s) have missing item details`]);
    const columns = reportColumns(type);
    sheet.addRow(columns.map(([, label]) => label)).font = { bold: true };
    const rows = type === "items" ? report.items : report.daily;
    for (const row of rows) sheet.addRow(columns.map(([key]) => row[key]));
    if (type === "items") sheet.addRow(["TOTAL", rows.reduce((s, r) => s + r.quantity, 0), rows.reduce((s, r) => s + r.complimentaryQuantity, 0), rows.reduce((s, r) => s + r.amount, 0)]);
    else sheet.addRow(["TOTAL", "", "", report.summary.items, report.summary.discounts, report.summary.cgst, report.summary.sgst, report.summary.charges, report.summary.roundOff, report.summary.collected]);
    sheet.columns.forEach((column, i) => { column.width = i === 0 ? 30 : 16; });
    sheet.eachRow((row) => row.eachCell((cell) => { if (typeof cell.value === "number") cell.numFmt = "0.00"; }));
    const summary = book.addWorksheet("Summary");
    summary.addRow(["Date (IST)", date]);
    for (const [key, value] of Object.entries(report.summary)) summary.addRow([key, value]);
    summary.addRow(["Payment method", "Collected"]);
    for (const entry of Object.entries(report.payments)) summary.addRow(entry);
    summary.columns = [{ width: 25 }, { width: 20 }];
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="${type}-sales-${date}.xlsx"`);
    await book.xlsx.write(res);
    res.end();
  } catch (error) {
    if (!res.headersSent) res.status(500).json({ message: "Unable to generate sales report" });
  }
};
