import express from "express";
import auth from "../middlewares/auth.middleware.js";
import { logoutSession } from "../controllers/session.controller.js";

const router = express.Router();

router.post("/logout", auth, logoutSession);

export default router;
