export const normalizePaymentMethod = (value) => String(value || "").trim().toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "").slice(0, 32) || "UNKNOWN";

// Include configured methods with zero sales and historical methods with sales.
export const dashboardPayments = (restaurants, rows = []) => {
  const payments = new Map();
  for (const restaurant of restaurants) {
    const configured = restaurant?.billingTemplate?.paymentMethods;
    for (const method of configured?.length ? configured : ["CASH", "CARD", "UPI"]) {
      const key = normalizePaymentMethod(method);
      if (!payments.has(key)) payments.set(key, { method: key, amount: 0, count: 0 });
    }
  }
  for (const row of rows) {
    const method = normalizePaymentMethod(row.method);
    const entry = payments.get(method) || { method, amount: 0, count: 0 };
    entry.amount += Number(row.amount || 0);
    entry.count += Number(row.count || 0);
    payments.set(method, entry);
  }
  return [...payments.values()].map((row) => ({ ...row, amount: Math.round((row.amount + Number.EPSILON) * 100) / 100 }));
};
