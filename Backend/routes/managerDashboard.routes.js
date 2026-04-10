import express from "express";
import {
  getManagerAccountHistory,
  getManagerDashboard,
} from "../controllers/managerDashboard.controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";

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
  getManagerDashboard
);

router.get(
  "/account-history",
  auth,
  allowRoles("manager"),
  getManagerAccountHistory
);

export default router;
