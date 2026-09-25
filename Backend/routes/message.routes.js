import express from "express";
import messageController from "../controllers/message.controller.js";
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();

/*
Mounted in server.js as: app.use("/api/messages", messageRoutes);

GET  /api/messages/contacts
GET  /api/messages/unread-count
GET  /api/messages/:contactId
POST /api/messages/:contactId   { text }
*/

router.get("/restaurants", auth, messageController.getRestaurants);
router.get("/contacts", auth, messageController.getContacts);
router.get("/unread-count", auth, messageController.getUnreadCount);
router.get("/:contactId", auth, messageController.getThread);
router.post("/:contactId", auth, messageController.sendMessage);

export default router;
