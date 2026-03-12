import express from "express";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import {
  createMenuItem,
  getMenu,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
  getMenuOrdersByDate,
} from "../controllers/Menu.Controller.js";

const router = express.Router();

/* ⭐ ANALYTICS ROUTE FIRST */
router.get(
  "/orders-by-date/:restaurantId",
  auth,
  allowRoles("manager", "admin"),
  getMenuOrdersByDate
);

/* MENU ROUTES */

router.post("/:restaurantId", auth, allowRoles("admin"), createMenuItem);

router.get("/:restaurantId", auth, getMenu);

router.get("/:restaurantId/:id", auth, getMenuItemById);

router.put("/:restaurantId/:id", auth, allowRoles("admin"), updateMenuItem);

router.delete("/:restaurantId/:id", auth, allowRoles("admin"), deleteMenuItem);

export default router;