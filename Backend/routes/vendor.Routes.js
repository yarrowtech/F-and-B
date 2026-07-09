import express from "express";
import vendorController from "../controllers/vendor.controller.js";
import vendorProductController from "../controllers/vendorProduct.controller.js";
import vendorOrderController from "../controllers/vendorOrder.controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";

const router = express.Router();

router.post("/login", vendorController.loginVendor);
router.get(
  "/public/orders/:orderId/pdf",
  vendorOrderController.generateVendorOrderPublicPdf
);

router.use(auth);

router.get("/me", allowRoles("vendor"), vendorController.getMyVendorProfile);
router.get("/dashboard-scope", allowRoles("vendor"), vendorController.getVendorDashboardScope);
router.post("/upgrade-request", allowRoles("vendor"), vendorController.requestGlobalUpgrade);

router.post("/local", allowRoles("admin"), vendorController.createLocalVendor);
router.get(
  "/explore/global",
  allowRoles("admin", "super_admin"),
  vendorController.exploreGlobalVendors
);
router.get(
  "/explore/global/:id/products",
  allowRoles("admin", "super_admin"),
  vendorProductController.getExploreGlobalVendorProducts
);
router.post(
  "/:id/connect",
  allowRoles("admin"),
  vendorController.connectGlobalVendor
);

router.get(
  "/upgrade-requests",
  allowRoles("super_admin"),
  vendorController.getUpgradeRequests
);
router.post(
  "/global",
  allowRoles("super_admin"),
  vendorController.createGlobalVendor
);
router.post(
  "/:id/review-upgrade",
  allowRoles("super_admin"),
  vendorController.reviewUpgradeRequest
);

router.get(
  "/orders/history",
  allowRoles("admin", "super_admin"),
  vendorOrderController.getAdminOrderHistory
);

router.get("/", allowRoles("admin", "super_admin", "vendor"), vendorController.getVendors);
router.get("/:id", allowRoles("admin", "super_admin", "vendor"), vendorController.getVendorById);
router.put("/:id", allowRoles("admin", "super_admin", "vendor"), vendorController.updateVendor);
router.put(
  "/:id/reset-password",
  allowRoles("admin", "super_admin"),
  vendorController.resetVendorPassword
);
router.delete("/:id", allowRoles("admin", "super_admin"), vendorController.deleteVendor);

router.get(
  "/:id/products",
  allowRoles("admin", "super_admin", "vendor"),
  vendorProductController.getVendorProducts
);
router.post("/:id/products", allowRoles("vendor"), vendorProductController.createVendorProduct);
router.put(
  "/:id/products/:productId",
  allowRoles("vendor"),
  vendorProductController.updateVendorProduct
);
router.delete(
  "/:id/products/:productId",
  allowRoles("vendor"),
  vendorProductController.deleteVendorProduct
);

router.get(
  "/:id/orders",
  allowRoles("admin", "super_admin", "vendor"),
  vendorOrderController.getVendorOrders
);
router.post("/:id/orders", allowRoles("admin"), vendorOrderController.createVendorOrder);
router.put(
  "/:id/orders/:orderId/status",
  allowRoles("admin", "super_admin", "vendor"),
  vendorOrderController.updateVendorOrderStatus
);
router.put(
  "/:id/orders/:orderId/bill",
  allowRoles("admin", "super_admin", "vendor"),
  vendorOrderController.generateVendorOrderBill
);
router.get(
  "/:id/orders/:orderId/pdf",
  allowRoles("admin", "super_admin", "vendor"),
  vendorOrderController.generateVendorOrderPdf
);
router.put(
  "/:id/orders/:orderId/payment",
  allowRoles("admin", "super_admin", "vendor"),
  vendorOrderController.updateVendorOrderPayment
);

export default router;
