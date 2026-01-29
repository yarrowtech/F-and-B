// const express = require("express");
// const router = express.Router();
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const Admin = require("../models/admin"); 

// router.post("/register", async (req, res) => {
//   try {
//     const { businessName, email, phoneNumber, businessAddress, panNumber, password } = req.body;

//     const existingAdmin = await Admin.findOne({ email });
//     if (existingAdmin) return res.status(400).json({ message: "Email already registered" });

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const newAdmin = new Admin({
//       businessName,
//       email,
//       phoneNumber,
//       businessAddress,
//       panNumber,
//       password: hashedPassword,
//     });

//     await newAdmin.save();
//     res.json({ message: "Registration successful" });
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// });


// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const admin = await Admin.findOne({ email });
//     if (!admin) return res.status(400).json({ message: "Invalid email or password" });

//     const isMatch = await bcrypt.compare(password, admin.password);
//     if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

//     const token = jwt.sign({ id: admin._id }, "your_jwt_secret", { expiresIn: "1h" });
//     res.json({ message: "Login successful", token });
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// });

// module.exports = router;

const express = require("express");
const { registerAdmin, loginAdmin } = require("../controllers/admin.Controller");

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

module.exports = router;

