import Inventory from "../models/Inventory.model.js";
import InventoryLog from "../models/InventoryLog.model.js";

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

    const restaurantId =
      req.user.role === "admin" ? req.params.restaurantId : req.user.restaurant;

    const item = await Inventory.create({
      restaurant: restaurantId,
      name,
      unit,
      quantity: quantity || 0,
      lowStockThreshold: lowStockThreshold || 0,
      lastUpdatedBy: req.user.id,
    });

    await InventoryLog.create({
      item: item._id,
      restaurant: restaurantId,
      quantityAdded: quantity || 0,
      unit,
      action: "ADD",
      addedBy: req.user.id,
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

    let restaurantId;

    // Admin → use selected restaurant from URL
    if (req.user.role === "admin") {
      restaurantId = req.params.restaurantId;
    }

    // Manager / Chef / Inventory Manager → use own restaurant
    else {
      restaurantId = req.user.restaurant;
    }

    const items = await Inventory.find({
      restaurant: restaurantId,
      isActive: true,
    })
      .populate("lastUpdatedBy", "name role employeeId")
      .sort({ createdAt: -1 });

    return sendSuccess(res, items);

  } catch (err) {
    return sendError(res, err.message);
  }
};

/* ================= UPDATE INVENTORY ================= */

export const updateInventoryItem = async (req, res) => {
  try {
    const restaurantId =
      req.user.role === "admin" ? req.params.restaurantId : req.user.restaurant;

    const item = await Inventory.findOne({
      _id: req.params.id,
      restaurant: restaurantId,
    });

    if (!item)
      return sendError(res, "Inventory item not found", 404);

    const { name, unit, quantity, lowStockThreshold } = req.body;

    if (name !== undefined) item.name = name;
    if (unit !== undefined) item.unit = unit;

    if (quantity !== undefined) {
      const diff = quantity - item.quantity;

      item.quantity = quantity;

      await InventoryLog.create({
        item: item._id,
        restaurant: restaurantId,
        quantityAdded: diff,
        unit: item.unit,
        action: "UPDATE",
        addedBy: req.user.id,
      });
    }

    if (lowStockThreshold !== undefined)
      item.lowStockThreshold = lowStockThreshold;

    item.lastUpdatedBy = req.user.id;

    await item.save();

    return sendSuccess(res, item);
  } catch (err) {
    return sendError(res, err.message);
  }
};

/* ================= DELETE ================= */

export const deleteInventoryItem = async (req, res) => {
  try {
    const restaurantId =
      req.user.role === "admin" ? req.params.restaurantId : req.user.restaurant;

    const item = await Inventory.findOne({
      _id: req.params.id,
      restaurant: restaurantId,
    });

    if (!item)
      return sendError(res, "Inventory item not found", 404);

    item.isActive = false;
    await item.save();

    await InventoryLog.create({
      item: item._id,
      restaurant: restaurantId,
      quantityAdded: item.quantity,
      unit: item.unit,
      action: "DELETE",
      addedBy: req.user.id,
    });

    return sendSuccess(res, { message: "Deleted successfully" });
  } catch (err) {
    return sendError(res, err.message);
  }
};

/* ================= MANAGER / ADMIN INVENTORY VIEW ================= */

export const getManagerInventory = async (req, res) => {
  try {

    let restaurantId;

    // Admin → can select restaurant
    if (req.user.role === "admin") {
      restaurantId = req.query.restaurantId;
    }

    // Manager → only his restaurant
    else {
      restaurantId = req.user.restaurant;
    }

    const items = await Inventory.find({
      restaurant: restaurantId,
      isActive: true,
    })
      .populate("lastUpdatedBy", "name role employeeId")
      .sort({ updatedAt: -1 });

    return sendSuccess(res, items);

  } catch (err) {
    return sendError(res, err.message);
  }
};


/* ================= ADD STOCK ================= */

export const addStockToItem = async (req, res) => {
  try {
    const restaurantId =
      req.user.role === "admin" ? req.params.restaurantId : req.user.restaurant;

    const item = await Inventory.findOne({
      _id: req.params.id,
      restaurant: restaurantId,
      isActive: true,
    });

    if (!item)
      return sendError(res, "Inventory item not found", 404);

    const { quantity } = req.body;

    if (!quantity || Number(quantity) <= 0)
      return sendError(res, "Quantity must be greater than 0");

    item.quantity += Number(quantity);
    item.lastUpdatedBy = req.user.id;
    await item.save();

    await InventoryLog.create({
      item: item._id,
      restaurant: restaurantId,
      quantityAdded: Number(quantity),
      unit: item.unit,
      action: "ADD",
      addedBy: req.user.id,
    });

    return sendSuccess(res, item);
  } catch (err) {
    return sendError(res, err.message);
  }
};

/* ================= GET ITEM LOGS ================= */

export const getItemLogs = async (req, res) => {
  try {

    let restaurantId;

    if (req.user.role === "admin") {
      restaurantId = req.query.restaurantId;
    } else {
      restaurantId = req.user.restaurant;
    }

    const logs = await InventoryLog.find({
      item: req.params.itemId,
      restaurant: restaurantId
    })
      .populate("addedBy", "name employeeId role")
      .sort({ createdAt: -1 });

    return sendSuccess(res, logs);

  } catch (err) {
    return sendError(res, err.message);
  }
};