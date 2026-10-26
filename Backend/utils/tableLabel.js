/* "3" for a single table, "3 + 4 + 5" when tables are joined for one group. */
export const getOrderTableNumbers = (order) => {
  const numbers = [];
  const main = order?.table?.tableNumber;
  if (main !== undefined && main !== null && main !== "") numbers.push(main);

  (order?.joinedTables || []).forEach((table) => {
    const number = table?.tableNumber;
    if (number !== undefined && number !== null && number !== "") numbers.push(number);
  });

  return numbers;
};

export const getOrderTableLabel = (order, fallback = "") => {
  const numbers = getOrderTableNumbers(order);
  return numbers.length > 0 ? numbers.join(" + ") : fallback;
};

export const getOrderTableIds = (order) =>
  [order?.table, ...(order?.joinedTables || [])]
    .map((table) => String(table?._id || table || ""))
    .filter(Boolean);
