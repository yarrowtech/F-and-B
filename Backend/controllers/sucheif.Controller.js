// const Sucheif = require("../models/sucheif");
// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcryptjs");

// // Generate token
// const generateToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
// };

// // ===============================
// // Create employee (by Admin)
// // ===============================
// const createSucheif = async (req, res) => {
//   try {
//     console.log("📥 Incoming Sucheif Data:", req.body); // 👈 Debugging log

//     const { fullName, restaurantName, email, mobile, role, sucheifId, password } = req.body;

//     // Validate all required fields
//     if (!fullName || !restaurantName || !email || !mobile || !role || !sucheifId || !password) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     const exists = await Sucheif.findOne({ sucheifId });
//     if (exists) {
//       return res.status(400).json({ message: "Sucheif ID already exists" });
//     }

//     // Hash password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Save employee
//     const sucheif = await Sucheif.create({
//       fullName,
//       restaurantName,
//       email,
//       mobile,
//       role,
//       sucheifId,
//       password: hashedPassword,
//     });

//     res.status(201).json({
//       _id: sucheif._id,
//       fullName: sucheif.fullName,
//       restaurantName: sucheif.restaurantName,
//       email: sucheif.email,
//       mobile: sucheif.mobile,
//       role: sucheif.role,
//       sucheifId: sucheif.sucheifId,
//     });
//   } catch (err) {
//     console.error("❌ Error creating sucheif:", err.message);
//     res.status(500).json({ message: err.message });
//   }
// };

// // ===============================
// // Employee login
// // ===============================
// const loginSucheif = async (req, res) => {
//   try {
//     const { sucheifId, password } = req.body;

//     const sucheif = await Sucheif.findOne({ sucheifId });
//     if (!sucheif) {
//       return res.status(401).json({ message: "Invalid sucheif ID or password" });
//     }

//     const isMatch = await bcrypt.compare(password, sucheif.password);
//     if (!isMatch) {
//       return res.status(401).json({ message: "Invalid sucheif ID or password" });
//     }

//     res.json({
//       message: "Login successful",
//       sucheif: {
//         _id: sucheif._id,
//         fullName: sucheif.fullName,
//         restaurantName: sucheif.restaurantName,
//         email: sucheif.email,
//         mobile: sucheif.mobile,
//         role: sucheif.role,
//         sucheifId: sucheif.sucheifId,
//         token: generateToken(sucheif._id),
//       },
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // ===============================
// // Get all employees (Admin Dashboard)
// // ===============================
// const getSucheif = async (req, res) => {
//   try {
//     const sucheif = await Sucheif.find({});
//     res.json(sucheif);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// module.exports = { createSucheif, loginSucheif, getSucheif };