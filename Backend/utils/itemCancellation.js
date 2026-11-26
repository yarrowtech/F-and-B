const clean = (value) => String(value ?? "").replace(/[\x00-\x1f\x7f]/g, " ").trim();

// Validate the entire request before changing any order lines.
export const planItemCancellations = (items, changes) => {
  if (!Array.isArray(changes) || !changes.length) throw new Error("No changes to save");
  const seen = new Set();
  return changes.map((change) => {
    const id = String(change.itemId || "");
    if (seen.has(id)) throw new Error("An item can only be changed once per request");
    seen.add(id);
    const item = items.find((entry) => String(entry._id) === id);
    if (!item || item.status === "CANCELLED") throw new Error("Item not found on this table");
    const quantity = change.quantity;
    if (!Number.isInteger(quantity) || quantity < 0 || quantity >= item.quantity) {
      throw new Error("Enter a lower whole-number quantity. Use Add Item to add more.");
    }
    const reason = typeof change.reason === "string" ? clean(change.reason) : "";
    if (!reason || reason.length > 500) throw new Error("A cancellation reason of 1–500 characters is required");
    if (change.previousQuantity !== item.quantity) throw new Error("Item quantity changed. Refresh the table and try again.");
    return { item, quantity, cancelledQuantity: item.quantity - quantity, reason };
  });
};

export const cancellationReceipt = ({ restaurantName, table, orderNo, event, isTest = false }) => {
  const wrap = (value) => clean(value).match(/.{1,32}/g) || [""];
  const time = new Date(event.cancelledAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  return [
    ...(isTest ? ["*** TEST KOT ***"] : []),
    "*** CANCELLATION KOT ***", ...wrap(restaurantName),
    ...wrap(`Table: ${table} / Order: ${orderNo}`), ...wrap(`Cancellation: ${event._id}`),
    `Time: ${time} IST`, ...wrap(`By: ${event.cancelledByName}`),
    "--------------------------------", "CANCEL THESE QUANTITIES ONLY",
    ...event.items.flatMap((item) => [
      ...wrap(`${item.quantity} x ${item.name}`),
      ...wrap(`Reason: ${item.reason}`),
    ]), "--------------------------------", "DO NOT PREPARE CANCELLED ITEMS",
  ].join("\n") + "\n".repeat(9) + "\x1d\x56\x00";
};

export const cancellationRows = (orders, start, end) => orders.flatMap((order) =>
  (order.cancellations || []).filter((event) => {
    const at = new Date(event.cancelledAt);
    return at >= start && at < end;
  }).flatMap((event) => event.items.map((item) => ({
    cancellationId: String(event._id), orderNo: order.orderNo,
    table: event.tableNumber, name: item.name, quantity: item.quantity,
    amount: Math.round(item.price * item.quantity * 100) / 100, reason: item.reason,
    cancelledBy: event.cancelledByName, cancelledAt: new Date(event.cancelledAt).toISOString(),
    receiptText: event.receiptText, printerName: event.printerName || "",
  })))
);
