import Table from "../models/Table.model.js";
import TABLE_STATUS from "../constants/tableStatus.js";

const occupyTable = async (tableId, orderId) => {
  const table = await Table.findById(tableId);
  if (!table) throw new Error("Table not found");

  if (table.status === TABLE_STATUS.OCCUPIED) {
    throw new Error("Table already occupied");
  }

  table.status = TABLE_STATUS.OCCUPIED;
  table.activeOrderId = orderId;
  await table.save();

  return table;
};

const freeTable = async (tableId) => {
  const table = await Table.findById(tableId);
  if (!table) throw new Error("Table not found");

  table.status = TABLE_STATUS.FREE;
  table.activeOrderId = null;
  await table.save();

  return table;
};

export default {
  occupyTable,
  freeTable,
};
