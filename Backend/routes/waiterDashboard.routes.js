import express from "express";
import { getWaiterDashboard } from "../controllers/waiterDashboard.controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import { cacheResponse } from "../middlewares/cache.middleware.js";

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
  cacheResponse({
    ttlSeconds: 20,
    namespace: "dashboard",
  }),
  getWaiterDashboard
);

export default router;
