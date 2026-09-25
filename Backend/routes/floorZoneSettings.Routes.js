import express from "express";
import floorZoneSettingsController from "../controllers/floorZoneSettings.Controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";

const router = express.Router();

/*
Mounted in server.js as:
app.use("/api/floor-zone-settings", floorZoneSettingsRoutes);

Final URLs:
GET  /api/floor-zone-settings/:restaurantId
PUT  /api/floor-zone-settings/:restaurantId
*/

router.get("/:restaurantId", auth, floorZoneSettingsController.getZoneSettings);

router.put(
  "/:restaurantId",
  auth,
  allowRoles("admin", "manager"),
  floorZoneSettingsController.saveZoneSettings
);

export default router;
