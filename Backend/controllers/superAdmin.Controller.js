import crypto from "crypto";
import Admin from "../models/Admin.model.js";
import Employee from "../models/Employee.model.js";
import Log from "../models/Log.model.js";
import Restaurant from "../models/Restaurant.model.js";
import SuperAdmin from "../models/superAdmin.js";
import generateToken from "../utils/generateToken.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_POLICY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();

const validateEmail = (email) => EMAIL_REGEX.test(normalizeEmail(email));

const validateStrongPassword = (password = "") =>
  PASSWORD_POLICY_REGEX.test(String(password));

const normalizeAddress = (address) => {
  if (typeof address === "string") {
    return {
      line1: address.trim(),
      line2: "",
      landmark: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
    };
  }

  return {
    line1: String(address?.line1 || "").trim(),
    line2: String(address?.line2 || "").trim(),
    landmark: String(address?.landmark || "").trim(),
    city: String(address?.city || "").trim(),
    state: String(address?.state || "").trim(),
    pincode: String(address?.pincode || "").trim(),
    country: String(address?.country || "India").trim(),
  };
};

const hasRequiredAddress = (address) =>
  Boolean(address.line1 && address.city && address.state && address.pincode);

const getDuplicateKeyField = (error) =>
  error?.code === 11000 ? Object.keys(error.keyPattern || {})[0] : null;

const respondDuplicateKey = (res, error, fallbackMessage) => {
  const duplicateField = getDuplicateKeyField(error);

  if (!duplicateField) {
    return false;
  }

  const fieldLabels = {
    email: "Email already exists",
    adminId: "Admin ID already exists",
  };

  return res.status(409).json({
    success: false,
    message: fieldLabels[duplicateField] || fallbackMessage,
  });
};

const logSuperAdminAction = async ({ action, message, userId, meta = {} }) => {
  await Log.create({
    type: "ACTION",
    action,
    userId: userId || null,
    role: "super_admin",
    message,
    meta,
  });
};

/* ================= LOGIN ================= */
export const loginSuperAdmin = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const admin = await SuperAdmin.findOne({ email });

    if (!admin || !(await admin.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken({
      id: admin._id,
      role: "super_admin",
    });

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: admin._id,
        email: admin.email,
        role: "super_admin",
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= CREATE ANOTHER SUPER ADMIN ================= */
export const createSuperAdminBySuperAdmin = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address",
      });
    }

    if (!validateStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
      });
    }

    const existing = await SuperAdmin.findOne({ email });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Super Admin already exists",
      });
    }

    const newSuperAdmin = await SuperAdmin.create({
      email,
      password,
      role: "super_admin",
    });

    await logSuperAdminAction({
      action: "CREATED_SUPER_ADMIN",
      message: `Super Admin "${newSuperAdmin.email}" was created`,
      userId: req.user?.id,
      meta: {
        createdSuperAdminId: newSuperAdmin._id,
        email: newSuperAdmin.email,
      },
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
    if (respondDuplicateKey(res, error, "Super Admin already exists")) {
      return;
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= CREATE ADMIN ================= */
export const createAdminBySuperAdmin = async (req, res) => {
  try {
    const businessName = String(req.body.businessName || "").trim();
    const email = normalizeEmail(req.body.email);
    const mobile = String(req.body.mobile || "").trim();
    const address = normalizeAddress(req.body.address);
    const panNumber = String(req.body.panNumber || "").trim().toUpperCase();
    const password = String(req.body.password || "");

    if (!businessName || !email || !mobile || !hasRequiredAddress(address) || !panNumber || !password) {
      return res.status(400).json({
        success: false,
        message: "Business, contact, address, PAN, and password fields are required",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address",
      });
    }

    if (!validateStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
      });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: "Admin already exists",
      });
    }

    const prefix = businessName.replace(/\s+/g, "").substring(0, 4).toUpperCase();
    const samePrefix = await Admin.countDocuments({ adminId: new RegExp(`^${prefix}-`) });
    const adminId = `${prefix}-${String(samePrefix + 1).padStart(4, "0")}`;

    const admin = await Admin.create({
      adminId,
      businessName,
      email,
      mobile,
      address,
      panNumber,
      password,
      isActive: true,
    });

    await logSuperAdminAction({
      action: "CREATED_ADMIN",
      message: `Admin "${admin.businessName}" (${admin.email}) was created`,
      userId: req.user?.id,
      meta: {
        adminId: admin.adminId,
        businessName: admin.businessName,
        email: admin.email,
      },
    });

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      admin: {
        id: admin._id,
        adminId: admin.adminId,
        email: admin.email,
        businessName: admin.businessName,
        address: admin.address,
      },
    });
  } catch (error) {
    if (respondDuplicateKey(res, error, "Admin already exists")) {
      return;
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= GET ALL ADMINS ================= */
export const getAllAdmins = async (_req, res) => {
  try {
    const admins = await Admin.find({}).select("-password").sort({ createdAt: -1 });

    res.json({
      success: true,
      admins: admins.map((admin) => ({
        id: admin._id,
        adminId: admin.adminId,
        businessName: admin.businessName,
        email: admin.email,
        mobile: admin.mobile,
        address: admin.address,
        panNumber: admin.panNumber,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= DASHBOARD SUMMARY ================= */
export const getSuperAdminDashboardSummary = async (_req, res) => {
  try {
    const [totalAdmins, totalEmployees] = await Promise.all([
      Admin.countDocuments({}),
      Employee.countDocuments({}),
    ]);

    res.json({
      success: true,
      data: {
        totalAdmins,
        totalEmployees,
        totalUsersExcludingSuperadmin: totalAdmins + totalEmployees,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= ADMIN MANAGEMENT SUMMARY ================= */
export const getAdminManagementSummary = async (_req, res) => {
  try {
    const admins = await Admin.find({})
      .select("adminId businessName email mobile address panNumber isActive createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const adminIds = admins.map((admin) => admin._id);

    const [restaurantCounts, staffRoleCounts] = await Promise.all([
      Restaurant.aggregate([
        { $match: { admin: { $in: adminIds } } },
        {
          $group: {
            _id: "$admin",
            totalRestaurants: { $sum: 1 },
            restaurantNames: { $push: "$name" },
          },
        },
      ]),
      Employee.aggregate([
        { $match: { createdBy: { $in: adminIds } } },
        {
          $group: {
            _id: {
              admin: "$createdBy",
              role: "$role",
            },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const restaurantMap = Object.fromEntries(
      restaurantCounts.map((item) => [
        item._id.toString(),
        {
          totalRestaurants: item.totalRestaurants || 0,
          restaurantNames: item.restaurantNames || [],
        },
      ])
    );

    const staffMap = {};
    for (const item of staffRoleCounts) {
      const adminId = item._id.admin.toString();
      const role = item._id.role;

      if (!staffMap[adminId]) {
        staffMap[adminId] = {
          totalStaff: 0,
          staffByCategory: {},
        };
      }

      staffMap[adminId].totalStaff += item.count;
      staffMap[adminId].staffByCategory[role] = item.count;
    }

    res.json({
      success: true,
      data: admins.map((admin) => ({
        id: admin._id,
        adminId: admin.adminId,
        businessName: admin.businessName,
        email: admin.email,
        mobile: admin.mobile,
        address: admin.address,
        panNumber: admin.panNumber,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
        totalRestaurants: restaurantMap[admin._id.toString()]?.totalRestaurants || 0,
        restaurantNames: restaurantMap[admin._id.toString()]?.restaurantNames || [],
        totalStaff: staffMap[admin._id.toString()]?.totalStaff || 0,
        staffByCategory: staffMap[admin._id.toString()]?.staffByCategory || {},
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= DELETE ADMIN ================= */
export const deleteAdmin = async (req, res) => {
  try {
    const admin = await Admin.findByIdAndDelete(req.params.id);

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    await logSuperAdminAction({
      action: "DELETED_ADMIN",
      message: `Admin "${admin.businessName}" (${admin.email}) was deleted`,
      userId: req.user?.id,
      meta: {
        name: admin.businessName,
        email: admin.email,
        adminId: admin.adminId,
      },
    });

    res.json({ success: true, message: "Admin deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
      message: `Admin ${admin.isActive ? "activated" : "deactivated"} successfully`,
      isActive: admin.isActive,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= GET ALL SUPER ADMINS ================= */
export const getAllSuperAdmins = async (_req, res) => {
  try {
    const superAdmins = await SuperAdmin.find({})
      .select("-password -resetPasswordToken -resetPasswordExpire")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      superAdmins: superAdmins.map((sa) => ({
        id: sa._id,
        email: sa.email,
        role: sa.role,
        createdAt: sa.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= DELETE SUPER ADMIN ================= */
export const deleteSuperAdmin = async (req, res) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own account",
      });
    }

    const superAdmin = await SuperAdmin.findByIdAndDelete(req.params.id);

    if (!superAdmin) {
      return res.status(404).json({ success: false, message: "Super Admin not found" });
    }

    await logSuperAdminAction({
      action: "DELETED_SUPER_ADMIN",
      message: `Super Admin "${superAdmin.email}" was deleted`,
      userId: req.user?.id,
      meta: { email: superAdmin.email },
    });

    res.json({ success: true, message: "Super Admin deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= GET HISTORY ================= */
export const getHistory = async (_req, res) => {
  try {
    const logs = await Log.find({
      action: { $in: ["CREATED_ADMIN", "CREATED_SUPER_ADMIN", "DELETED_ADMIN", "DELETED_SUPER_ADMIN"] },
    })
      .sort({ createdAt: -1 })
      .limit(100);

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
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= CHANGE PASSWORD ================= */
export const changePassword = async (req, res) => {
  try {
    const oldPassword = String(req.body.oldPassword || "");
    const newPassword = String(req.body.newPassword || "");
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

    if (!validateStrongPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
      });
    }

    admin.password = newPassword;
    await admin.save();

    res.json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= UPDATE ADMIN DETAILS ================= */
export const updateAdmin = async (req, res) => {
  try {
    const { businessName, mobile, address } = req.body;
    const email = req.body.email ? normalizeEmail(req.body.email) : "";
    const panNumber = req.body.panNumber
      ? String(req.body.panNumber).trim().toUpperCase()
      : "";

    const admin = await Admin.findById(req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    if (email && !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address",
      });
    }

    if (businessName) admin.businessName = String(businessName).trim();
    if (email) admin.email = email;
    if (mobile) admin.mobile = String(mobile).trim();
    if (address !== undefined) {
      const nextAddress = normalizeAddress(address);
      if (!hasRequiredAddress(nextAddress)) {
        return res.status(400).json({
          success: false,
          message: "Address line 1, city, state, and PIN code are required",
        });
      }
      admin.address = nextAddress;
    }
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
    if (respondDuplicateKey(res, error, "Admin already exists")) {
      return;
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= RESET ADMIN PASSWORD (by Super Admin) ================= */
export const resetAdminPassword = async (req, res) => {
  try {
    const newPassword = String(req.body.newPassword || "");

    if (!validateStrongPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
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
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= FORGOT PASSWORD ================= */
export const forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const admin = email ? await SuperAdmin.findOne({ email }) : null;

    if (admin) {
      const resetToken = crypto.randomBytes(32).toString("hex");

      admin.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      admin.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
      await admin.save();

      const appBaseUrl = process.env.FRONTEND_URL || req.get("origin") || "";
      const resetUrl = `${appBaseUrl.replace(/\/$/, "")}/reset-password/${resetToken}`;

      await logSuperAdminAction({
        action: "SUPER_ADMIN_PASSWORD_RESET_REQUESTED",
        message: `Password reset requested for "${admin.email}"`,
        userId: admin._id,
        meta: { email: admin.email, resetUrl },
      });
    }

    res.json({
      success: true,
      message: "If the account exists, a reset link has been generated",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/* ================= RESET PASSWORD ================= */
export const resetPassword = async (req, res) => {
  try {
    const newPassword = String(req.body.password || "");

    if (!validateStrongPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
      });
    }

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

    admin.password = newPassword;
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpire = undefined;
    await admin.save();

    res.json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
