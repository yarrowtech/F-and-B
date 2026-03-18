import express from "express";
import {
  getAdminDashboardSummary,
  getMonthlyChart,
  getTopItems
} from "../controllers/adminDashboard.controller.js";

import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";

const router = express.Router();

/*
====================================================
ADMIN DASHBOARD
====================================================
*/

router.get("/dashboard", auth, allowRoles("admin"), getAdminDashboardSummary);

router.get("/dashboard/monthly", auth, allowRoles("admin"), getMonthlyChart);

router.get("/dashboard/top-items", auth, allowRoles("admin"), getTopItems);

export default router;