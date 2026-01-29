// controllers/order.controller.js
import Order from "../models/Order.model.js";

/* ===============================
   CREATE ORDER
=============================== */
const createOrder = async (req, res) => {
  try {
    const order = await Order.create(req.body);
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ===============================
   GET ALL ORDERS
=============================== */
const getOrders = async (_req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ===============================
   GET ORDER BY ID
=============================== */
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order)
      return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ===============================
   ORDER STATE CHANGES
=============================== */
const acceptOrder = async (req, res) =>
  updateStatus(req, res, "ACCEPTED");

const markPreparing = async (req, res) =>
  updateStatus(req, res, "PREPARING");

const markReady = async (req, res) =>
  updateStatus(req, res, "READY");

const markServed = async (req, res) =>
  updateStatus(req, res, "SERVED");

const markPaid = async (req, res) =>
  updateStatus(req, res, "PAID");

const updateStatus = async (req, res, status) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order)
      return res.status(404).json({ message: "Order not found" });

    res.json(order);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ===============================
   ✅ DEFAULT EXPORT (REQUIRED)
=============================== */
export default {
  createOrder,
  getOrders,
  getOrderById,
  acceptOrder,
  markPreparing,
  markReady,
  markServed,
  markPaid,
};
