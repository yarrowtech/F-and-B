import express from "express";
import {
  createOrder,
  serveOrder,
  markPaymentReceived,
} from "../controllers/waiter.Controller.js";

import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(auth, role("WAITER"));

router.post("/order", createOrder);
router.patch("/order/:orderId/serve", serveOrder);
router.patch("/order/:orderId/payment", markPaymentReceived);

export default router;
