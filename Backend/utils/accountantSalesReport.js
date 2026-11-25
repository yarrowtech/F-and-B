const money = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

export const salesDateRange = (date) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) throw new Error("Select a valid report date");
  const calendar = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(calendar.getTime()) || calendar.toISOString().slice(0, 10) !== date) {
    throw new Error("Select a valid report date");
  }
  const start = new Date(`${date}T00:00:00+05:30`);
  return { start, end: new Date(start.getTime() + 86400000) };
};

export const buildSalesReport = (bills, { date, restaurantName, isTest = false }) => {
  const summary = { billCount: 0, items: 0, discounts: 0, cgst: 0, sgst: 0, charges: 0, roundOff: 0, collected: 0 };
  const payments = {};
  const itemMap = new Map();
  const daily = [];
  let missingOrders = 0;
  for (const bill of bills) {
    if (bill.paymentStatus !== "PAID") continue;
    const items = money(bill.itemsTotal);
    const discount = money(bill.discount);
    const cgst = money(bill.cgst);
    const sgst = money(bill.sgst);
    const charges = money(Number(bill.serviceCharge || 0) + Number(bill.packagingCharge || 0) + Number(bill.extraCharge || 0));
    const collected = money(bill.totalAmount);
    const roundOff = money(collected - (items + cgst + sgst + charges - discount));
    const payment = bill.paymentMethod || "OTHER";
    daily.push({ billNo: bill.billNo, table: bill.order?.table?.tableNumber ?? "-", payment, items, discount, cgst, sgst, charges, roundOff, collected });
    summary.billCount += 1;
    for (const [key, value] of Object.entries({ items, discounts: discount, cgst, sgst, charges, roundOff, collected })) summary[key] = money(summary[key] + value);
    payments[payment] = money((payments[payment] || 0) + collected);
    if (!bill.order?.items) { missingOrders += 1; continue; }
    const freeIds = new Set((bill.complimentaryItems || []).map(String));
    for (const item of bill.order.items) {
      if (item.status === "CANCELLED") continue;
      const menuId = item.menuItem?._id || item.menuItem;
      const name = item.name || item.menuItem?.name || "Unavailable item";
      const key = String(menuId || name);
      const row = itemMap.get(key) || { name, quantity: 0, complimentaryQuantity: 0, amount: 0 };
      const quantity = Number(item.quantity || 0);
      const free = bill.complimentaryType === "FULL_ORDER" ||
        (bill.complimentaryType === "ITEMS" && (freeIds.has(String(item._id)) || freeIds.has(String(menuId))));
      if (free) row.complimentaryQuantity += quantity;
      else {
        row.quantity += quantity;
        row.amount = money(row.amount + money(Number(item.price ?? item.menuItem?.price ?? 0) * quantity));
      }
      itemMap.set(key, row);
    }
  }
  return { date, restaurantName, isTest, summary, payments, daily, items: [...itemMap.values()].sort((a, b) => a.name.localeCompare(b.name)), missingOrders };
};

export const reportColumns = (type) => type === "items"
  ? [["name", "Item"], ["quantity", "Sold Qty"], ["complimentaryQuantity", "Free Qty"], ["amount", "Item Value"]]
  : [["billNo", "Bill No"], ["table", "Table"], ["payment", "Payment"], ["items", "Items"], ["discount", "Discount"], ["cgst", "CGST"], ["sgst", "SGST"], ["charges", "Charges"], ["roundOff", "Round Off"], ["collected", "Collected"]];

export const buildSalesReceipt = (report, type) => {
  const width = 32;
  const clean = (value) => String(value ?? "").replace(/[\x00-\x1f\x7f]/g, " ");
  const wrap = (value) => clean(value).match(/.{1,32}/g) || [""];
  const pair = (label, value) => {
    const right = clean(value);
    return clean(label).slice(0, Math.max(width - right.length - 1, 0)).padEnd(Math.max(width - right.length, 0)) + right;
  };
  const amount = (value) => Number(value || 0).toFixed(2);
  const lines = [
    ...(report.isTest ? ["*** TEST REPORT ***"] : []),
    ...wrap(report.restaurantName),
    type === "items" ? "ITEM-WISE SALES REPORT" : "DAILY SALES REPORT",
    `Date: ${report.date} (IST)`, "Paid bills only; void excluded", "-".repeat(width),
  ];
  if (type === "items") {
    for (const row of report.items) lines.push(...wrap(row.name), pair(`Sold ${row.quantity} / Free ${row.complimentaryQuantity}`, amount(row.amount)));
    lines.push("-".repeat(width), pair("Sold quantity", report.items.reduce((s, r) => s + r.quantity, 0)), pair("Free quantity", report.items.reduce((s, r) => s + r.complimentaryQuantity, 0)), pair("Item value", amount(report.items.reduce((s, r) => s + r.amount, 0))), "Before bill discounts and GST");
  } else {
    for (const row of report.daily) lines.push(...wrap(`Bill #${row.billNo} / Table ${row.table}`), pair(row.payment, amount(row.collected)));
    lines.push("-".repeat(width));
    for (const [key, label] of [["billCount", "Paid bills"], ["items", "Items"], ["discounts", "Discounts"], ["cgst", "CGST"], ["sgst", "SGST"], ["charges", "Charges"], ["roundOff", "Round off"], ["collected", "Total collected"]]) lines.push(pair(label, key === "billCount" ? report.summary[key] : amount(report.summary[key])));
    lines.push("-".repeat(width), "PAYMENT SUMMARY");
    for (const [method, value] of Object.entries(report.payments)) lines.push(pair(method, amount(value)));
  }
  if (!report.summary.billCount) lines.push("No paid sales for this date");
  if (report.missingOrders && type === "items") lines.push(...wrap(`Warning: ${report.missingOrders} bill(s) have missing item details.`));
  return lines.join("\n") + "\n".repeat(9) + "\x1d\x56\x00";
};
