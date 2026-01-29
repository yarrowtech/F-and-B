// const Cleaner = require("../models/cleaner");
// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcryptjs");

// // Generate token
// const generateToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
// };

// // ===============================
// // Create employee (by Admin)
// // ===============================
// const createCleaner = async (req, res) => {
//   try {
//     console.log("📥 Incoming Cleaner Data:", req.body); // 👈 Debugging log

//     const { fullName, restaurantName, email, mobile, role, cleanerId, password } = req.body;

//     // Validate all required fields
//     if (!fullName || !restaurantName || !email || !mobile || !role || !cleanerId || !password) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     const exists = await Cleaner.findOne({ cleanerId });
//     if (exists) {
//       return res.status(400).json({ message: "Cleaner ID already exists" });
//     }

//     // Hash password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Save employee
//     const cleaner = await Cleaner.create({
//       fullName,
//       restaurantName,
//       email,
//       mobile,
//       role,
//       cleanerId,
//       password: hashedPassword,
//     });

//     res.status(201).json({
//       _id: cleaner._id,
//       fullName: cleaner.fullName,
//       restaurantName: cleaner.restaurantName,
//       email: cleaner.email,
//       mobile: cleaner.mobile,
//       role: cleaner.role,
//       cleanerId: cleaner.cleanerId,
//     });
//   } catch (err) {
//     console.error("❌ Error creating cleaner:", err.message);
//     res.status(500).json({ message: err.message });
//   }
// };

// // ===============================
// // Employee login
// // ===============================
// const loginCleaner = async (req, res) => {
//   try {
//     const { cleanerId, password } = req.body;

//     const cleaner = await Cleaner.findOne({ cleanerId });
//     if (!cleaner) {
//       return res.status(401).json({ message: "Invalid cleaner ID or password" });
//     }

//     const isMatch = await bcrypt.compare(password, cleaner.password);
//     if (!isMatch) {
//       return res.status(401).json({ message: "Invalid cleaner ID or password" });
//     }

//     res.json({
//       message: "Login successful",
//       cleaner: {
//         _id: cleaner._id,
//         fullName: cleaner.fullName,
//         restaurantName: cleaner.restaurantName,
//         email: cleaner.email,
//         mobile: cleaner.mobile,
//         role: cleaner.role,
//         cleanerId: cleaner.cleanerId,
//         token: generateToken(cleaner._id),
//       },
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // ===============================
// // Get all employees (Admin Dashboard)
// // ===============================
// const getCleaner = async (req, res) => {
//   try {
//     const cleaner = await Cleaner.find({});
//     res.json(cleaner);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// module.exports = { createCleaner, loginCleaner, getCleaner};