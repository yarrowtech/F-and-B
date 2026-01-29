import express from "express";
import {
  generateBill,
  confirmPayment,
} from "../controllers/accountant.Controller.js";

import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(auth, role("ACCOUNTANT"));

router.post("/bill/:orderId", generateBill);
router.patch("/bill/:billId/pay", confirmPayment);

export default router;
