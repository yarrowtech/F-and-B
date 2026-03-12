import express from "express";
import { getAdminDashboard } from "../controllers/adminDashboard.controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";

const router = express.Router();

/*
====================================================
ADMIN DASHBOARD
GET /api/admin/dashboard
====================================================
*/

router.get(
  "/dashboard",
  auth,
  allowRoles("admin"),
  getAdminDashboard
);

export default router;