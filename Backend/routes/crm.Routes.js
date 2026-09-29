import express from "express";
import crmController from "../controllers/crm.Controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";

const router = express.Router();

router.get("/public/campaigns/:campaignId/image", crmController.getPublicCampaignImage);

/*
Mounted in server.js as:
app.use("/api/crm", crmRoutes);

Final URLs:

GET    /api/crm/:restaurantId/customers                (admin, manager)
GET    /api/crm/:restaurantId/customers/:phone         (admin, manager)
POST   /api/crm/:restaurantId/customers/:phone/notes    (admin, manager)
DELETE /api/crm/:restaurantId/notes/:noteId             (admin, manager)

GET    /api/crm/:restaurantId/campaigns                 (admin, manager)
POST   /api/crm/:restaurantId/campaigns                 (admin, manager)
DELETE /api/crm/:restaurantId/campaigns/:campaignId      (admin, manager)

GET    /api/crm/:restaurantId/loyalty                   (admin, manager)
PUT    /api/crm/:restaurantId/loyalty                   (admin, manager)

GET    /api/crm/:restaurantId/coupons                   (admin, manager)
POST   /api/crm/:restaurantId/customers/:phone/coupon    (admin, manager)
*/

router.get(
  "/:restaurantId/customers",
  auth,
  allowRoles("admin", "manager"),
  crmController.getCustomers
);

router.get(
  "/:restaurantId/customers/:phone",
  auth,
  allowRoles("admin", "manager"),
  crmController.getCustomerDetail
);

router.post(
  "/:restaurantId/customers/:phone/notes",
  auth,
  allowRoles("admin", "manager"),
  crmController.addCustomerNote
);

router.delete(
  "/:restaurantId/notes/:noteId",
  auth,
  allowRoles("admin", "manager"),
  crmController.deleteCustomerNote
);

router.get(
  "/:restaurantId/campaigns",
  auth,
  allowRoles("admin", "manager"),
  crmController.getCampaigns
);

router.post(
  "/:restaurantId/campaigns",
  auth,
  allowRoles("admin", "manager"),
  crmController.createCampaign
);

router.delete(
  "/:restaurantId/campaigns/:campaignId",
  auth,
  allowRoles("admin", "manager"),
  crmController.deleteCampaign
);

router.get(
  "/:restaurantId/loyalty",
  auth,
  allowRoles("admin", "manager"),
  crmController.getLoyaltySettings
);

router.put(
  "/:restaurantId/loyalty",
  auth,
  allowRoles("admin", "manager"),
  crmController.updateLoyaltySettings
);

router.get(
  "/:restaurantId/coupons",
  auth,
  allowRoles("admin", "manager"),
  crmController.getCoupons
);

router.post(
  "/:restaurantId/customers/:phone/coupon",
  auth,
  allowRoles("admin", "manager"),
  crmController.issueCoupon
);

export default router;
