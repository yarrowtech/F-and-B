// controllers/vendor.controller.js
import Vendor from "../models/Vendor.model.js";

/* ===============================
   CREATE VENDOR
=============================== */
const createVendor = async (req, res) => {
  try {
    const vendor = await Vendor.create(req.body);
    res.status(201).json(vendor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ===============================
   GET ALL VENDORS
=============================== */
const getVendors = async (_req, res) => {
  try {
    const vendors = await Vendor.find({});
    res.json(vendors);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ===============================
   GET VENDOR BY ID
=============================== */
const getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor)
      return res.status(404).json({ message: "Vendor not found" });
    res.json(vendor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ===============================
   UPDATE VENDOR
=============================== */
const updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!vendor)
      return res.status(404).json({ message: "Vendor not found" });

    res.json(vendor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ===============================
   DELETE VENDOR
=============================== */
const deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!vendor)
      return res.status(404).json({ message: "Vendor not found" });

    res.json({ message: "Vendor deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ===============================
   ✅ DEFAULT EXPORT (REQUIRED)
=============================== */
export default {
  createVendor,
  getVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
};
