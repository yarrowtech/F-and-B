// routes/order.Routes.js
import express from "express";
import orderController from "../controllers/order.controller.js";

const router = express.Router();

/* ===============================
   ORDER ROUTES
=============================== */

// create order (waiter)
router.post("/", orderController.createOrder);

// list all orders (manager/admin)
router.get("/", orderController.getOrders);

// get single order
router.get("/:id", orderController.getOrderById);

// chef actions
router.put("/:id/accept", orderController.acceptOrder);
router.put("/:id/preparing", orderController.markPreparing);
router.put("/:id/ready", orderController.markReady);

// waiter action
router.put("/:id/served", orderController.markServed);

// accountant / payment
router.put("/:id/paid", orderController.markPaid);

export default router;
