const express = require("express");
const { loginSuperAdmin, forgotPassword } = require("../controllers/superAdmin.Controller");
const router = express.Router();

// Super Admin login
router.post("/login", loginSuperAdmin);

// Forgot Password
router.post("/forgot-password", forgotPassword);

module.exports = router;
