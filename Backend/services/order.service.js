import Order from "../models/Order.model.js";
import OrderHistory from "../models/OrderHistory.model.js";
import ORDER_STATUS from "../constants/orderStatus.js";
import tableService from "./table.service.js";
import statsService from "./stats.service.js";

const logHistory = async ({
  order,
  action,
  from,
  to,
  by,
  role,
}) => {
  await OrderHistory.create({
    order,
    action,
    previousStatus: from,
    newStatus: to,
    performedBy: by,
    role,
  });
};

/* ===============================
   CREATE ORDER (WAITER)
=============================== */
const createOrder = async ({ waiterId, tableId, items }) => {
  const order = await Order.create({
    waiter: waiterId,
    table: tableId,
    items,
    status: ORDER_STATUS.PLACED,
  });

  await tableService.occupyTable(tableId, order._id);
  await statsService.incrementStat(waiterId, "ordersTaken");

  await logHistory({
    order: order._id,
    action: "ORDER_PLACED",
    from: null,
    to: ORDER_STATUS.PLACED,
    by: waiterId,
    role: "WAITER",
  });

  return order;
};

/* ===============================
   CHEF ACTIONS
=============================== */
const acceptOrder = async (orderId, chefId) => {
  const order = await Order.findById(orderId);
  if (order.status !== ORDER_STATUS.PLACED) {
    throw new Error("Order cannot be accepted");
  }

  order.status = ORDER_STATUS.ACCEPTED;
  order.chef = chefId;
  await order.save();

  await logHistory({
    order: orderId,
    action: "ORDER_ACCEPTED",
    from: ORDER_STATUS.PLACED,
    to: ORDER_STATUS.ACCEPTED,
    by: chefId,
    role: "CHEF",
  });

  return order;
};

const startPreparing = async (orderId) => {
  const order = await Order.findById(orderId);
  if (order.status !== ORDER_STATUS.ACCEPTED) {
    throw new Error("Order not accepted yet");
  }

  order.status = ORDER_STATUS.PREPARING;
  await order.save();

  await logHistory({
    order: orderId,
    action: "PREPARING_STARTED",
    from: ORDER_STATUS.ACCEPTED,
    to: ORDER_STATUS.PREPARING,
    by: order.chef,
    role: "CHEF",
  });

  return order;
};

const markReady = async (orderId) => {
  const order = await Order.findById(orderId);
  if (order.status !== ORDER_STATUS.PREPARING) {
    throw new Error("Order not preparing");
  }

  order.status = ORDER_STATUS.READY;
  await order.save();

  await statsService.incrementStat(order.chef, "ordersPrepared");

  await logHistory({
    order: orderId,
    action: "ORDER_READY",
    from: ORDER_STATUS.PREPARING,
    to: ORDER_STATUS.READY,
    by: order.chef,
    role: "CHEF",
  });

  return order;
};

/* ===============================
   WAITER ACTIONS
=============================== */
const serveOrder = async (orderId, waiterId) => {
  const order = await Order.findById(orderId);
  if (order.status !== ORDER_STATUS.READY) {
    throw new Error("Order not ready");
  }

  order.status = ORDER_STATUS.SERVED;
  await order.save();

  await logHistory({
    order: orderId,
    action: "ORDER_SERVED",
    from: ORDER_STATUS.READY,
    to: ORDER_STATUS.SERVED,
    by: waiterId,
    role: "WAITER",
  });

  return order;
};

export default {
  createOrder,
  acceptOrder,
  startPreparing,
  markReady,
  serveOrder,
};
