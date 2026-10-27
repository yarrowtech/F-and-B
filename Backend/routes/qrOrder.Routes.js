import express from "express";
import rateLimit from "express-rate-limit";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import {
  acceptQrOrder,
  getPendingQrOrders,
  getQrOrderStatus,
  getTableByToken,
  getTableQrCodes,
  joinQrOrder,
  placeQrOrder,
  regenerateTableQr,
  rejectQrOrder,
} from "../controllers/qrOrder.Controller.js";

const router = express.Router();

/*
Mounted in server.js as: app.use("/api/qr-order", qrOrderRoutes);

Public (customer, no login):
GET  /api/qr-order/table/:token             which table is this QR + any running order
POST /api/qr-order/table/:token/orders      place an order (or add to one nobody accepted yet)
POST /api/qr-order/table/:token/join        join the table's order with its 4-digit code
GET  /api/qr-order/orders/:orderId?key=     track a QR order (needs the order key)

Waiter / manager:
GET  /api/qr-order/pending                  QR orders waiting for me
POST /api/qr-order/orders/:id/accept        waiter: take the order (first one wins)
POST /api/qr-order/orders/:id/reject        waiter / manager: decline it

Admin / manager:
GET  /api/qr-order/codes/:restaurantId                      QR token of every table
POST /api/qr-order/codes/:restaurantId/:tableId/regenerate  replace a table's QR token
*/

// The public routes have no login, so each table gets its own small budget. The
// limit is per table (not per IP) because customers often share one network address.
const perTable = (max) =>
  rateLimit({
    windowMs: 10 * 60 * 1000,
    max,
    keyGenerator: (req) => `qr:${req.params.token}`,
    message: { success: false, message: "Too many requests for this table. Please wait a few minutes." },
    standardHeaders: true,
    legacyHeaders: false,
    validate: { keyGeneratorIpFallback: false },
  });

router.get("/table/:token", perTable(200), getTableByToken);
router.post("/table/:token/orders", perTable(20), placeQrOrder);
// Guessing a 4-digit code is slow: only a few tries per table every 10 minutes.
router.post("/table/:token/join", perTable(8), joinQrOrder);
router.get("/orders/:orderId", getQrOrderStatus);

router.get("/pending", auth, allowRoles("waiter", "manager"), getPendingQrOrders);
router.post("/orders/:id/accept", auth, allowRoles("waiter"), acceptQrOrder);
router.post("/orders/:id/reject", auth, allowRoles("waiter", "manager"), rejectQrOrder);

router.get("/codes/:restaurantId", auth, allowRoles("admin", "manager"), getTableQrCodes);
router.post(
  "/codes/:restaurantId/:tableId/regenerate",
  auth,
  allowRoles("admin", "manager"),
  regenerateTableQr
);

export default router;
