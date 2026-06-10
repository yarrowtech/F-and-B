import Inventory from "../models/Inventory.model.js";
import InventoryLog from "../models/InventoryLog.model.js";
import InventoryCategory from "../models/InventoryCategory.model.js";
import Order from "../models/Order.model.js";
import ExcelJS from "exceljs";

/* ================= HELPER ================= */

const sendSuccess = (res, data, status = 200) =>
  res.status(status).json({ success: true, data });

const sendError = (res, message, status = 400) =>
  res.status(status).json({ success: false, message });

const getRestaurantId = (req) =>
  String(req.user.role || "").toLowerCase() === "admin"
    ? req.params.restaurantId || req.query.restaurantId || req.body.restaurantId
    : req.user.restaurant;

const startOfDay = (value) => {
  const date = value ? new Date(value) : new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (value) => {
  const date = value ? new Date(value) : new Date();
  date.setHours(23, 59, 59, 999);
  return date;
};

const formatReportDate = (date) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);

const normalizeCustomization = (value) =>
  Array.isArray(value)
    ? value.map((item) => String(item || "").trim()).filter(Boolean)
    : [];

const getIngredientMultiplier = (ingredientName, customizations = []) => {
  const name = String(ingredientName || "").toLowerCase();
  if (!name) return 1;
  const singularName = name.endsWith("s") ? name.slice(0, -1) : name;

  const notes = normalizeCustomization(customizations).map((item) =>
    item.toLowerCase()
  );
  const mentionsIngredient = (note) =>
    note.includes(name) || note.includes(singularName);

  if (
    notes.some(
      (note) =>
        mentionsIngredient(note) &&
        /\b(no|without|remove|skip|less)\b/.test(note)
    )
  ) {
    return 0;
  }

  if (
    notes.some(
      (note) =>
        mentionsIngredient(note) &&
        /\b(extra|more|add|double)\b/.test(note)
    )
  ) {
    return 2;
  }

  return 1;
};

const getOrderItemUsageDate = (order, item) =>
  item.readyAt || item.servedAt || order.readyAt || order.servedAt || order.updatedAt;

const addToMapTotal = (map, key, quantity) => {
  map.set(key, (map.get(key) || 0) + quantity);
};

const roundQuantity = (value) => {
  const rounded = Math.round((Number(value || 0) + Number.EPSILON) * 1000) / 1000;
  return Object.is(rounded, -0) ? 0 : rounded;
};

/* ================= CREATE INVENTORY ITEM ================= */

export const createInventoryItem = async (req, res) => {
  try {
    const { name, unit, quantity, lowStockThreshold, category } = req.body;

    if (!name || !unit)
      return sendError(res, "Name and unit are required");

    const restaurantId =
      req.user.role === "admin" ? req.params.restaurantId : req.user.restaurant;

    const item = await Inventory.create({
      restaurant: restaurantId,
      name,
      unit,
      category: category || "",
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
      addedByName: req.user.name || "",
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

    const { name, unit, quantity, lowStockThreshold, category } = req.body;

    if (name !== undefined) item.name = name;
    if (unit !== undefined) item.unit = unit;
    if (category !== undefined) item.category = category;

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
        addedByName: req.user.name || "",
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
      addedByName: req.user.name || "",
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
      addedByName: req.user.name || "",
    });

    return sendSuccess(res, item);
  } catch (err) {
    return sendError(res, err.message);
  }
};

/* ================= INVENTORY MANAGER DASHBOARD STATS ================= */

export const getMyInventoryStats = async (req, res) => {
  try {
    const userId       = req.user.id;
    const restaurantId = req.user.restaurant;

    const { period, from, to } = req.query;

    /* ── build date range ── */
    let startDate, endDate;
    const now = new Date();

    if (period === "today") {
      startDate = new Date(now); startDate.setHours(0, 0, 0, 0);
      endDate   = new Date(now); endDate.setHours(23, 59, 59, 999);
    } else if (period === "7days") {
      startDate = new Date(now); startDate.setDate(now.getDate() - 6); startDate.setHours(0, 0, 0, 0);
      endDate   = new Date(now); endDate.setHours(23, 59, 59, 999);
    } else if (period === "month") {
      startDate = new Date(now); startDate.setDate(now.getDate() - 29); startDate.setHours(0, 0, 0, 0);
      endDate   = new Date(now); endDate.setHours(23, 59, 59, 999);
    } else if (period === "custom" && from && to) {
      startDate = new Date(from); startDate.setHours(0, 0, 0, 0);
      endDate   = new Date(to);   endDate.setHours(23, 59, 59, 999);
    } else {
      /* default: today */
      startDate = new Date(now); startDate.setHours(0, 0, 0, 0);
      endDate   = new Date(now); endDate.setHours(23, 59, 59, 999);
    }

    /* ── total active items in restaurant ── */
    const totalItems = await Inventory.countDocuments({
      restaurant: restaurantId,
      isActive: true,
    });

    /* ── logs by THIS user in date range ── */
    const logs = await InventoryLog.find({
      restaurant: restaurantId,
      addedBy: userId,
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .populate("item", "name unit quantity lowStockThreshold")
      .sort({ createdAt: -1 });

    const addLogs    = logs.filter((l) => l.action === "ADD");
    const updateLogs = logs.filter((l) => l.action === "UPDATE");
    const deleteLogs = logs.filter((l) => l.action === "DELETE");

    return sendSuccess(res, {
      totalItems,
      addCount:    addLogs.length,
      updateCount: updateLogs.length,
      deleteCount: deleteLogs.length,
      addLogs,
      updateLogs,
      deleteLogs,
      allLogs: logs,
    });
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

/* ================= EXPORT DAY-WISE INVENTORY EXCEL ================= */

export const exportInventoryDayWiseExcel = async (req, res) => {
  try {
    const restaurantId = getRestaurantId(req);
    if (!restaurantId) return sendError(res, "Restaurant is required");

    const fromDate = req.query.from || req.query.date || new Date();
    const toDate = req.query.to || req.query.date || fromDate;
    const startDate = startOfDay(fromDate);
    const endDate = endOfDay(toDate);

    if (startDate > endDate) {
      return sendError(res, "From date cannot be after To date");
    }

    const items = await Inventory.find({
      restaurant: restaurantId,
    }).sort({ name: 1 });

    const itemIds = items.map((item) => item._id);

    const dayLogs = await InventoryLog.find({
      restaurant: restaurantId,
      item: { $in: itemIds },
      createdAt: { $gte: startDate, $lte: endDate },
    }).select("item quantityAdded action");

    const logsAfterDay = await InventoryLog.find({
      restaurant: restaurantId,
      item: { $in: itemIds },
      createdAt: { $gt: endDate },
    }).select("item quantityAdded action");

    const deductedOrders = await Order.find({
      restaurant: restaurantId,
      "items.inventoryDeducted": true,
    })
      .select("items readyAt servedAt updatedAt")
      .populate({
        path: "items.menuItem",
        select: "ingredients",
        populate: { path: "ingredients.item", select: "name" },
      });

    const dayTotals = new Map();
    const afterTotals = new Map();
    const inferredUsed = new Map();
    const inferredUsedAfterDay = new Map();

    dayLogs.forEach((log) => {
      const key = String(log.item);
      const current = dayTotals.get(key) || { added: 0, used: 0, net: 0 };
      const quantity = log.action === "DELETE" ? 0 : Number(log.quantityAdded || 0);

      if (quantity > 0) current.added += quantity;
      if (quantity < 0) current.used += Math.abs(quantity);
      current.net += quantity;
      dayTotals.set(key, current);
    });

    logsAfterDay.forEach((log) => {
      const key = String(log.item);
      const current = afterTotals.get(key) || { net: 0, used: 0 };
      const quantity = log.action === "DELETE" ? 0 : Number(log.quantityAdded || 0);
      if (quantity < 0) current.used += Math.abs(quantity);
      current.net += quantity;
      afterTotals.set(key, current);
    });

    deductedOrders.forEach((order) => {
      (order.items || []).forEach((orderItem) => {
        if (!orderItem.inventoryDeducted || !orderItem.menuItem?.ingredients) return;

        const usageDate = getOrderItemUsageDate(order, orderItem);
        if (!usageDate) return;

        const usedAt = new Date(usageDate);
        if (Number.isNaN(usedAt.getTime()) || usedAt < startDate) return;

        orderItem.menuItem.ingredients.forEach((ingredient) => {
          const inventoryId = ingredient.item?._id || ingredient.item;
          if (!inventoryId) return;

          const multiplier = getIngredientMultiplier(
            ingredient.item?.name,
            orderItem.customization
          );
          const requiredQty =
            Number(ingredient.quantity || 0) *
            Number(orderItem.quantity || 0) *
            multiplier;

          if (!requiredQty) return;

          const key = String(inventoryId);
          if (usedAt <= endDate) {
            addToMapTotal(inferredUsed, key, requiredQty);
          } else {
            addToMapTotal(inferredUsedAfterDay, key, requiredQty);
          }
        });
      });
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "F&B ERP";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Inventory Day Wise");
    worksheet.columns = [
      { header: "Date Range", key: "date", width: 28 },
      { header: "Item Name", key: "name", width: 32 },
      { header: "Unit", key: "unit", width: 12 },
      { header: "How Much Was There", key: "opening", width: 22 },
      { header: "How Much Added", key: "added", width: 18 },
      { header: "How Much Used", key: "used", width: 18 },
      { header: "How Much Remains", key: "remaining", width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF047857" },
    };

    const dateLabel =
      startDate.toDateString() === endDate.toDateString()
        ? formatReportDate(startDate)
        : `${formatReportDate(startDate)} to ${formatReportDate(endDate)}`;

    items.forEach((item) => {
      const key = String(item._id);
      const dayTotal = dayTotals.get(key) || { added: 0, used: 0, net: 0 };
      const afterTotal = afterTotals.get(key) || { net: 0, used: 0 };
      const missingUsed = Math.max((inferredUsed.get(key) || 0) - dayTotal.used, 0);
      const missingUsedAfterDay = Math.max(
        (inferredUsedAfterDay.get(key) || 0) - afterTotal.used,
        0
      );
      const reportUsed = dayTotal.used + missingUsed;
      const reportNet = dayTotal.net - missingUsed;
      const afterNet = afterTotal.net - missingUsedAfterDay;
      const remaining = Number(item.quantity || 0) - afterNet;
      const opening = remaining - reportNet;

      worksheet.addRow({
        date: dateLabel,
        name: item.name,
        unit: item.unit,
        opening: roundQuantity(opening),
        added: roundQuantity(dayTotal.added),
        used: roundQuantity(reportUsed),
        remaining: roundQuantity(remaining),
      });
    });

    ["opening", "added", "used", "remaining"].forEach((key) => {
      worksheet.getColumn(key).numFmt = "0.000";
    });

    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    const fileFrom = startDate.toISOString().slice(0, 10);
    const fileTo = endDate.toISOString().slice(0, 10);
    const filename = `inventory-day-wise-${fileFrom}-to-${fileTo}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    return sendError(res, err.message);
  }
};

/* ================= GET CATEGORIES FOR RESTAURANT ================= */

export const getInventoryCategories = async (req, res) => {
  try {
    const restaurantId = req.user.role === "admin"
      ? req.query.restaurantId
      : req.user.restaurant;

    const categories = await InventoryCategory.find({ restaurant: restaurantId })
      .sort({ createdAt: 1 });

    return sendSuccess(res, categories);
  } catch (err) {
    return sendError(res, err.message);
  }
};

/* ================= ADD CUSTOM CATEGORY ================= */

export const addInventoryCategory = async (req, res) => {
  try {
    const restaurantId = req.user.role === "admin"
      ? req.body.restaurantId
      : req.user.restaurant;

    const { name } = req.body;
    if (!name || !name.trim())
      return sendError(res, "Category name is required");

    const category = await InventoryCategory.create({
      restaurant: restaurantId,
      name: name.trim(),
      isCustom: true,
    });

    return sendSuccess(res, category, 201);
  } catch (err) {
    if (err.code === 11000)
      return sendError(res, "Category already exists");
    return sendError(res, err.message);
  }
};
