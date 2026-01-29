



// // // controllers/manager.Controller.js
// // const Manager = require("../models/manager");
// // const jwt = require("jsonwebtoken");
// // const bcrypt = require("bcryptjs");

// // const generateToken = (id) => {
// //   return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
// // };

// // const createManager = async (req, res) => {
// //   try {
// //     const { managerId, password } = req.body;

// //     const exists = await Manager.findOne({ managerId });
// //     if (exists) return res.status(400).json({ message: "Manager already exists" });

// //     const salt = await bcrypt.genSalt(10);
// //     const hashedPassword = await bcrypt.hash(password, salt);

// //     const manager = await Manager.create({ managerId, password: hashedPassword });

// //     res.status(201).json({
// //       _id: manager._id,
// //       managerId: manager.managerId,
// //       token: generateToken(manager._id),
// //     });
// //   } catch (err) {
// //     res.status(500).json({ message: err.message });
// //   }
// // };

// // const loginManager = async (req, res) => {
// //   try {
// //     const { managerId, password } = req.body;

// //     const manager = await Manager.findOne({ managerId });
// //     if (!manager) return res.status(401).json({ message: "Invalid manager ID or password" });

// //     const isMatch = await bcrypt.compare(password, manager.password);
// //     if (!isMatch) return res.status(401).json({ message: "Invalid manager ID or password" });

// //     res.json({
// //       message: "Login successful",
// //       manager: {
// //         _id: manager._id,
// //         managerId: manager.managerId,
// //         token: generateToken(manager._id),
// //       },
// //     });
// //   } catch (err) {
// //     res.status(500).json({ message: err.message });
// //   }
// // };

// // module.exports = { createManager, loginManager };

// // const Manager = require("../models/manager");
// // const bcrypt = require("bcryptjs");
// // const generateToken = require("../utils/generateToken");

// // // Manager login
// // exports.loginManager = async (req, res) => {
// //   try {
// //     const { managerId, password } = req.body;

// //     const manager = await Manager.findOne({ managerId });
// //     if (!manager) {
// //       return res.status(401).json({ message: "Invalid Manager ID or password" });
// //     }

// //     const isMatch = await bcrypt.compare(password, manager.password);
// //     if (!isMatch) {
// //       return res.status(401).json({ message: "Invalid Manager ID or password" });
// //     }

// //     res.json({
// //       message: "Login successful",
// //       manager: {
// //         _id: manager._id,
// //         fullName: manager.fullName,
// //         email: manager.email,
// //         managerId: manager.managerId,
// //         restaurantName: manager.restaurantName,
// //         token: generateToken(manager._id),
// //       },
// //     });
// //   } catch (err) {
// //     res.status(500).json({ message: err.message });
// //   }
// // };
// const Manager = require("../models/manager");
// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcryptjs");

// // Generate token
// const generateToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
// };

// // ===============================
// // Create employee (by Admin)
// // ===============================
// const createManager = async (req, res) => {
//   try {
//     console.log("📥 Incoming Manager Data:", req.body); // 👈 Debugging log

//     const { fullName, restaurantName, email, mobile, role, managerId, password } = req.body;

//     // Validate all required fields
//     if (!fullName || !restaurantName || !email || !mobile || !role || !managerId || !password) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     const exists = await Manager.findOne({ managerId });
//     if (exists) {
//       return res.status(400).json({ message: "Manager ID already exists" });
//     }

//     // Hash password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Save employee
//     const manager = await Manager.create({
//       fullName,
//       restaurantName,
//       email,
//       mobile,
//       role,
//       managerId,
//       password: hashedPassword,
//     });

//     res.status(201).json({
//       _id: manager._id,
//       fullName: manager.fullName,
//       restaurantName: manager.restaurantName,
//       email: manager.email,
//       mobile: manager.mobile,
//       role: manager.role,
//       managerId: manager.managerId,
//     });
//   } catch (err) {
//     console.error("❌ Error creating manager:", err.message);
//     res.status(500).json({ message: err.message });
//   }
// };

// // ===============================
// // Employee login
// // ===============================
// const loginManager = async (req, res) => {
//   try {
//     const { managerId, password } = req.body;

//     const manager = await Manager.findOne({ managerId });
//     if (!manager) {
//       return res.status(401).json({ message: "Invalid manager ID or password" });
//     }

//     const isMatch = await bcrypt.compare(password, manager.password);
//     if (!isMatch) {
//       return res.status(401).json({ message: "Invalid manager ID or password" });
//     }

//     res.json({
//       message: "Login successful",
//       manager: {
//         _id: manager._id,
//         fullName: manager.fullName,
//         restaurantName: manager.restaurantName,
//         email: manager.email,
//         mobile: manager.mobile,
//         role: manager.role,
//         managerId: manager.managerId,
//         token: generateToken(manager._id),
//       },
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // ===============================
// // Get all employees (Admin Dashboard)
// // ===============================
// const getManager = async (req, res) => {
//   try {
//     const manager = await Manager.find({});
//     res.json(manager);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// module.exports = { createManager, loginManager, getManager };