import express from "express";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import {
  createSupportTicket,
  getAllSupportTickets,
  getMySupportTickets,
  updateSupportTicketStatus,
} from "../controllers/supportTicket.controller.js";

const router = express.Router();

router.use(auth);

router.post("/", allowRoles("admin"), createSupportTicket);
router.get("/my", allowRoles("admin"), getMySupportTickets);
router.get("/", allowRoles("super_admin"), getAllSupportTickets);
router.patch("/:id/status", allowRoles("super_admin"), updateSupportTicketStatus);

export default router;
