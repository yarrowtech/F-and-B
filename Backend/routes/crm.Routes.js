import express from "express";
import crmController from "../controllers/crm.Controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";

const router = express.Router();

/*
Mounted in server.js as:
app.use("/api/crm", crmRoutes);

Final URLs:

GET    /api/crm/:restaurantId/customers              (admin, manager)
GET    /api/crm/:restaurantId/customers/:phone        (admin, manager)
POST   /api/crm/:restaurantId/customers/:phone/notes   (admin, manager)
DELETE /api/crm/:restaurantId/notes/:noteId            (admin, manager)
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

export default router;
