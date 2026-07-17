

// const Admin = require("../models/admin");
// const generateToken = require("../utils/generateToken");
// // import axios from axios;

// exports.registerAdmin = async (req, res) => {
//   try {
//     const { businessName, email, mobile, address, panNumber, createPassword, confirmPassword } = req.body;

//     // Check passwords match
//     if (createPassword !== confirmPassword) {
//       return res.status(400).json({ message: "Passwords do not match" });
//     }

//     // Check if admin exists
//     const adminExists = await Admin.findOne({ email });
//     if (adminExists) {
//       return res.status(400).json({ message: "Admin already exists" });
//     }

//     // Create new admin
//     const admin = await Admin.create({
//       businessName,
//       email,
//       mobile,
//       address,
//       panNumber,
//       password: createPassword
//     });

//     res.status(201).json({
//       _id: admin.id,
//       businessName: admin.businessName,
//       email: admin.email,
//       token: generateToken(admin.id, "admin")
//     });

//   } catch (error) {
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// exports.loginAdmin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const admin = await Admin.findOne({ email });

//     if (admin && (await admin.matchPassword(password))) {
//       res.json({
//         _id: admin.id,
//         businessName: admin.businessName,
//         email: admin.email,
//         role: admin.role,
//         token: generateToken(admin.id,admin.role)
//       });
//     } else {
//       res.status(401).json({ message: "Invalid email or password" });
//     }

//   } catch (error) { 
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };





import mongoose from "mongoose";

import Admin from "../models/Admin.model.js";
import Employee from "../models/Employee.model.js";
import Menu from "../models/Menu.model.js";
import Table from "../models/Table.model.js";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import generateEmployeeId from "../utils/generateEmployeeId.js";

const sanitizeAddress = (value = {}) => ({
  line1: String(value.line1 || "").trim(),
  line2: String(value.line2 || "").trim(),
  landmark: String(value.landmark || "").trim(),
  city: String(value.city || "").trim(),
  state: String(value.state || "").trim(),
  pincode: String(value.pincode || "").trim(),
  country: String(value.country || "India").trim() || "India",
});

const buildAdminProfileResponse = (admin) => ({
  id: admin._id,
  adminId: admin.adminId,
  businessName: admin.businessName,
  email: admin.email,
  mobile: admin.mobile || "",
  panNumber: admin.panNumber || "",
  address: sanitizeAddress(admin.address || {}),
  isActive: Boolean(admin.isActive),
  createdAt: admin.createdAt,
  updatedAt: admin.updatedAt,
});

/* =====================================================
   ADMIN AUTH
===================================================== */

/* ---------- REGISTER ADMIN ---------- */
export const registerAdmin = async (req, res) => {
  try {
    const { businessName, email, mobile, address, panNumber, password } =
      req.body;

    if (!businessName || !email || !password) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const exists = await Admin.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const admin = await Admin.create({
      businessName,
      email,
      mobile,
      address,
      panNumber,
      password,
    });

    res.status(201).json({
      message: "Admin registered successfully",
      adminId: admin._id,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------- LOGIN ADMIN (by adminId) ---------- */
export const loginAdmin = async (req, res) => {
  try {
    const adminId = String(req.body.adminId || req.body.loginId || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if ((!adminId && !email) || !password) {
      return res.status(400).json({
        message: "Admin ID or email and password are required",
      });
    }

    const admin = await Admin.findOne(
      adminId
        ? { adminId: adminId.toUpperCase() }
        : { email }
    );

    if (!admin) {
      return res.status(401).json({
        message: "Invalid admin credentials",
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({ message: "Account is inactive. Contact super admin." });
    }

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid admin credentials",
      });
    }

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "4d" }
    );

    res.json({
      token,
      user: {
        id: admin._id,
        adminId: admin.adminId,
        email: admin.email,
        businessName: admin.businessName,
        role: "admin",
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------- FORGOT PASSWORD ---------- */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    admin.password = "123456";
    await admin.save();

    res.json({
      message: "Password reset successful. New password: 123456",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select("-password");
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    return res.json({
      success: true,
      profile: buildAdminProfileResponse(admin),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select("_id email");
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const businessName = String(req.body.businessName || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const mobile = String(req.body.mobile || "").trim();
    const panNumber = String(admin.panNumber || "").trim().toUpperCase();

    if (!businessName || !email || !mobile || !panNumber) {
      return res.status(400).json({
        message: "Business name, email, mobile, and PAN number are required",
      });
    }

    const existingAdmin = await Admin.findOne({
      email,
      _id: { $ne: admin._id },
    }).select("_id");

    if (existingAdmin) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          businessName,
          email,
          mobile,
          panNumber,
          address: sanitizeAddress(req.body.address || {}),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!updatedAdmin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    return res.json({
      success: true,
      message: "Profile updated successfully",
      profile: buildAdminProfileResponse(updatedAdmin),
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   ADMIN OPERATIONS (PROTECTED)
===================================================== */

/* ---------- CREATE EMPLOYEE ---------- */
export const createEmployee = async (req, res) => {
  try {
    const { name, role, password, phone, email } = req.body;

    if (!name || !role || !password) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const admin = await Admin.findById(req.user.id);
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const normalizedRole = role.toUpperCase().replace(/\s+/g, "_");

    if (email) {
      const exists = await Employee.findOne({ email });
      if (exists) {
        return res.status(400).json({ message: "Employee already exists" });
      }
    }

    const employeeId = await generateEmployeeId(admin._id, normalizedRole);
    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = await Employee.create({
      employeeId,
      name,
      role: normalizedRole,
      password: hashedPassword,
      phone,
      email,
      createdBy: admin._id,
      isActive: true,
    });

    res.status(201).json(employee);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------- GET ALL EMPLOYEES ---------- */
export const getEmployees = async (req, res) => {
  try {
    const adminId = new mongoose.Types.ObjectId(req.user.id);

    const employees = await Employee.find({ createdBy: adminId })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------- DELETE EMPLOYEE ---------- */
export const deleteEmployee = async (req, res) => {
  try {
    const adminId = new mongoose.Types.ObjectId(req.user.id);

    const employee = await Employee.findOneAndDelete({
      _id: req.params.id,
      createdBy: adminId,
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------- CREATE MENU ITEM ---------- */
export const createMenuItem = async (req, res) => {
  try {
    const { name, price } = req.body;

    if (!name || !price) {
      return res.status(400).json({ message: "Menu name & price required" });
    }

    const menu = await Menu.create({
      ...req.body,
      createdBy: req.user.id,
    });

    res.status(201).json(menu);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   TABLE LOGIC
===================================================== */

/* ---------- CREATE TABLE ---------- */
export const createTable = async (req, res) => {
  try {
    let { tableNumber } = req.body;

    if (tableNumber === undefined || tableNumber === null) {
      return res.status(400).json({ message: "Table number required" });
    }

    tableNumber = Number(tableNumber);
    if (Number.isNaN(tableNumber) || tableNumber <= 0) {
      return res.status(400).json({ message: "Invalid table number" });
    }

    const exists = await Table.findOne({
      tableNumber,
      createdBy: req.user.id,
    });

    if (exists) {
      return res.status(400).json({ message: "Table already exists" });
    }

    const table = await Table.create({
      tableNumber,
      status: "FREE",
      createdBy: req.user.id,
      activeOrderId: null,
    });

    res.status(201).json(table);
  } catch (err) {
    console.error("CREATE TABLE ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};
