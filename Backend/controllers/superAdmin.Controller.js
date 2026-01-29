const SuperAdmin = require("../models/SuperAdmin");
const generateToken = require("../utils/generateToken");
const bcrypt = require("bcryptjs");

// Ensure default super admin exists
const ensureSuperAdmin = async () => {
  let admin = await SuperAdmin.findOne({ email: "superadmin@fnb.com" });
  if (!admin) {
    admin = new SuperAdmin({
      email: "superadmin@fnb.com",
      password: "Super@123",
    });
    await admin.save();
    console.log("✅ Default Super Admin created: superadmin@fnb.com / Super@123");
  }
};

// Super Admin Login
exports.loginSuperAdmin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await SuperAdmin.findOne({ email });
    if (admin && (await admin.matchPassword(password))) {
      res.json({
        _id: admin._id,
        email: admin.email,
        token: generateToken(admin._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Forgot Password (reset directly for now)
exports.forgotPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  try {
    const admin = await SuperAdmin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Super Admin not found" });
    }

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    await admin.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports.ensureSuperAdmin = ensureSuperAdmin;

