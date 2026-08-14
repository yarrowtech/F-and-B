import express from "express";
import optionalAuth from "../middlewares/optionalAuth.middleware.js";
import protect from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import {
  endProjectAnalyticsSession,
  exportProjectAnalytics,
  getProjectAnalyticsSummary,
  pingProjectAnalyticsSession,
  startProjectAnalyticsSession,
  trackProjectActivityEvent,
  trackProjectPageView,
} from "../controllers/projectAnalytics.Controller.js";

const router = express.Router();

router.post("/session/start", optionalAuth, startProjectAnalyticsSession);
router.post("/page-view", optionalAuth, trackProjectPageView);
router.post("/event", optionalAuth, trackProjectActivityEvent);
router.post("/session/ping", optionalAuth, pingProjectAnalyticsSession);
router.post("/session/end", optionalAuth, endProjectAnalyticsSession);

router.get("/summary", protect, allowRoles("super_admin"), getProjectAnalyticsSummary);
router.get("/export", protect, allowRoles("super_admin"), exportProjectAnalytics);

export default router;
