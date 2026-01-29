// const Cheif = require("../models/cheif");
// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcryptjs");

// // Generate token
// const generateToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
// };

// // ===============================
// // Create employee (by Admin)
// // ===============================
// const createCheif = async (req, res) => {
//   try {
//     console.log("📥 Incoming Cheif Data:", req.body); // 👈 Debugging log

//     const { fullName, restaurantName, email, mobile, role, cheifId, password } = req.body;

//     // Validate all required fields
//     if (!fullName || !restaurantName || !email || !mobile || !role || !cheifId || !password) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     const exists = await Cheif.findOne({ cheifId });
//     if (exists) {
//       return res.status(400).json({ message: "Cheif ID already exists" });
//     }

//     // Hash password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Save employee
//     const cheif = await Cheif.create({
//       fullName,
//       restaurantName,
//       email,
//       mobile,
//       role,
//       cheifId,
//       password: hashedPassword,
//     });

//     res.status(201).json({
//       _id: cheif._id,
//       fullName: cheif.fullName,
//       restaurantName: cheif.restaurantName,
//       email: cheif.email,
//       mobile: cheif.mobile,
//       role: cheif.role,
//       cheifId: cheif.cheifId,
//     });
//   } catch (err) {
//     console.error("❌ Error creating cheif:", err.message);
//     res.status(500).json({ message: err.message });
//   }
// };

// // ===============================
// // Employee login
// // ===============================
// const loginCheif = async (req, res) => {
//   try {
//     const { cheifId, password } = req.body;

//     const cheif = await Cheif.findOne({ cheifId });
//     if (!cheif) {
//       return res.status(401).json({ message: "Invalid cheif ID or password" });
//     }

//     const isMatch = await bcrypt.compare(password, cheif.password);
//     if (!isMatch) {
//       return res.status(401).json({ message: "Invalid cheif ID or password" });
//     }

//     res.json({
//       message: "Login successful",
//       cheif: {
//         _id: cheif._id,
//         fullName: cheif.fullName,
//         restaurantName: cheif.restaurantName,
//         email: cheif.email,
//         mobile: cheif.mobile,
//         role: cheif.role,
//        cheifId: cheif.cheifId,
//         token: generateToken(cheif._id),
//       },
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // ===============================
// // Get all employees (Admin Dashboard)
// // ===============================
// const getCheif = async (req, res) => {
//   try {
//     const cheif = await Cheif.find({});
//     res.json(cheif);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// module.exports = { createCheif, loginCheif, getCheif };