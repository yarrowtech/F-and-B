// const Inventorymanager = require("../models/inventorymanager");
// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcryptjs");

// // Generate token
// const generateToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
// };

// // ===============================
// // Create employee (by Admin)
// // ===============================
// const createInventorymanager = async (req, res) => {
//   try {
//     console.log("📥 Incoming Inventorymanager Data:", req.body); // 👈 Debugging log

//     const { fullName, restaurantName, email, mobile, role, inventorymanagerId, password } = req.body;

//     // Validate all required fields
//     if (!fullName || !restaurantName || !email || !mobile || !role || !inventorymanagerId || !password) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     const exists = await Inventorymanager.findOne({ inventorymanagerId });
//     if (exists) {
//       return res.status(400).json({ message: "Inventorymanager ID already exists" });
//     }

//     // Hash password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Save employee
//     const inventorymanager = await Inventorymanager.create({
//       fullName,
//       restaurantName,
//       email,
//       mobile,
//       role,
//       inventorymanagerId,
//       password: hashedPassword,
//     });

//     res.status(201).json({
//       _id: inventorymanager._id,
//       fullName: inventorymanager.fullName,
//       restaurantName: inventorymanager.restaurantName,
//       email: inventorymanager.email,
//       mobile: inventorymanager.mobile,
//       role: inventorymanager.role,
//       inventorymanagerId: inventorymanager.inventorymanagerId,
//     });
//   } catch (err) {
//     console.error("❌ Error creating inventorymanager:", err.message);
//     res.status(500).json({ message: err.message });
//   }
// };

// // ===============================
// // Employee login
// // ===============================
// const loginInventorymanager = async (req, res) => {
//   try {
//     const { inventorymanagerId, password } = req.body;

//     const inventorymanager = await Inventorymanager.findOne({ inventorymanagerId });
//     if (!inventorymanager) {
//       return res.status(401).json({ message: "Invalid inventorymanager ID or password" });
//     }

//     const isMatch = await bcrypt.compare(password, inventorymanager.password);
//     if (!isMatch) {
//       return res.status(401).json({ message: "Invalid inventorymanager ID or password" });
//     }

//     res.json({
//       message: "Login successful",
//       inventorymanager: {
//         _id: inventorymanager._id,
//         fullName: inventorymanager.fullName,
//         restaurantName: inventorymanager.restaurantName,
//         email: inventorymanager.email,
//         mobile: inventorymanager.mobile,
//         role: inventorymanager.role,
//         inventorymanagerId: inventorymanager.inventorymanagerId,
//         token: generateToken(inventorymanager._id),
//       },
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // ===============================
// // Get all employees (Admin Dashboard)
// // ===============================
// const getInventorymanager = async (req, res) => {
//   try {
//     const inventorymanager = await Inventorymanager.find({});
//     res.json(inventorymanager);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// module.exports = { createInventorymanager, loginInventorymanager, getInventorymanager };