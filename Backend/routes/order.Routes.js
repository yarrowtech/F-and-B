

// import express from "express";
// import orderController from "../controllers/order.Controller.js";
// import auth from "../middlewares/auth.middleware.js";
// import allowRoles from "../middlewares/role.middleware.js";

// const router = express.Router();

// /*
// Base mounted in server.js as:
// app.use("/api/order", orderRoutes);

// Final endpoints:

// POST   /api/order
// GET    /api/order
// GET    /api/order/waiter
// GET    /api/order/chef
// GET    /api/order/:id
// PUT    /api/order/:id/accept
// PUT    /api/order/:id/preparing
// PUT    /api/order/:id/ready
// PUT    /api/order/:id/served
// PUT    /api/order/:id/paid
// */

// /* ===============================
//    WAITER
// =============================== */

// // Create order
// router.post(
//   "/",
//   auth,
//   allowRoles("waiter"),
//   orderController.createOrder
// );

// // Get waiter orders (restaurant scoped)
// router.get(
//   "/waiter",
//   auth,
//   allowRoles("waiter"),
//   orderController.getWaiterOrders
// );

// // Mark served
// router.put(
//   "/:id/served",
//   auth,
//   allowRoles("waiter"),
//   orderController.markServed
// );

// /* ===============================
//    CHEF
// =============================== */

// // Get chef orders (restaurant scoped)
// router.get(
//   "/chef",
//   auth,
//   allowRoles("chef"),
//   orderController.getChefOrders
// );

// // Accept order
// router.put(
//   "/:id/accept",
//   auth,
//   allowRoles("chef"),
//   orderController.acceptOrder
// );

// // Mark preparing
// router.put(
//   "/:id/preparing",
//   auth,
//   allowRoles("chef"),
//   orderController.markPreparing
// );

// // Mark ready
// router.put(
//   "/:id/ready",
//   auth,
//   allowRoles("chef"),
//   orderController.markReady
// );

// /* ===============================
//    ACCOUNTANT
// =============================== */

// // Mark paid
// router.put(
//   "/:id/paid",
//   auth,
//   allowRoles("accountant"),
//   orderController.markPaid
// );

// /* ===============================
//    ADMIN / MANAGER
// =============================== */

// // Get all orders for restaurant
// router.get(
//   "/",
//   auth,
//   allowRoles("admin", "manager"),
//   orderController.getOrders
// );

// /* ===============================
//    COMMON
// =============================== */

// // Get single order (restaurant scoped inside controller)
// router.get(
//   "/:id",
//   auth,
//   orderController.getOrderById
// );

// export default router;

















import express from "express";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";

import {
  createOrder,
  addItemsToOrder,
  getOrders,
  getChefOrders,
  getWaiterOrders,
  getOrderById,
  acceptOrder,
  markPreparing,
  markReady,
  markServed,
  markPaid,
} from "../controllers/order.Controller.js";

const router = express.Router();

/* ===============================
   WAITER
=============================== */

router.post("/", auth, allowRoles("waiter"), createOrder);

router.get("/waiter", auth, allowRoles("waiter"), getWaiterOrders);

router.put("/:id/served", auth, allowRoles("waiter"), markServed);

/* ===============================
   CHEF
=============================== */

router.get("/chef", auth, allowRoles("chef"), getChefOrders);

router.put("/:id/accept", auth, allowRoles("chef"), acceptOrder);

router.put("/:id/preparing", auth, allowRoles("chef"), markPreparing);

router.put("/:id/ready", auth, allowRoles("chef"), markReady);

/* ===============================
   ACCOUNTANT
=============================== */

router.put("/:id/paid", auth, allowRoles("accountant"), markPaid);

/* ===============================
   ADMIN / MANAGER
=============================== */

router.get("/", auth, allowRoles("admin", "manager"), getOrders);

/* ===============================
   COMMON
=============================== */

router.get("/:id", auth, getOrderById);

/* ===============================
   ADD MORE ITEMS (NEW FEATURE)
=============================== */

router.put(
  "/:id/add-items",
  auth,
  allowRoles("waiter"),
  addItemsToOrder
);

export default router;

