import express from "express";
import {
  getRestaurantAssignments,
  setWaiterAssignments,
  getMyAssignments,
} from "../controllers/waiterTable.Controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";

const router = express.Router();

/*
Mounted in server.js as: app.use("/api/waiter-tables", waiterTableRoutes);

GET /api/waiter-tables/me                                  waiter: my assigned tables
GET /api/waiter-tables/:restaurantId                       admin / manager: waiters + assignments
PUT /api/waiter-tables/:restaurantId/waiters/:waiterId     admin / manager: replace a waiter's tables
*/

router.get("/me", auth, allowRoles("waiter"), getMyAssignments);

router.get("/:restaurantId", auth, allowRoles("admin", "manager"), getRestaurantAssignments);

router.put(
  "/:restaurantId/waiters/:waiterId",
  auth,
  allowRoles("admin", "manager"),
  setWaiterAssignments
);

export default router;
