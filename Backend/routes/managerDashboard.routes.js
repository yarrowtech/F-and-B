import express from "express";
import {
  getManagerAccountHistory,
  getManagerDashboard,
  exportManagerAccountHistoryExcel,
} from "../controllers/managerDashboard.controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import { cacheResponse } from "../middlewares/cache.middleware.js";

const router = express.Router();

/*
====================================================
MANAGER DASHBOARD
GET /api/manager/dashboard
====================================================
*/

router.get(
  "/dashboard",
  auth,
  allowRoles("manager"),
  cacheResponse({
    ttlSeconds: 30,
    namespace: "dashboard",
  }),
  getManagerDashboard
);

router.get(
  "/account-history/excel",
  auth,
  allowRoles("manager"),
  exportManagerAccountHistoryExcel
);

router.get(
  "/account-history",
  auth,
  allowRoles("manager"),
  cacheResponse({
    ttlSeconds: 60,
    namespace: "dashboard",
  }),
  getManagerAccountHistory
);

export default router;
