import crypto from "crypto";
import mongoose from "mongoose";
import Table from "../models/Table.model.js";
import Order from "../models/Order.model.js";
import Menu from "../models/Menu.model.js";
import Employee from "../models/Employee.model.js";
import Restaurant from "../models/Restaurant.model.js";
import Reservation from "../models/Reservation.model.js";
import WaiterTableAssignment from "../models/WaiterTableAssignment.model.js";
import { getIO } from "../socket.js";
import { getOrderTableLabel } from "../utils/tableLabel.js";
import { logAction } from "../utils/logger.js";
import logger from "../utils/pinoLogger.js";
import { getTableAssignmentMark } from "./waiterTable.Controller.js";
import {
  emitOrderNotification,
  findOrderUsingTables,
  populateOrderDetails,
  uniqueIds,
  validateJoinTables,
} from "./order.Controller.js";

/* ===============================
   QR DINE-IN ORDERING

   Customer scans the QR on a table -> order is created as PENDING_ACCEPT (the
   kitchen cannot see it yet) -> assigned waiters are notified, everyone else
   after QR_ESCALATE_SECONDS -> the first waiter to accept owns the order and
   it goes to the kitchen like any order that waiter would have taken.
=============================== */

const ESCALATE_MS = Math.max(Number(process.env.QR_ESCALATE_SECONDS) || 60, 5) * 1000;
const MAX_ORDER_LINES = 40;
const MAX_LINE_QUANTITY = 20;

const send = (res, status, body) => res.status(status).json(body);
const fail = (res, message, status = 400, extra = {}) =>
  send(res, status, { success: false, message, ...extra });
const ok = (res, data, status = 200) => send(res, status, { success: true, data });

const newToken = () => crypto.randomBytes(9).toString("base64url");

const cleanNotes = (value) =>
  (Array.isArray(value) ? value : [])
    .map((note) => String(note || "").trim().slice(0, 80))
    .filter(Boolean)
    .slice(0, 3);

const noteKey = (notes) => notes.map((note) => note.toLowerCase()).sort().join("|");

const emitSafe = (event, payload) => {
  try {
    getIO().emit(event, payload);
  } catch (err) {
    logger.error(`QR ORDER SOCKET EMIT ERROR (${event}):`, err.message);
  }
};

/* Waiters who look after these tables (active ones only). Empty = nobody is
   assigned, so every waiter is notified. */
const getAssignedWaiters = async (restaurantId, tableIds) => {
  const waiterIds = await WaiterTableAssignment.distinct("waiter", {
    restaurant: restaurantId,
    table: { $in: tableIds },
  });
  if (waiterIds.length === 0) return [];

  const active = await Employee.find({
    _id: { $in: waiterIds },
    role: "WAITER",
    isActive: { $ne: false },
  })
    .select("_id")
    .lean();
  return active.map((waiter) => String(waiter._id));
};

const orderTableIds = (order) => uniqueIds([order.table, ...(order.joinedTables || [])]);

const emitNewQrOrder = async (order, type) => {
  const populated = await populateOrderDetails(Order.findById(order._id));
  const recipients = await getAssignedWaiters(order.restaurant, orderTableIds(order));

  emitSafe("waiter:qr-order", {
    type,
    orderId: String(order._id),
    orderNo: order.orderNo,
    restaurant: String(order.restaurant),
    tableLabel: getOrderTableLabel(populated),
    itemCount: order.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    recipients,
    escalateInMs: recipients.length > 0 ? ESCALATE_MS : 0,
    createdAt: order.qrRequestedAt || order.createdAt,
  });
};

const summarizeOrderForCustomer = (order) => ({
  orderId: String(order._id),
  orderNo: order.orderNo,
  status: order.status,
  source: order.source,
  tableLabel: getOrderTableLabel(order),
  waiterName: String(order.waiter?.name || "").split(" ")[0] || "",
  createdAt: order.createdAt,
  items: (order.items || [])
    .filter((item) => item.status !== "CANCELLED")
    .map((item) => ({
      name: item.menuItem?.name || "Item",
      quantity: item.quantity,
      customization: item.customization || [],
      status: item.status,
    })),
});

/* ===============================
   PUBLIC: WHICH TABLE IS THIS QR?
   GET /api/qr-order/table/:token
=============================== */
export const getTableByToken = async (req, res) => {
  try {
    const table = await Table.findOne({ qrToken: req.params.token })
      .select("restaurant tableNumber status")
      .lean();
    if (!table) return fail(res, "This QR code is not valid. Please ask the staff.", 404);

    const restaurant = await Restaurant.findById(table.restaurant)
      .select("name phone restaurantType")
      .lean();
    if (!restaurant || restaurant.restaurantType === "MANUAL_ONLY") {
      return fail(res, "Ordering from the table is not available here.", 404);
    }

    const active = await populateOrderDetails(
      findOrderUsingTables(table.restaurant, [table._id])
    );

    return ok(res, {
      restaurant: { _id: restaurant._id, name: restaurant.name, phone: restaurant.phone },
      table: { tableNumber: table.tableNumber },
      activeOrder: active ? summarizeOrderForCustomer(active) : null,
    });
  } catch (err) {
    logger.error("QR TABLE LOOKUP ERROR:", err.message);
    return fail(res, "Could not open this table. Please try again.", 500);
  }
};

/* ===============================
   PUBLIC: PLACE (OR ADD TO) A QR ORDER
   POST /api/qr-order/table/:token/orders
   body: { items: [{ menuItem, quantity, customization[] }], customerName }
=============================== */
export const placeQrOrder = async (req, res) => {
  try {
    const table = await Table.findOne({ qrToken: req.params.token });
    if (!table) return fail(res, "This QR code is not valid. Please ask the staff.", 404);

    const restaurant = await Restaurant.findById(table.restaurant).select("restaurantType").lean();
    if (!restaurant || restaurant.restaurantType === "MANUAL_ONLY") {
      return fail(res, "Ordering from the table is not available here.", 404);
    }

    const requested = Array.isArray(req.body?.items) ? req.body.items : [];
    if (requested.length === 0 || requested.length > MAX_ORDER_LINES) {
      return fail(res, "Please add between 1 and 40 items.");
    }

    const lines = [];
    for (const entry of requested) {
      const quantity = Number(entry?.quantity);
      if (
        !mongoose.Types.ObjectId.isValid(entry?.menuItem) ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > MAX_LINE_QUANTITY
      ) {
        return fail(res, "Some items in your order are not valid.");
      }
      lines.push({
        menuItem: String(entry.menuItem),
        quantity,
        customization: cleanNotes(entry.customization),
      });
    }

    const menuItems = await Menu.find({
      _id: { $in: [...new Set(lines.map((line) => line.menuItem))] },
      restaurant: table.restaurant,
      isAvailable: true,
    })
      .select("_id price")
      .lean();
    const menuById = new Map(menuItems.map((menu) => [String(menu._id), menu]));

    if (lines.some((line) => !menuById.has(line.menuItem))) {
      return fail(res, "Some items are no longer available. Please refresh the menu.");
    }

    const orderItems = lines.map((line) => ({
      menuItem: line.menuItem,
      quantity: line.quantity,
      customization: line.customization,
      price: menuById.get(line.menuItem).price,
    }));

    const existing = await findOrderUsingTables(table.restaurant, [table._id]);

    if (existing) {
      // Only a QR order that no waiter has taken yet can still grow; after that the
      // waiter owns it and adds items from their screen.
      if (existing.source !== "QR" || existing.status !== "PENDING_ACCEPT") {
        return fail(
          res,
          "Your table already has an order. Please ask your waiter to add more items.",
          409
        );
      }

      orderItems.forEach((incoming) => {
        const same = existing.items.find(
          (item) =>
            String(item.menuItem) === String(incoming.menuItem) &&
            noteKey(item.customization) === noteKey(incoming.customization)
        );
        if (same) {
          same.quantity = Math.min(same.quantity + incoming.quantity, MAX_LINE_QUANTITY * 5);
        } else {
          existing.items.push(incoming);
        }
      });

      if (existing.items.length > MAX_ORDER_LINES) {
        return fail(res, "This order is too large. Please ask your waiter.");
      }

      await existing.save();
      await emitNewQrOrder(existing, "UPDATED_QR_ORDER");
      return ok(res, { orderId: String(existing._id), orderNo: existing.orderNo, merged: true });
    }

    // A group seated from a reservation keeps the tables that were booked for it.
    if (table.status === "reserved") {
      const seated = await Reservation.exists({
        restaurant: table.restaurant,
        table: table._id,
        status: "seated",
      });
      if (!seated) return fail(res, "This table is reserved. Please ask the staff.", 409);
    }

    const seatedReservation = await Reservation.findOne({
      restaurant: table.restaurant,
      table: table._id,
      status: "seated",
      order: null,
    })
      .select("joinedTables")
      .lean();

    const joinedTableIds = uniqueIds(seatedReservation?.joinedTables).filter(
      (id) => id !== String(table._id)
    );
    await validateJoinTables(table.restaurant, joinedTableIds);

    const order = await Order.create({
      restaurant: table.restaurant,
      table: table._id,
      joinedTables: joinedTableIds,
      waiter: null,
      source: "QR",
      orderType: "DINE_IN",
      customerName: String(req.body?.customerName || "").trim().slice(0, 40),
      qrRequestedAt: new Date(),
      items: orderItems,
      status: "PENDING_ACCEPT",
    });

    await emitNewQrOrder(order, "NEW_QR_ORDER");

    return ok(res, { orderId: String(order._id), orderNo: order.orderNo, merged: false }, 201);
  } catch (err) {
    logger.error("QR PLACE ORDER ERROR:", err.message);
    return fail(res, err.message || "Could not place your order. Please try again.");
  }
};

/* ===============================
   PUBLIC: TRACK A QR ORDER
   GET /api/qr-order/orders/:orderId
=============================== */
export const getQrOrderStatus = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.orderId)) {
      return fail(res, "Order not found", 404);
    }

    const order = await populateOrderDetails(
      Order.findOne({ _id: req.params.orderId, source: "QR" })
    );
    if (!order) return fail(res, "Order not found", 404);

    return ok(res, summarizeOrderForCustomer(order));
  } catch (err) {
    logger.error("QR ORDER STATUS ERROR:", err.message);
    return fail(res, "Could not load your order.", 500);
  }
};

/* ===============================
   WAITER: QR ORDERS WAITING FOR ME
   GET /api/qr-order/pending
   Assigned waiters see an order at once; everyone else after the escalation time
   (or immediately when the table has no assigned waiter).
=============================== */
export const getPendingQrOrders = async (req, res) => {
  try {
    const orders = await populateOrderDetails(
      Order.find({
        restaurant: req.user.restaurant,
        source: "QR",
        status: "PENDING_ACCEPT",
      }).sort({ createdAt: 1 })
    );

    const now = Date.now();
    const result = [];

    for (const order of orders) {
      const assignees = await getAssignedWaiters(order.restaurant, orderTableIds(order));
      const forMe = assignees.includes(String(req.user.id));
      const requestedAt = new Date(order.qrRequestedAt || order.createdAt).getTime();
      const escalated = assignees.length === 0 || now - requestedAt >= ESCALATE_MS;

      if (!forMe && !escalated) continue;

      result.push({
        _id: String(order._id),
        orderNo: order.orderNo,
        tableLabel: getOrderTableLabel(order),
        customerName: order.customerName,
        requestedAt: order.qrRequestedAt || order.createdAt,
        forMe,
        // Nobody is assigned, or the assigned waiters did not respond in time.
        everyone: assignees.length === 0 || (escalated && !forMe),
        items: order.items.map((item) => ({
          name: item.menuItem?.name || "Item",
          quantity: item.quantity,
          customization: item.customization || [],
        })),
      });
    }

    return ok(res, result);
  } catch (err) {
    logger.error("PENDING QR ORDERS ERROR:", err.message);
    return fail(res, err.message, 500);
  }
};

/* ===============================
   WAITER: ACCEPT A QR ORDER (first one wins)
   POST /api/qr-order/orders/:id/accept
=============================== */
export const acceptQrOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return fail(res, "Order not found", 404);

    const pending = await Order.findOne({
      _id: id,
      restaurant: req.user.restaurant,
      source: "QR",
    }).select("table joinedTables status waiter qrRequestedAt createdAt");
    if (!pending) return fail(res, "Order not found", 404);

    if (pending.status !== "PENDING_ACCEPT" || pending.waiter) {
      return fail(res, "This order was already taken by another waiter.", 409);
    }

    const assignees = await getAssignedWaiters(req.user.restaurant, orderTableIds(pending));
    const requestedAt = new Date(pending.qrRequestedAt || pending.createdAt).getTime();
    if (
      assignees.length > 0 &&
      !assignees.includes(String(req.user.id)) &&
      Date.now() - requestedAt < ESCALATE_MS
    ) {
      return fail(res, "This table is assigned to another waiter. It opens to everyone shortly.", 403);
    }

    const tableAssignment = await getTableAssignmentMark(
      req.user.restaurant,
      req.user.id,
      pending.table
    );

    // Atomic: only one waiter can flip the order from "no waiter" to "mine".
    const claimed = await Order.findOneAndUpdate(
      { _id: id, source: "QR", status: "PENDING_ACCEPT", waiter: null },
      {
        $set: {
          waiter: req.user.id,
          status: "PENDING",
          tableAssignment,
          qrAcceptedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!claimed) {
      return fail(res, "This order was already taken by another waiter.", 409);
    }

    await Table.updateMany(
      { _id: { $in: orderTableIds(claimed) } },
      { status: "occupied" }
    );
    await Reservation.updateOne(
      { restaurant: claimed.restaurant, table: claimed.table, status: "seated", order: null },
      { order: claimed._id }
    );

    await logAction({
      action: "QR_ORDER_ACCEPTED",
      userId: req.user.id,
      role: "WAITER",
      meta: { orderId: claimed._id },
    });

    const populated = await populateOrderDetails(Order.findById(claimed._id));

    emitSafe("waiter:qr-order-taken", {
      orderId: String(claimed._id),
      restaurant: String(claimed.restaurant),
      action: "ACCEPTED",
      waiter: String(req.user.id),
    });
    // From here the order is a normal waiter order, so the kitchen gets it.
    emitOrderNotification("chef:new-order", populated, "NEW_ORDER");

    return ok(res, populated);
  } catch (err) {
    logger.error("ACCEPT QR ORDER ERROR:", err.message);
    return fail(res, err.message, 500);
  }
};

/* ===============================
   WAITER / MANAGER: DECLINE A QR ORDER (prank, wrong table...)
   POST /api/qr-order/orders/:id/reject
=============================== */
export const rejectQrOrder = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return fail(res, "Order not found", 404);

    const rejected = await Order.findOneAndUpdate(
      {
        _id: id,
        restaurant: req.user.restaurant,
        source: "QR",
        status: "PENDING_ACCEPT",
        waiter: null,
      },
      { $set: { status: "CANCELLED" } },
      { new: true }
    );

    if (!rejected) return fail(res, "This order was already handled.", 409);

    await logAction({
      action: "QR_ORDER_REJECTED",
      userId: req.user.id,
      role: String(req.user.role || "").toUpperCase(),
      meta: { orderId: rejected._id },
    });

    emitSafe("waiter:qr-order-taken", {
      orderId: String(rejected._id),
      restaurant: String(rejected.restaurant),
      action: "REJECTED",
      waiter: String(req.user.id),
    });

    return ok(res, { orderId: String(rejected._id) });
  } catch (err) {
    logger.error("REJECT QR ORDER ERROR:", err.message);
    return fail(res, err.message, 500);
  }
};

/* ===============================
   ADMIN / MANAGER: QR CODES FOR EVERY TABLE
   GET  /api/qr-order/codes/:restaurantId
   POST /api/qr-order/codes/:restaurantId/:tableId/regenerate
=============================== */
const ensureRestaurantAccess = async (req, restaurantId) => {
  if (!mongoose.Types.ObjectId.isValid(restaurantId)) return null;
  if (req.user.role === "admin") {
    return Restaurant.findOne({ _id: restaurantId, admin: req.user.id });
  }
  if (String(req.user.restaurant) !== String(restaurantId)) return null;
  return Restaurant.findById(restaurantId);
};

export const getTableQrCodes = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const restaurant = await ensureRestaurantAccess(req, restaurantId);
    if (!restaurant) return fail(res, "Access denied", 403);

    const tables = await Table.find({ restaurant: restaurantId })
      .select("tableNumber capacity qrToken")
      .sort({ tableNumber: 1 });

    // Tables created before QR ordering get their token the first time it is needed.
    for (const table of tables) {
      if (table.qrToken) continue;
      table.qrToken = newToken();
      await table.save();
    }

    return ok(res, {
      restaurantName: restaurant.name,
      tables: tables.map((table) => ({
        _id: table._id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        qrToken: table.qrToken,
      })),
    });
  } catch (err) {
    logger.error("TABLE QR CODES ERROR:", err.message);
    return fail(res, err.message, 500);
  }
};

export const regenerateTableQr = async (req, res) => {
  try {
    const { restaurantId, tableId } = req.params;
    const restaurant = await ensureRestaurantAccess(req, restaurantId);
    if (!restaurant) return fail(res, "Access denied", 403);

    const table = await Table.findOneAndUpdate(
      { _id: tableId, restaurant: restaurantId },
      { $set: { qrToken: newToken() } },
      { new: true }
    ).select("tableNumber qrToken");
    if (!table) return fail(res, "Table not found", 404);

    return ok(res, {
      _id: table._id,
      tableNumber: table.tableNumber,
      qrToken: table.qrToken,
    });
  } catch (err) {
    logger.error("REGENERATE TABLE QR ERROR:", err.message);
    return fail(res, err.message, 500);
  }
};
