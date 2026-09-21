import express from "express";
import { getPolicy } from "../controllers/policy.controller.js";

const router = express.Router();

// Public — privacy policy and terms & conditions shown on the marketing site
router.get("/:slug", getPolicy);

export default router;
