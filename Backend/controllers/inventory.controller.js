import Inventory from "../models/Inventory.model.js";

/* ================= HELPER ================= */

const sendSuccess = (res, data, status = 200) =>
  res.status(status).json({ success: true, data });

const sendError = (res, message, status = 400) =>
  res.status(status).json({ success: false, message });

/* ================= CREATE INVENTORY ITEM ================= */

export const createInventoryItem = async (req, res) => {
  try {
    const { name, unit, quantity, lowStockThreshold } = req.body;

    if (!name || !unit)
      return sendError(res, "Name and unit are required");

    const item = await Inventory.create({
      restaurant: req.params.restaurantId,
      name,
      unit,
      quantity: quantity || 0,
      lowStockThreshold: lowStockThreshold || 0,
      lastUpdatedBy: req.user.id,
    });

    return sendSuccess(res, item, 201);
  } catch (err) {
    if (err.code === 11000)
      return sendError(res, "Inventory item already exists");
    return sendError(res, err.message);
  }
};

/* ================= GET INVENTORY ================= */

export const getInventory = async (req, res) => {
  try {
    const items = await Inventory.find({
      restaurant: req.params.restaurantId,
      isActive: true,
    }).sort({ createdAt: -1 });

    return sendSuccess(res, items);
  } catch (err) {
    return sendError(res, err.message);
  }
};

/* ================= UPDATE INVENTORY ================= */

export const updateInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.findOne({
      _id: req.params.id,
      restaurant: req.params.restaurantId,
    });

    if (!item)
      return sendError(res, "Inventory item not found", 404);

    const { name, unit, quantity, lowStockThreshold } = req.body;

    if (name !== undefined) item.name = name;
    if (unit !== undefined) item.unit = unit;
    if (quantity !== undefined) item.quantity = quantity;
    if (lowStockThreshold !== undefined)
      item.lowStockThreshold = lowStockThreshold;

    item.lastUpdatedBy = req.user.id;

    await item.save();

    return sendSuccess(res, item);
  } catch (err) {
    return sendError(res, err.message);
  }
};

/* ================= DELETE (SOFT DELETE) ================= */

export const deleteInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.findOne({
      _id: req.params.id,
      restaurant: req.params.restaurantId,
    });

    if (!item)
      return sendError(res, "Inventory item not found", 404);

    item.isActive = false;
    await item.save();

    return sendSuccess(res, { message: "Deleted successfully" });
  } catch (err) {
    return sendError(res, err.message);
  }
};
