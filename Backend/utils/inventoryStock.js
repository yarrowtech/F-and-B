import Inventory from "../models/Inventory.model.js";
import InventoryStock from "../models/InventoryStock.model.js";

/* ===============================
   PER-LOCATION STOCK HELPERS
   Shared by inventory.controller.js (manual add/set), vendorOrder.controller.js
   (GRN receipts), order.Controller.js (consumption), and inventoryStock.controller.js
   (transfers) so InventoryStock rows and Inventory.quantity (the aggregate) never
   drift apart.
=============================== */

export const getWarehouseQuantitySnapshot = async (
  { restaurant, item },
  session = null
) => {
  const [inventoryItem, sectionRows] = await Promise.all([
    Inventory.findOne({ _id: item, restaurant })
      .select("quantity")
      .session(session),
    InventoryStock.find({
      restaurant,
      item,
      locationType: "SECTION",
    })
      .select("quantity")
      .session(session),
  ]);

  const totalQuantity = Number(inventoryItem?.quantity || 0);
  const issuedToSections = sectionRows.reduce(
    (sum, row) => sum + Number(row.quantity || 0),
    0
  );

  return Math.max(0, totalQuantity - issuedToSections);
};

export const getOrCreateStockRow = async (
  { restaurant, item, locationType, section = null },
  session = null
) => {
  const query = { restaurant, item, locationType, section: locationType === "WAREHOUSE" ? null : section };

  let row = await InventoryStock.findOne(query).session(session);
  if (!row) {
    const initialQuantity =
      locationType === "WAREHOUSE"
        ? await getWarehouseQuantitySnapshot({ restaurant, item }, session)
        : 0;
    row = new InventoryStock({ ...query, quantity: initialQuantity });
    await row.save(session ? { session } : {});
  }
  return row;
};

/**
 * Applies `delta` (positive or negative) to a location's stock row.
 * Throws if the resulting quantity would go below 0.
 * Returns the updated row.
 */
export const adjustStockQuantity = async (
  { restaurant, item, locationType, section = null, delta },
  session = null
) => {
  const row = await getOrCreateStockRow({ restaurant, item, locationType, section }, session);

  const nextQuantity = Number(row.quantity || 0) + Number(delta || 0);
  if (nextQuantity < 0) {
    const label = locationType === "WAREHOUSE" ? "warehouse" : "this section";
    const err = new Error(`Insufficient stock in ${label}`);
    err.status = 400;
    throw err;
  }

  row.quantity = nextQuantity;
  await row.save(session ? { session } : {});
  return row;
};
