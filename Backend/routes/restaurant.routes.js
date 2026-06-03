import express from "express";
import auth from "../middlewares/auth.middleware.js";

import {
  createRestaurant,
  getRestaurants,
  getRestaurantById,
  updateRestaurant,
  updateBillingTemplate,
  deleteRestaurant,
  assignEmployeesToRestaurant,
  getRestaurantEmployees,
} from "../controllers/restaurant.controller.js";
import { cacheResponse } from "../middlewares/cache.middleware.js";

const router = express.Router();

/* ===============================
   RESTAURANT ROUTES (ADMIN)
=============================== */

// Create restaurant
router.post("/", auth, createRestaurant);

// Get all restaurants for logged-in admin
router.get(
  "/",
  auth,
  cacheResponse({
    ttlSeconds: 120,
    namespace: (req) => `restaurants:${req.user.id}`,
  }),
  getRestaurants
);

// Get single restaurant
router.get(
  "/:restaurantId",
  auth,
  cacheResponse({
    ttlSeconds: 120,
    namespace: (req) => `restaurant:${req.params.restaurantId}`,
  }),
  getRestaurantById
);

// Update restaurant billing template
router.put("/:restaurantId/billing-template", auth, updateBillingTemplate);

// Update restaurant
router.put("/:restaurantId", auth, updateRestaurant);

// Delete restaurant
router.delete("/:restaurantId", auth, deleteRestaurant);

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
  cacheResponse({
    ttlSeconds: 60,
    namespace: (req) => `restaurant-employees:${req.params.restaurantId}`,
  }),
  getRestaurantEmployees
);

export default router;
