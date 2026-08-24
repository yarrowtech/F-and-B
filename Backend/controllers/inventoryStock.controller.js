import mongoose from "mongoose";
import Inventory from "../models/Inventory.model.js";
import InventoryStock from "../models/InventoryStock.model.js";
import InventoryStockTransfer from "../models/InventoryStockTransfer.model.js";
import InventoryLog from "../models/InventoryLog.model.js";
import KitchenSection from "../models/KitchenSection.model.js";
import {
  adjustStockQuantity,
  getWarehouseQuantitySnapshot,
} from "../utils/inventoryStock.js";

/* ================= HELPER ================= */

const sendSuccess = (res, data, status = 200) =>
  res.status(status).json({ success: true, data });

const sendError = (res, message, status = 400) =>
  res.status(status).json({ success: false, message });

const getRestaurantId = (req) =>
  String(req.user.role || "").toLowerCase() === "admin"
    ? req.params.restaurantId
    : req.user.restaurant;

/* ================= STOCK BY LOCATION ================= */
/* GET /api/inventory-stock/:restaurantId */

export const getStockByLocation = async (req, res) => {
  try {
    const restaurantId = getRestaurantId(req);
    if (!restaurantId) return sendError(res, "restaurantId is required");

    const [items, stockRows] = await Promise.all([
      Inventory.find({ restaurant: restaurantId, isActive: true })
        .select("name unit category quantity lowStockThreshold")
        .sort({ name: 1 }),
      InventoryStock.find({ restaurant: restaurantId })
        .populate("section", "name")
        .lean(),
    ]);

    const rowsByItem = new Map();
    for (const row of stockRows) {
      const key = String(row.item);
      const bucket = rowsByItem.get(key) || [];
      bucket.push(row);
      rowsByItem.set(key, bucket);
    }

    const data = await Promise.all(items.map(async (item) => {
      const rows = rowsByItem.get(String(item._id)) || [];
      const warehouseRow = rows.find((row) => row.locationType === "WAREHOUSE");
      const sectionRows = rows.filter((row) => row.locationType === "SECTION" && row.section);
      const warehouseQty = warehouseRow
        ? Number(warehouseRow.quantity || 0)
        : await getWarehouseQuantitySnapshot({
            restaurant: restaurantId,
            item: item._id,
          });

      return {
        item: {
          _id: item._id,
          name: item.name,
          unit: item.unit,
          category: item.category,
          totalQuantity: item.quantity,
          lowStockThreshold: item.lowStockThreshold,
        },
        warehouseQty,
        sections: sectionRows.map((row) => ({
          section: row.section,
          quantity: Number(row.quantity || 0),
        })),
      };
    }));

    return sendSuccess(res, data);
  } catch (err) {
    return sendError(res, err.message);
  }
};

/* ================= TRANSFER STOCK ================= */
/* POST /api/inventory-stock/:restaurantId/transfer */

export const transferStock = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const restaurantId = getRestaurantId(req);
    if (!restaurantId) throw Object.assign(new Error("restaurantId is required"), { status: 400 });

    const { item: itemId, section: sectionId, quantity, direction = "ISSUE", reason } = req.body;
    const normalizedQuantity = Number(quantity);

    if (!itemId || !sectionId) {
      throw Object.assign(new Error("Item and kitchen section are required"), { status: 400 });
    }
    if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) {
      throw Object.assign(new Error("Quantity must be greater than 0"), { status: 400 });
    }
    if (!["ISSUE", "RETURN"].includes(direction)) {
      throw Object.assign(new Error("Direction must be ISSUE or RETURN"), { status: 400 });
    }

    const [item, section] = await Promise.all([
      Inventory.findOne({ _id: itemId, restaurant: restaurantId, isActive: true }).session(session),
      KitchenSection.findOne({ _id: sectionId, restaurant: restaurantId }).session(session),
    ]);
    if (!item) throw Object.assign(new Error("Inventory item not found"), { status: 404 });
    if (!section) throw Object.assign(new Error("Kitchen section not found"), { status: 404 });

    const source =
      direction === "ISSUE"
        ? { locationType: "WAREHOUSE", section: null, label: "warehouse" }
        : { locationType: "SECTION", section: section._id, label: section.name };
    const destination =
      direction === "ISSUE"
        ? { locationType: "SECTION", section: section._id, label: section.name }
        : { locationType: "WAREHOUSE", section: null, label: "warehouse" };

    await adjustStockQuantity(
      { restaurant: restaurantId, item: item._id, locationType: source.locationType, section: source.section, delta: -normalizedQuantity },
      session
    );
    await adjustStockQuantity(
      { restaurant: restaurantId, item: item._id, locationType: destination.locationType, section: destination.section, delta: normalizedQuantity },
      session
    );

    const transferredByName = req.user.name || "";
    const trimmedReason = String(reason || "").trim();

    const transferRecord = new InventoryStockTransfer({
      restaurant: restaurantId,
      item: item._id,
      section: section._id,
      direction,
      quantity: normalizedQuantity,
      reason: trimmedReason,
      transferredBy: req.user.id,
      transferredByName,
    });
    await transferRecord.save({ session });

    await InventoryLog.insertMany(
      [
        {
          item: item._id,
          restaurant: restaurantId,
          quantityAdded: -normalizedQuantity,
          unit: item.unit,
          action: "TRANSFER_OUT",
          reason: trimmedReason || `Transferred to ${destination.label}`,
          addedBy: req.user.id,
          addedByName: transferredByName,
          locationType: source.locationType,
          section: source.section,
        },
        {
          item: item._id,
          restaurant: restaurantId,
          quantityAdded: normalizedQuantity,
          unit: item.unit,
          action: "TRANSFER_IN",
          reason: trimmedReason || `Received from ${source.label}`,
          addedBy: req.user.id,
          addedByName: transferredByName,
          locationType: destination.locationType,
          section: destination.section,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return sendSuccess(res, { message: "Stock transferred" }, 201);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return sendError(res, err.message, err.status || 400);
  }
};

/* ================= TRANSFER HISTORY ================= */
/* GET /api/inventory-stock/:restaurantId/transfers */

export const getStockTransferHistory = async (req, res) => {
  try {
    const restaurantId = getRestaurantId(req);
    if (!restaurantId) return sendError(res, "restaurantId is required");

    const query = { restaurant: restaurantId };
    if (req.query.item) query.item = req.query.item;
    if (req.query.section) query.section = req.query.section;

    const transfers = await InventoryStockTransfer.find(query)
      .populate("item", "name unit")
      .populate("section", "name")
      .sort({ createdAt: -1 })
      .limit(200);

    return sendSuccess(res, transfers);
  } catch (err) {
    return sendError(res, err.message);
  }
};
