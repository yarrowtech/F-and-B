


import express from "express";

/* =========================
   CONTROLLERS
========================= */
import {
   registerAdmin,
   loginAdmin,
   forgotPassword,
   createEmployee,
   getEmployees,
   deleteEmployee,
   createMenuItem,
   createTable,
} from "../controllers/admin.Controller.js";

/* =========================
   MIDDLEWARES
========================= */
import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";

const router = express.Router();

/* =====================================================
   PUBLIC ROUTES (NO AUTH)
===================================================== */
router.post("/login", loginAdmin);
router.post("/forgot-password", forgotPassword);

/* =====================================================
   ADMIN PROTECTED ROUTES
   ⚠ auth MUST come before role
===================================================== */
router.use(auth);
router.use(role("ADMIN"));

/* ================= EMPLOYEE ================= */
router.post("/employee", createEmployee);        // CREATE
router.get("/employee", getEmployees);           // READ
router.delete("/employee/:id", deleteEmployee);  // DELETE

/* ================= MENU ================= */
router.post("/menu", createMenuItem);

/* ================= TABLE ================= */
router.post("/table", createTable);

export default router;
