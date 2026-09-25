import express from "express";
import floorMarkerController from "../controllers/floorMarker.Controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";

const router = express.Router();

/*
Mounted in server.js as:
app.use("/api/floor-markers", floorMarkerRoutes);

Final URLs:
GET    /api/floor-markers/:restaurantId
POST   /api/floor-markers/:restaurantId
PUT    /api/floor-markers/:restaurantId/:id
DELETE /api/floor-markers/:restaurantId/:id
*/

router.get("/:restaurantId", auth, floorMarkerController.getMarkers);

router.post(
  "/:restaurantId",
  auth,
  allowRoles("admin", "manager"),
  floorMarkerController.createMarker
);

router.put(
  "/:restaurantId/:id",
  auth,
  allowRoles("admin", "manager"),
  floorMarkerController.updateMarker
);

router.delete(
  "/:restaurantId/:id",
  auth,
  allowRoles("admin", "manager"),
  floorMarkerController.deleteMarker
);

export default router;
