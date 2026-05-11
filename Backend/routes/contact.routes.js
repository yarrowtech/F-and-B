import express from "express";
import {
  submitContactForm,
  getContactMessages,
  updateContactStatus,
} from "../controllers/contact.controller.js";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";

const router = express.Router();

// Public — landing page form submission
router.post("/", submitContactForm);

// Protected — super-admin only
router.get("/", auth, allowRoles("SUPER_ADMIN"), getContactMessages);
router.patch("/:id/status", auth, allowRoles("SUPER_ADMIN"), updateContactStatus);

export default router;
