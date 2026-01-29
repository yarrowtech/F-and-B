

const Admin = require("../models/admin");
const generateToken = require("../utils/generateToken");
// import axios from axios;

exports.registerAdmin = async (req, res) => {
  try {
    const { businessName, email, mobile, address, panNumber, createPassword, confirmPassword } = req.body;

    // Check passwords match
    if (createPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Check if admin exists
    const adminExists = await Admin.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    // Create new admin
    const admin = await Admin.create({
      businessName,
      email,
      mobile,
      address,
      panNumber,
      password: createPassword
    });

    res.status(201).json({
      _id: admin.id,
      businessName: admin.businessName,
      email: admin.email,
      token: generateToken(admin.id, "admin")
    });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });

    if (admin && (await admin.matchPassword(password))) {
      res.json({
        _id: admin.id,
        businessName: admin.businessName,
        email: admin.email,
        role: admin.role,
        token: generateToken(admin.id,admin.role)
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }

  } catch (error) { 
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
