// routes/Menu.Routes.js
import express from "express";
import menuController from "../controllers/menu.controller.js";

const router = express.Router();

/* ===============================
   MENU ROUTES
=============================== */
router.post("/", menuController.createMenuItem);
router.get("/", menuController.getMenu);
router.get("/:id", menuController.getMenuItemById);
router.put("/:id", menuController.updateMenuItem);
router.delete("/:id", menuController.deleteMenuItem);

export default router;
