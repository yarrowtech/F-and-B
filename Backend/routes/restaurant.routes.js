import express from "express";
import auth from "../middlewares/auth.middleware.js";

import {
  createRestaurant,
  getRestaurants,
  getRestaurantById,
  updateRestaurant,
  updateBillingTemplate,
  updateTestMode,
  clearTestData,
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
    // Browser must revalidate (ETag) so edits show immediately after saving.
    cacheControl: "private, no-cache",
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
    cacheControl: "private, no-cache",
    namespace: (req) => `restaurant:${req.params.restaurantId}`,
  }),
  getRestaurantById
);

// Test (training) mode switch and cleanup (admin only)
router.put("/:restaurantId/test-mode", auth, updateTestMode);
router.delete("/:restaurantId/test-data", auth, clearTestData);

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
