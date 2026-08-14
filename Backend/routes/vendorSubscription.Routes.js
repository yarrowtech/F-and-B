import express from "express";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import vendorSubscriptionController from "../controllers/vendorSubscription.controller.js";

const router = express.Router();

router.get("/plans", vendorSubscriptionController.getPublicVendorPlans);

router.use(auth);

router.get("/me", allowRoles("vendor"), vendorSubscriptionController.getVendorSubscriptionOverview);
router.get("/status", allowRoles("vendor"), vendorSubscriptionController.getVendorPlanStatus);
router.post("/me/activate", allowRoles("vendor"), vendorSubscriptionController.activateVendorSubscription);
router.post("/me/order", allowRoles("vendor"), vendorSubscriptionController.createVendorSubscriptionOrder);
router.post("/me/verify", allowRoles("vendor"), vendorSubscriptionController.verifyVendorSubscriptionPayment);

router.get(
  "/super-admin/vendors",
  allowRoles("super_admin"),
  vendorSubscriptionController.getVendorSubscriptionSuperAdminOverview
);
router.post(
  "/super-admin/plans",
  allowRoles("super_admin"),
  vendorSubscriptionController.createVendorSubscriptionPlan
);
router.put(
  "/super-admin/plans/:code",
  allowRoles("super_admin"),
  vendorSubscriptionController.updateVendorSubscriptionPlan
);
router.patch(
  "/super-admin/vendors/:vendorId/assign",
  allowRoles("super_admin"),
  vendorSubscriptionController.assignPlanToVendorBySuperAdmin
);

export default router;
