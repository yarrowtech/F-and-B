import express from "express";
import {
  getAdminSummary,
  getMonthlyChart,
  getTopItems,
  getDailySales,
} from "../controllers/adminDashboard.controller.js";

const router = express.Router();

/* =========================================================
   📊 ADMIN DASHBOARD ROUTES
========================================================= */

/**
 * @route   GET /api/admin-dashboard/summary
 * @desc    Get dashboard summary (orders, revenue, restaurants)
 * @query   restaurantId, startDate, endDate
 */
router.get("/summary", getAdminSummary);

/**
 * @route   GET /api/admin-dashboard/monthly
 * @desc    Get monthly revenue + orders chart
 * @query   restaurantId, startDate, endDate
 */
router.get("/monthly", getMonthlyChart);

/**
 * @route   GET /api/admin-dashboard/top-items
 * @desc    Get top selling items
 * @query   restaurantId, startDate, endDate
 */
router.get("/top-items", getTopItems);

/**
 * @route   GET /api/admin-dashboard/daily-sales
 * @desc    Get daily sales analytics
 * @query   restaurantId, startDate, endDate
 */
router.get("/daily-sales", getDailySales);

export default router;