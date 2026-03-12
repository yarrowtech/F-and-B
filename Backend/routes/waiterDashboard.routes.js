import express from "express";
import { getWaiterDashboard } from "../controllers/waiterDashboard.controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";

const router = express.Router();

/*
========================================
WAITER DASHBOARD
GET /api/waiter/dashboard
========================================
*/

router.get(
  "/dashboard",
  auth,
  allowRoles("waiter"),
  getWaiterDashboard
);

export default router;