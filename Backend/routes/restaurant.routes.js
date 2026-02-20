import express from "express";
import auth from "../middlewares/auth.middleware.js";

import {
  createRestaurant,
  getRestaurants,
  getRestaurantById,
  assignEmployeesToRestaurant,
  getRestaurantEmployees,
} from "../controllers/restaurant.controller.js";

const router = express.Router();

/* ===============================
   RESTAURANT ROUTES (ADMIN)
=============================== */

// Create restaurant
router.post("/", auth, createRestaurant);

// Get all restaurants for logged-in admin
router.get("/", auth, getRestaurants);

// ✅ GET SINGLE RESTAURANT (FIXED 404 ISSUE)
router.get("/:restaurantId", auth, getRestaurantById);

// Assign employees to restaurant
router.put(
  "/:restaurantId/assign-employees",
  auth,
  assignEmployeesToRestaurant
);

// Get employees of a restaurant
router.get(
  "/:restaurantId/employees",
  auth,
  getRestaurantEmployees
);

export default router;
