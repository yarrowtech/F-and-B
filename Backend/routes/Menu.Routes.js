
import express from "express";
import auth from "../middlewares/auth.middleware.js";
import allowRoles from "../middlewares/role.middleware.js";
import {
  createMenuItem,
  getMenu,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
} from "../controllers/menu.controller.js";

const router = express.Router();

/*
Base path:
app.use("/api/menu", menuRoutes);

Final endpoints:

POST   /api/menu/:restaurantId
GET    /api/menu/:restaurantId
GET    /api/menu/:restaurantId/:id
PUT    /api/menu/:restaurantId/:id
DELETE /api/menu/:restaurantId/:id
*/

router.post("/:restaurantId", auth, allowRoles("admin"), createMenuItem);
router.get("/:restaurantId", auth, getMenu);
router.get("/:restaurantId/:id", auth, getMenuItemById);
router.put("/:restaurantId/:id", auth, allowRoles("admin"), updateMenuItem);
router.delete("/:restaurantId/:id", auth, allowRoles("admin"), deleteMenuItem);

export default router;
