
// // routes/employee.Routes.js

// import express from "express";
// import employeeController from "../controllers/employee.Controller.js";
// import auth from "../middlewares/auth.middleware.js";

// const router = express.Router();

// /* ===============================
//    EMPLOYEE ROUTES
// =============================== */

// /* CREATE EMPLOYEE */
// router.post("/", auth, employeeController.createEmployee);

// /* GET ALL EMPLOYEES */
// router.get("/", auth, employeeController.getEmployees);
// /* ✅ profile */
// router.get("/me", auth, employeeController.getMyProfile);

// /* GET SINGLE EMPLOYEE */
// router.get("/:id", auth, employeeController.getEmployeeById);

// /* UPDATE EMPLOYEE */
// router.put("/:id", auth, employeeController.updateEmployee);

// /* DELETE EMPLOYEE */
// router.delete("/:id", auth, employeeController.deleteEmployee);

// /* REMOVE EMPLOYEE FROM RESTAURANT */
// router.put(
//   "/:id/remove-restaurant",
//   auth,
//   employeeController.removeEmployeeFromRestaurant
// );

// /* ADMIN RESET EMPLOYEE PASSWORD */
// router.put(
//   "/:id/reset-password",
//   auth,
//   employeeController.resetEmployeePassword
// );

// export default router;







// 27.3 - security


// routes/employee.Routes.js

import express from "express";
import employeeController from "../controllers/employee.Controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import {
  apiLimiter,
  adminLimiter,
} from "../middlewares/rateLimit.js"; // 🔥 added

const router = express.Router();

/* ===============================
   EMPLOYEE ROUTES
=============================== */

/* CREATE EMPLOYEE (ADMIN ONLY) */
router.post(
  "/",
  auth,
  adminLimiter, // 🔐 strict
  allowRoles("admin"),
  employeeController.createEmployee
);

/* GET ALL EMPLOYEES (ADMIN + MANAGER) */
router.get(
  "/",
  auth,
  apiLimiter, // ⚡ normal
  allowRoles("admin", "manager"),
  employeeController.getEmployees
);

/* DELETE HISTORY (ADMIN ONLY) */
router.get(
  "/history/deleted",
  auth,
  apiLimiter, // ⚡ normal
  allowRoles("admin"),
  employeeController.getDeletedEmployeesHistory
);

/* PROFILE (ALL LOGGED-IN USERS) */
router.get(
  "/me",
  auth,
  apiLimiter,
  employeeController.getMyProfile
);

/* RESTAURANT EMPLOYEES LIST (MANAGER) */
router.get(
  "/restaurant/list",
  auth,
  apiLimiter,
  allowRoles("manager"),
  employeeController.getRestaurantEmployees
);

/* STAFF WORK REPORT (MANAGER) */
router.get(
  "/restaurant/work-report",
  auth,
  apiLimiter,
  allowRoles("manager"),
  employeeController.getStaffWorkReport
);

/* GET SINGLE EMPLOYEE */
router.get(
  "/:id",
  auth,
  apiLimiter, // ⚡ normal
  allowRoles("admin", "manager"),
  employeeController.getEmployeeById
);

/* UPDATE EMPLOYEE (ADMIN ONLY) */
router.put(
  "/:id",
  auth,
  adminLimiter, // 🔐 strict
  allowRoles("admin"),
  employeeController.updateEmployee
);

/* DELETE EMPLOYEE (ADMIN ONLY) */
router.delete(
  "/:id",
  auth,
  adminLimiter, // 🔐 strict
  allowRoles("admin"),
  employeeController.deleteEmployee
);

/* REMOVE EMPLOYEE FROM RESTAURANT (ADMIN ONLY) */
router.put(
  "/:id/remove-restaurant",
  auth,
  adminLimiter, // 🔐 strict
  allowRoles("admin"),
  employeeController.removeEmployeeFromRestaurant
);

/* RESET PASSWORD (ADMIN ONLY) */
router.put(
  "/:id/reset-password",
  auth,
  adminLimiter, // 🔐 strict
  allowRoles("admin"),
  employeeController.resetEmployeePassword
);

export default router;