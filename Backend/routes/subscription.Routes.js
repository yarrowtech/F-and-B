import express from "express";

import {
  assignPlanToAdminBySuperAdmin,
  createAdminSelfSignup,
  createAdminUpgradeOrder,
  createAdminSignupOrder,
  createSubscriptionPlan,
  getMySubscription,
  getPublicPlans,
  getSubscriptionAdminOverview,
  updateSubscriptionPlan,
  verifyAdminUpgradePayment,
  verifyAdminSignupPayment,
} from "../controllers/subscription.controller.js";
import protect from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/plans", getPublicPlans);
router.post("/admin-signup/create", createAdminSelfSignup);
router.post("/admin-signup/order", createAdminSignupOrder);
router.post("/admin-signup/verify", verifyAdminSignupPayment);

router.get("/me", protect, allowRoles("admin"), getMySubscription);
router.post("/me/upgrade/order", protect, allowRoles("admin"), createAdminUpgradeOrder);
router.post("/me/upgrade/verify", protect, allowRoles("admin"), verifyAdminUpgradePayment);

router.get(
  "/super-admin/admins",
  protect,
  allowRoles("super_admin"),
  getSubscriptionAdminOverview
);
router.post(
  "/super-admin/plans",
  protect,
  allowRoles("super_admin"),
  createSubscriptionPlan
);
router.put(
  "/super-admin/plans/:code",
  protect,
  allowRoles("super_admin"),
  updateSubscriptionPlan
);
router.patch(
  "/super-admin/admins/:adminId/assign",
  protect,
  allowRoles("super_admin"),
  assignPlanToAdminBySuperAdmin
);

export default router;
