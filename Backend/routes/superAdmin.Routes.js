// const express = require("express");
// const { loginSuperAdmin, forgotPassword } = require("../controllers/superAdmin.Controller");
// const router = express.Router();

// // Super Admin login
// router.post("/login", loginSuperAdmin);

// // Forgot Password
// router.post("/forgot-password", forgotPassword);

// module.exports = router;





import express from "express";
import {
  loginSuperAdmin,
  createSuperAdminBySuperAdmin,
  createAdminBySuperAdmin,
  getAllAdmins,
  deleteAdmin,
  toggleAdminStatus,
  updateAdmin,
  getAllSuperAdmins,
  deleteSuperAdmin,
  changePassword,
  forgotPassword,
  resetPassword,
  resetAdminPassword,
  getHistory,
} from "../controllers/superAdmin.Controller.js";

import protect from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";

const router = express.Router();

/* ================= AUTH ================= */
router.post("/login", loginSuperAdmin);

/* ================= CREATE USERS (SUPER_ADMIN ONLY) ================= */
router.post(
  "/create-super-admin",
  protect,
  allowRoles("super_admin"),
  createSuperAdminBySuperAdmin
);

router.post(
  "/create-admin",
  protect,
  allowRoles("super_admin"),
  createAdminBySuperAdmin
);

router.get(
  "/admins",
  protect,
  allowRoles("super_admin"),
  getAllAdmins
);

router.delete(
  "/admins/:id",
  protect,
  allowRoles("super_admin"),
  deleteAdmin
);

router.put(
  "/admins/:id/toggle-status",
  protect,
  allowRoles("super_admin"),
  toggleAdminStatus
);

router.put(
  "/admins/:id/reset-password",
  protect,
  allowRoles("super_admin"),
  resetAdminPassword
);

router.put(
  "/admins/:id",
  protect,
  allowRoles("super_admin"),
  updateAdmin
);

router.get(
  "/super-admins",
  protect,
  allowRoles("super_admin"),
  getAllSuperAdmins
);

router.delete(
  "/super-admins/:id",
  protect,
  allowRoles("super_admin"),
  deleteSuperAdmin
);

router.get(
  "/history",
  protect,
  allowRoles("super_admin"),
  getHistory
);

/* ================= PASSWORD ================= */
router.put(
  "/change-password",
  protect,
  allowRoles("super_admin"),
  changePassword
);

router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);

export default router;