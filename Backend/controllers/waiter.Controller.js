// const Waiter = require("../models/waiter");
// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcryptjs");

// // Generate token
// const generateToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
// };

// // ===============================
// // Create employee (by Admin)
// // ===============================
// const createWaiter = async (req, res) => {
//   try {
//     console.log("📥 Incoming Waiter Data:", req.body); // 👈 Debugging log

//     const { fullName, restaurantName, email, mobile, role, waiterId, password } = req.body;

//     // Validate all required fields
//     if (!fullName || !restaurantName || !email || !mobile || !role || !waiterId || !password) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     const exists = await Waiter.findOne({ waiterId });
//     if (exists) {
//       return res.status(400).json({ message: "Waiter ID already exists" });
//     }

//     // Hash password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Save employee
//     const waiter = await Waiter.create({
//       fullName,
//       restaurantName,
//       email,
//       mobile,
//       role,
//       waiterId,
//       password: hashedPassword,
//     });

//     res.status(201).json({
//       _id: waiter._id,
//       fullName: waiter.fullName,
//       restaurantName: waiter.restaurantName,
//       email: waiter.email,
//       mobile: waiter.mobile,
//       role: waiter.role,
//       waiterId: waiter.Id,
//     });
//   } catch (err) {
//     console.error("❌ Error creating waiter:", err.message);
//     res.status(500).json({ message: err.message });
//   }
// };

// // ===============================
// // Employee login
// // ===============================
// const loginWaiter = async (req, res) => {
//   try {
//     const { waiterId, password } = req.body;

//     const waiter = await Waiter.findOne({ waiterId });
//     if (!waiter) {
//       return res.status(401).json({ message: "Invalid waiter ID or password" });
//     }

//     const isMatch = await bcrypt.compare(password, waiter.password);
//     if (!isMatch) {
//       return res.status(401).json({ message: "Invalid waiter ID or password" });
//     }

//     res.json({
//       message: "Login successful",
//       waiter: {
//         _id: waiter._id,
//         fullName: waiter.fullName,
//         restaurantName: waiter.restaurantName,
//         email: waiter.email,
//         mobile: waiter.mobile,
//         role: waiter.role,
//         waiterId: waiter.waiterId,
//         token: generateToken(waiter._id),
//       },
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // ===============================
// // Get all employees (Admin Dashboard)
// // ===============================
// const getWaiter = async (req, res) => {
//   try {
//     const waiter = await Waiter.find({});
//     res.json(waiter);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// module.exports = { createWaiter, loginWaiter, getWaiter };