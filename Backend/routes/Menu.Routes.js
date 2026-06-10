import express from "express";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import {
  createMenuItem,
  getMenu,
  getPublicMenu,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
  getMenuOrdersByDate,
  exportMenuSalesExcel,
} from "../controllers/Menu.Controller.js";
import { cacheResponse } from "../middlewares/cache.middleware.js";

const router = express.Router();

/* ⭐ ANALYTICS ROUTE FIRST */
router.get(
  "/orders-by-date/:restaurantId",
  auth,
  allowRoles("manager", "admin"),
  cacheResponse({
    ttlSeconds: 60,
    namespace: (req) => `menu-analytics:${req.params.restaurantId}`,
  }),
  getMenuOrdersByDate
);

router.get(
  "/orders-by-date/:restaurantId/excel",
  auth,
  allowRoles("manager", "admin"),
  exportMenuSalesExcel
);

/* MENU ROUTES */

router.get(
  "/public/:restaurantId",
  cacheResponse({
    ttlSeconds: 300,
    namespace: (req) => `public-menu:${req.params.restaurantId}`,
    scope: "public",
  }),
  getPublicMenu
);

router.post("/:restaurantId", auth, allowRoles("admin"), createMenuItem);

router.get(
  "/:restaurantId",
  auth,
  cacheResponse({
    ttlSeconds: 90,
    namespace: (req) => `menu:${req.params.restaurantId}`,
  }),
  getMenu
);

router.get(
  "/:restaurantId/:id",
  auth,
  cacheResponse({
    ttlSeconds: 90,
    namespace: (req) => `menu:${req.params.restaurantId}`,
  }),
  getMenuItemById
);

router.put("/:restaurantId/:id", auth, allowRoles("admin", "manager"), updateMenuItem);

router.delete("/:restaurantId/:id", auth, allowRoles("admin"), deleteMenuItem);

export default router;
