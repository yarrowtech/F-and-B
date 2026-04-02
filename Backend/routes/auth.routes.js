// import express from "express";
// import { login } from "../controllers/auth.controller.js";

// const router = express.Router();

// router.post("/login", login);

// export default router;





// 27.3 - security improvements


import express from "express";
import { login } from "../controllers/auth.controller.js";
import { loginLimiter } from "../middlewares/rateLimit.js"; // 🔥 added

const router = express.Router();

/* ===============================
   LOGIN (STRICT LIMIT)
=============================== */
router.post("/login", loginLimiter, login);

export default router;