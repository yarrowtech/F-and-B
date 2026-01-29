// const Employee = require("../models/accountant");
// const jwt = require("jsonwebtoken");
// const bcrypt = require("bcryptjs");

// // Generate token
// const generateToken = (id) => {
//   return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
// };

// // ===============================
// // Create employee (by Admin)
// // ===============================
// const createAccountant = async (req, res) => {
//   try {
//     console.log("📥 Incoming Accountant Data:", req.body); // 👈 Debugging log

//     const { fullName, restaurantName, email, mobile, role, accountantId, password } = req.body;

//     // Validate all required fields
//     if (!fullName || !restaurantName || !email || !mobile || !role || !accountantId || !password) {
//       return res.status(400).json({ message: "All fields are required" });
//     }

//     const exists = await Accountant.findOne({ accountantId });
//     if (exists) {
//       return res.status(400).json({ message: "Accountant ID already exists" });
//     }

//     // Hash password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // Save employee
//     const accountant = await Accountant.create({
//       fullName,
//       restaurantName,
//       email,
//       mobile,
//       role,
//       accountantId,
//       password: hashedPassword,
//     });

//     res.status(201).json({
//       _id: accountant._id,
//       fullName: accountant.fullName,
//       restaurantName: accountant.restaurantName,
//       email: accountant.email,
//       mobile: accountant.mobile,
//       role: accountant.role,
//       accountantId: accountant.accountantId,
//     });
//   } catch (err) {
//     console.error("❌ Error creating accountant:", err.message);
//     res.status(500).json({ message: err.message });
//   }
// };

// // ===============================
// // Employee login
// // ===============================
// const loginAccountant = async (req, res) => {
//   try {
//     const { accountantId, password } = req.body;

//     const accountant = await Accountant.findOne({ accountantId });
//     if (!accountant) {
//       return res.status(401).json({ message: "Invalid accountant ID or password" });
//     }

//     const isMatch = await bcrypt.compare(password, accountant.password);
//     if (!isMatch) {
//       return res.status(401).json({ message: "Invalid accountant ID or password" });
//     }

//     res.json({
//       message: "Login successful",
//       accountant: {
//         _id: accountant._id,
//         fullName: accountant.fullName,
//         restaurantName: accountant.restaurantName,
//         email: accountant.email,
//         mobile: accountant.mobile,
//         role: accountant.role,
//         accountantId: accountant.accountantId,
//         token: generateToken(accountant._id),
//       },
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // ===============================
// // Get all employees (Admin Dashboard)
// // ===============================
// const getAccountant = async (req, res) => {
//   try {
//     const accountant = await Accountant.find({});
//     res.json(accountant);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// module.exports = { createAccountant, loginAccountant, getAccountant };
