// const SuperAdmin = require("../models/SuperAdmin");
// const generateToken = require("../utils/generateToken");
// const bcrypt = require("bcryptjs");

// // Ensure default super admin exists
// const ensureSuperAdmin = async () => {
//   let admin = await SuperAdmin.findOne({ email: "superadmin@fnb.com" });
//   if (!admin) {
//     admin = new SuperAdmin({
//       email: "superadmin@fnb.com",
//       password: "Super@123",
//     });
//     await admin.save();
//     console.log("✅ Default Super Admin created: superadmin@fnb.com / Super@123");
//   }
// };

// // Super Admin Login
// exports.loginSuperAdmin = async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     const admin = await SuperAdmin.findOne({ email });
//     if (admin && (await admin.matchPassword(password))) {
//       res.json({
//         _id: admin._id,
//         email: admin.email,
//         token: generateToken(admin._id),
//       });
//     } else {
//       res.status(401).json({ message: "Invalid email or password" });
//     }
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Forgot Password (reset directly for now)
// exports.forgotPassword = async (req, res) => {
//   const { email, newPassword } = req.body;

//   try {
//     const admin = await SuperAdmin.findOne({ email });
//     if (!admin) {
//       return res.status(404).json({ message: "Super Admin not found" });
//     }

//     const salt = await bcrypt.genSalt(10);
//     admin.password = await bcrypt.hash(newPassword, salt);
//     await admin.save();

//     res.json({ message: "Password reset successful" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// module.exports.ensureSuperAdmin = ensureSuperAdmin;








import SuperAdmin from "../models/superAdmin.js";
import Admin from "../models/Admin.model.js";
import Log from "../models/Log.model.js";
import generateToken from "../utils/generateToken.js";
import crypto from "crypto";

/* ================= LOGIN ================= */
export const loginSuperAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await SuperAdmin.findOne({ email });

    if (!admin || !(await admin.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // ✅ FIXED TOKEN (only change)
    const token = generateToken({
      id: admin._id, // 🔥 FIXED (_id → id)
      role: "super_admin", // 🔥 FIXED (consistent role)
    });

    res.json({
      success: true,
      message: "Login successful",
      token, // ✅ FIX: move token outside
      user: {
        id: admin._id,
        email: admin.email,
        role: "super_admin",
      },
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= CREATE ANOTHER SUPER ADMIN ================= */
export const createSuperAdminBySuperAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    const existing = await SuperAdmin.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: "Super Admin already exists" });
    }

    const newSuperAdmin = await SuperAdmin.create({
      email: email.toLowerCase().trim(),
      password,
      role: "super_admin",
    });

    res.status(201).json({
      success: true,
      message: "Super Admin created successfully",
      user: {
        id: newSuperAdmin._id,
        email: newSuperAdmin.email,
        role: newSuperAdmin.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= CREATE ADMIN ================= */
export const createAdminBySuperAdmin = async (req, res) => {
  try {
    const { businessName, email, mobile, address, panNumber, password } = req.body;

    if (!businessName || !email || !mobile || !address || !panNumber || !password) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
    }

    const existingAdmin = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (existingAdmin) {
      return res.status(400).json({ success: false, message: "Admin already exists" });
    }

    // Generate adminId from business name: e.g. "New Empire" → NEMP-0001
    const prefix = businessName.replace(/\s+/g, "").substring(0, 4).toUpperCase();
    const samePrefix = await Admin.countDocuments({ adminId: new RegExp(`^${prefix}-`) });
    const adminId = `${prefix}-${String(samePrefix + 1).padStart(4, "0")}`;

    const admin = await Admin.create({
      adminId,
      businessName,
      email: email.toLowerCase().trim(),
      mobile,
      address,
      panNumber,
      password,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      admin: {
        id: admin._id,
        adminId: admin.adminId,
        email: admin.email,
        businessName: admin.businessName,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= GET ALL ADMINS ================= */
export const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find({})
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      admins: admins.map(admin => ({
        id: admin._id,
        adminId: admin.adminId,
        businessName: admin.businessName,
        email: admin.email,
        mobile: admin.mobile,
        address: admin.address,
        panNumber: admin.panNumber,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= DELETE ADMIN ================= */
export const deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndDelete(req.params.id);

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    await Log.create({
      type: "ACTION",
      action: "DELETED_ADMIN",
      role: "super_admin",
      message: `Admin "${admin.businessName}" (${admin.email}) was deleted`,
      meta: {
        name: admin.businessName,
        email: admin.email,
        adminId: admin.adminId,
      },
    });

    res.json({ success: true, message: "Admin deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= TOGGLE ADMIN STATUS ================= */
export const toggleAdminStatus = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    admin.isActive = !admin.isActive;
    await admin.save();

    res.json({
      success: true,
      message: `Admin ${admin.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: admin.isActive
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= GET ALL SUPER ADMINS ================= */
export const getAllSuperAdmins = async (req, res) => {
  try {
    const superAdmins = await SuperAdmin.find({})
      .select("-password -resetPasswordToken -resetPasswordExpire")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      superAdmins: superAdmins.map(sa => ({
        id: sa._id,
        email: sa.email,
        role: sa.role,
        createdAt: sa.createdAt,
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= DELETE SUPER ADMIN ================= */
export const deleteSuperAdmin = async (req, res) => {
  try {
    // Prevent deleting the current super admin
    if (req.params.id === req.user.id) {
      return res.status(400).json({ success: false, message: "Cannot delete your own account" });
    }

    const superAdmin = await SuperAdmin.findByIdAndDelete(req.params.id);

    if (!superAdmin) {
      return res.status(404).json({ success: false, message: "Super Admin not found" });
    }

    await Log.create({
      type: "ACTION",
      action: "DELETED_SUPER_ADMIN",
      role: "super_admin",
      message: `Super Admin "${superAdmin.email}" was deleted`,
      meta: { email: superAdmin.email },
    });

    res.json({ success: true, message: "Super Admin deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= GET HISTORY ================= */
export const getHistory = async (req, res) => {
  try {
    const logs = await Log.find({
      action: { $in: ["DELETED_ADMIN", "DELETED_SUPER_ADMIN"] },
    }).sort({ createdAt: -1 }).limit(100);

    res.json({
      success: true,
      history: logs.map((l) => ({
        id: l._id,
        action: l.action,
        message: l.message,
        meta: l.meta,
        createdAt: l.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= CHANGE PASSWORD ================= */
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const admin = await SuperAdmin.findById(req.user.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Super Admin not found",
      });
    }

    const isMatch = await admin.matchPassword(oldPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Old password is incorrect",
      });
    }

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    admin.password = newPassword;
    await admin.save();

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= UPDATE ADMIN DETAILS ================= */
export const updateAdmin = async (req, res) => {
  try {
    const { businessName, email, mobile, address, panNumber } = req.body;

    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    if (businessName) admin.businessName = businessName;
    if (email) admin.email = email.toLowerCase().trim();
    if (mobile) admin.mobile = mobile;
    if (address) admin.address = address;
    if (panNumber) admin.panNumber = panNumber;

    await admin.save();

    res.json({
      success: true,
      message: "Admin updated successfully",
      admin: {
        id: admin._id,
        businessName: admin.businessName,
        email: admin.email,
        mobile: admin.mobile,
        address: admin.address,
        panNumber: admin.panNumber,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= RESET ADMIN PASSWORD (by Super Admin) ================= */
export const resetAdminPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const admin = await Admin.findById(req.params.id);

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    admin.password = newPassword;
    await admin.save();

    res.json({ success: true, message: "Admin password reset successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= FORGOT PASSWORD ================= */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const admin = await SuperAdmin.findOne({ email });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Super Admin not found",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    admin.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    admin.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await admin.save();

    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    console.log("🔗 Reset URL:", resetUrl);

    res.json({
      success: true,
      message: "Reset link generated",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ================= RESET PASSWORD ================= */
export const resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const admin = await SuperAdmin.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    admin.password = req.body.password;
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpire = undefined;

    await admin.save();

    res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};