import express from "express";
import {
  getTodayDashboard,
  getMonthlyDashboard,
  getTopItemsDashboard
} from "../controllers/dashboard.controller.js";

import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import { cacheResponse } from "../middlewares/cache.middleware.js";

const router = express.Router();

/*
====================================================
📊 TODAY DASHBOARD
GET /api/dashboard/today
====================================================
*/
router.get(
  "/today",
  auth,
  allowRoles("admin", "manager"),
  cacheResponse({
    ttlSeconds: 30,
    namespace: "dashboard",
  }),
  getTodayDashboard
);

/*
====================================================
📅 MONTHLY DASHBOARD
GET /api/dashboard/monthly
====================================================
*/
router.get(
  "/monthly",
  auth,
  allowRoles("admin", "manager"),
  cacheResponse({
    ttlSeconds: 120,
    namespace: "dashboard",
  }),
  getMonthlyDashboard
);

/*
====================================================
🏆 TOP SELLING ITEMS
GET /api/dashboard/top-items
Optional Query:
?type=today
?type=monthly
====================================================
*/
router.get(
  "/top-items",
  auth,
  allowRoles("admin", "manager"),
  cacheResponse({
    ttlSeconds: 60,
    namespace: "dashboard",
  }),
  getTopItemsDashboard
);

export default router;
