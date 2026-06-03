// import express from "express";
// import billingController from "../controllers/billing.Controller.js";
// import protect from "../middlewares/auth.middleware.js";
// import allowRoles from "../middlewares/role.middleware.js";

// const router = express.Router();

// /* ===============================
//    BILLING ROUTES
// =============================== */

// // 🔐 Accountant inbox (UNPAID bills)
// router.get(
//   "/inbox",
//   protect,
//   allowRoles("accountant"),
//   billingController.getInbox
// );

// // 🔐 Paid bills history (Accountant + Admin)
// router.get(
//   "/history",
//   protect,
//   allowRoles("accountant", "admin"),
//   billingController.getHistory
// );

// // 🔐 Pay bill (Accountant only)
// router.post(
//   "/:id/pay",
//   protect,
//   allowRoles("accountant"),
//   billingController.markPaid
// );

// // ✅ Bill PDF (READ-ONLY, PUBLIC – REQUIRED for window.open)
// router.get(
//   "/:id/pdf",
//   billingController.generateBillPDF
// );

// export default router;






import express from "express";
import billingController from "../controllers/billing.Controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";

const router = express.Router();

router.get(
  "/public/:id/pdf",
  billingController.generatePublicBillPDF
);

router.get(
  "/inbox",
  auth,
  allowRoles("accountant"),
  billingController.getInbox
);

router.get(
  "/history",
  auth,
  allowRoles("accountant", "admin"),
  billingController.getHistory
);

router.post(
  "/manual",
  auth,
  allowRoles("accountant"),
  billingController.createManualBill
);

router.post(
  "/:id/customize",
  auth,
  allowRoles("accountant"),
  billingController.customizeBill
);

router.post(
  "/:id/pay",
  auth,
  allowRoles("accountant"),
  billingController.markPaid
);

router.get(
  "/:id/pdf",
  auth,
  allowRoles("accountant", "admin"),
  billingController.generateBillPDF
);

export default router;
