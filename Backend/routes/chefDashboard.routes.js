import express from "express";
import { getChefDashboard } from "../controllers/chefDashboard.controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";

const router = express.Router();

/*
========================================
CHEF DASHBOARD
GET /api/chef/dashboard
========================================
*/

router.get(
  "/dashboard",
  auth,
  allowRoles("chef"),
  getChefDashboard
);

export default router;