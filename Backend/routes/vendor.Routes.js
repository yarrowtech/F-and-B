// routes/vendor.Routes.js
import express from "express";
import vendorController from "../controllers/vendor.controller.js";

const router = express.Router();

/* ===============================
   VENDOR ROUTES
=============================== */

// create vendor
router.post("/", vendorController.createVendor);

// get all vendors
router.get("/", vendorController.getVendors);

// get single vendor
router.get("/:id", vendorController.getVendorById);

// update vendor
router.put("/:id", vendorController.updateVendor);

// delete vendor
router.delete("/:id", vendorController.deleteVendor);

export default router;
