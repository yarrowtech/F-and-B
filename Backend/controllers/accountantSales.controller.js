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
    const header = sheet.addRow(columns.map(([, label]) => label));
    header.font = { bold: true, color: { argb: "FFFFFFFF" } };
    header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF047857" } };
    header.height = 26;
    for (let rowNumber = 1; rowNumber < header.number; rowNumber += 1) {
      const row = sheet.getRow(rowNumber);
      const text = row.values.slice(1).filter(Boolean).join(" | ");
      row.eachCell((cell) => { cell.value = null; });
      sheet.mergeCells(rowNumber, 1, rowNumber, columns.length);
      row.getCell(1).value = text;
      row.getCell(1).alignment = { wrapText: true, vertical: "middle" };
      row.height = rowNumber === 1 ? 30 : 32;
    }
    sheet.getRow(1).font = { bold: true, size: 16, color: { argb: "FF065F46" } };
    sheet.views = [{ state: "frozen", ySplit: header.number }];
    sheet.autoFilter = { from: { row: header.number, column: 1 }, to: { row: header.number, column: columns.length } };
    const rows = type === "items" ? report.items : report.daily;
    for (const row of rows) sheet.addRow(columns.map(([key]) => row[key]));
    if (type === "items") sheet.addRow(["TOTAL", rows.reduce((s, r) => s + r.quantity, 0), rows.reduce((s, r) => s + r.complimentaryQuantity, 0), rows.reduce((s, r) => s + r.amount, 0)]);
    else sheet.addRow(["TOTAL", "", "", report.summary.items, report.summary.discounts, report.summary.cgst, report.summary.sgst, report.summary.charges, report.summary.roundOff, report.summary.collected]);
    sheet.columns.forEach((column, i) => { column.width = i === 0 ? 38 : 18; });
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber <= header.number) return;
      row.height = 24;
      row.eachCell((cell, columnNumber) => {
        const key = columns[columnNumber - 1][0];
        cell.alignment = { vertical: "middle", wrapText: true };
        if (typeof cell.value === "number") cell.numFmt = ["quantity", "complimentaryQuantity", "table"].includes(key) ? "0.##" : '#,##0.00;[Red]-#,##0.00';
      });
    });
    sheet.lastRow.font = { bold: true };
    sheet.lastRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } };
    sheet.pageSetup = { orientation: type === "daily" ? "landscape" : "portrait", paperSize: 9, fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: `${header.number}:${header.number}` };
    const summary = book.addWorksheet("Summary");
    summary.addRow(["Date (IST)", date]);
    const labels = { billCount: "Paid Bills", items: "Items", discounts: "Discounts", cgst: "CGST", sgst: "SGST", charges: "Charges", roundOff: "Round Off", collected: "Total Collected" };
    for (const [key, value] of Object.entries(report.summary)) {
      const row = summary.addRow([labels[key], value]);
      row.getCell(2).numFmt = key === "billCount" ? "0" : "#,##0.00";
    }
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
