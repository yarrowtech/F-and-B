// import express from "express";
// import { login } from "../controllers/auth.controller.js";

// const router = express.Router();

// router.post("/login", login);

// export default router;





// 27.3 - security improvements


import express from "express";
import {
  forgotPassword,
  login,
  resetForgotPassword,
} from "../controllers/auth.controller.js";
import { loginLimiter } from "../middlewares/rateLimit.js"; // 🔥 added

const router = express.Router();

/* ===============================
   LOGIN (STRICT LIMIT)
=============================== */
router.post("/login", loginLimiter, login);
router.post("/forgot-password", loginLimiter, forgotPassword);
router.post("/reset-password", loginLimiter, resetForgotPassword);

export default router;
