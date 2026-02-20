import express from "express";
import {
  getPendingBills,
  generateBill,
  confirmPayment,
} from "../controllers/accountant.Controller.js";

import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";

const router = express.Router();

/* ============================
   ACCOUNTANT PROTECTED ROUTES
============================ */
router.use(auth);
router.use(role("accountant"));

/* ===== BILLING ===== */
router.get("/bills/pending", getPendingBills);
router.post("/bill/:orderId/generate", generateBill);
router.post("/bill/:billId/pay", confirmPayment);

export default router;
