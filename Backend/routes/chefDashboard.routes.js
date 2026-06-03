import express from "express";
import { getChefDashboard } from "../controllers/chefDashboard.controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import { cacheResponse } from "../middlewares/cache.middleware.js";

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
  cacheResponse({
    ttlSeconds: 15,
    namespace: "dashboard",
  }),
  getChefDashboard
);

export default router;
