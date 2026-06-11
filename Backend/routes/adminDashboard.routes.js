import express from "express";
import {
  getAdminSummary,
  getMonthlyChart,
  getTopItems,
  getDailySales,
  getRestaurantBreakdown,
  getAdminAccountHistory,
  exportAdminAccountHistoryExcel,
} from "../controllers/adminDashboard.controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import { cacheResponse } from "../middlewares/cache.middleware.js";

const router = express.Router();

// All admin-dashboard routes require authentication
router.use(auth);
router.use(allowRoles("admin"));

/* =========================================================
   📊 ADMIN DASHBOARD ROUTES
========================================================= */

/**
 * @route   GET /api/admin-dashboard/summary
 * @desc    Get dashboard summary (orders, revenue, restaurants)
 * @query   restaurantId, startDate, endDate
 */
router.get(
  "/summary",
  cacheResponse({
    ttlSeconds: 30,
    namespace: "dashboard",
  }),
  getAdminSummary
);

/**
 * @route   GET /api/admin-dashboard/monthly
 * @desc    Get monthly revenue + orders chart
 * @query   restaurantId, startDate, endDate
 */
router.get(
  "/monthly",
  cacheResponse({
    ttlSeconds: 120,
    namespace: "dashboard",
  }),
  getMonthlyChart
);

/**
 * @route   GET /api/admin-dashboard/top-items
 * @desc    Get top selling items
 * @query   restaurantId, startDate, endDate
 */
router.get(
  "/top-items",
  cacheResponse({
    ttlSeconds: 60,
    namespace: "dashboard",
  }),
  getTopItems
);

/**
 * @route   GET /api/admin-dashboard/daily-sales
 * @desc    Get daily sales analytics
 * @query   restaurantId, startDate, endDate
 */
router.get(
  "/daily-sales",
  cacheResponse({
    ttlSeconds: 60,
    namespace: "dashboard",
  }),
  getDailySales
);

router.get(
  "/restaurant-breakdown",
  cacheResponse({
    ttlSeconds: 60,
    namespace: "dashboard",
  }),
  getRestaurantBreakdown
);

router.get(
  "/account-history/excel",
  exportAdminAccountHistoryExcel
);

router.get(
  "/account-history",
  cacheResponse({
    ttlSeconds: 60,
    namespace: "dashboard",
  }),
  getAdminAccountHistory
);

export default router;
