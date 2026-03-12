import express from "express";
import { getAccountantDashboard } from "../controllers/accountantDashboard.controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";

const router = express.Router();

router.get(
  "/dashboard",
  auth,
  allowRoles("accountant"),
  getAccountantDashboard
);

export default router;