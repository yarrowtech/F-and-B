import ExcelJS from "exceljs";
import Order from "../models/Order.model.js";
import Restaurant from "../models/Restaurant.model.js";
import { cancellationRows } from "../utils/itemCancellation.js";
import { isTestModeActive } from "../utils/testMode.js";

export const getItemCancellationReport = async (req, res, range) => {
  const [restaurant, orders] = await Promise.all([
    Restaurant.findById(req.user.restaurant).select("name").lean(),
    Order.find({ restaurant: req.user.restaurant, "cancellations.cancelledAt": { $gte: range.start, $lt: range.end } })
      .select("orderNo cancellations").sort({ "cancellations.cancelledAt": 1 }).lean(),
  ]);
  const rows = cancellationRows(orders, range.start, range.end);
  const columns = [["orderNo", "Order"], ["table", "Table"], ["name", "Item"], ["quantity", "Cancelled Qty"], ["amount", "Item Value"], ["reason", "Reason"], ["cancelledBy", "Cancelled By"], ["cancelledAt", "Time (IST)"], ["cancellationId", "Cancellation ID"]];
  const localTime = (value) => new Date(value).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  if (req.query.format === "excel") {
    const book = new ExcelJS.Workbook();
    const sheet = book.addWorksheet("Item Cancellations");
    sheet.addRow([restaurant?.name || "Restaurant", req.query.date, isTestModeActive() ? "TEST REPORT" : "Item cancellations"]);
    sheet.addRow(columns.map(([, label]) => label)).font = { bold: true };
    for (const row of rows) sheet.addRow(columns.map(([key]) => key === "cancelledAt" ? localTime(row[key]) : row[key]));
    sheet.columns.forEach((column) => { column.width = 24; });
    sheet.getColumn(6).width = 50;
    sheet.eachRow((row) => { row.alignment = { wrapText: true, vertical: "top" }; });
    sheet.views = [{ state: "frozen", ySplit: 2 }];
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="item-cancellations-${req.query.date}.xlsx"`);
    await book.xlsx.write(res);
    return res.end();
  }
  const wrap = (text) => String(text ?? "").replace(/[\x00-\x1f\x7f]/g, " ").match(/.{1,32}/g) || [""];
  const receiptText = [
    ...(isTestModeActive() ? ["*** TEST REPORT ***"] : []),
    ...wrap(restaurant?.name), "ITEM CANCELLATION REPORT", `${req.query.date} (IST)`,
    ...rows.flatMap((row) => ["--------------------------------", ...wrap(`Order ${row.orderNo} / Table ${row.table}`), ...wrap(`${row.quantity} x ${row.name}`), ...wrap(`Reason: ${row.reason}`), ...wrap(`By: ${row.cancelledBy}`), localTime(row.cancelledAt)]),
    ...(!rows.length ? ["No cancellations for this date"] : []),
  ].join("\n") + "\n".repeat(9) + "\x1d\x56\x00";
  return res.json({ success: true, data: { date: req.query.date, restaurantName: restaurant?.name, isTest: isTestModeActive(), cancellations: rows, receiptText } });
};
