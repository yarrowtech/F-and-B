import express from "express";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";

import {
  checkIn,
  checkOut,
  getTodayAttendance,
  getMonthlyAttendanceStats,
  getMonthlyChart,
  exportAttendanceExcel
} from "../controllers/attendance.controller.js";

const router = express.Router();

/* All Employees Can Check In/Out */
router.post(
  "/check-in",
  auth,
  allowRoles(
    "waiter",
    "chef",
    "accountant",
    "manager",
    "admin",
    "inventory_manager"   // ✅ ADDED
  ),
  checkIn
);

router.post(
  "/check-out",
  auth,
  allowRoles(
    "waiter",
    "chef",
    "accountant",
    "manager",
    "admin",
    "inventory_manager"   // ✅ ADDED
  ),
  checkOut
);

/* All Employees Can View Their Own Attendance */
router.get(
  "/today",
  auth,
  allowRoles(
    "waiter",
    "chef",
    "accountant",
    "manager",
    "admin",
    "inventory_manager"   // ✅ ADDED
  ),
  getTodayAttendance
);

router.get(
  "/monthly-stats",
  auth,
  allowRoles(
    "waiter",
    "chef",
    "accountant",
    "manager",
    "admin",
    "inventory_manager"   // ✅ ADDED
  ),
  getMonthlyAttendanceStats
);

router.get(
  "/monthly-chart",
  auth,
  allowRoles(
    "waiter",
    "chef",
    "accountant",
    "manager",
    "admin",
    "inventory_manager"   // ✅ ADDED
  ),
  getMonthlyChart
);

/* Export only for higher roles */
router.get(
  "/export",
  auth,
  allowRoles("manager", "admin"),
  exportAttendanceExcel
);

export default router;