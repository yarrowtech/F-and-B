
// import Employee from "../models/Employee.model.js";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";

// export const login = async (req, res, next) => {
//   try {
//     const { employeeId, password } = req.body;

//     if (!employeeId || !password) {
//       return res
//         .status(400)
//         .json({ message: "Employee ID and password required" });
//     }

//     const user = await Employee
//       .findOne({ employeeId, isActive: true })
//       .select("+password")
//       .populate("restaurant"); // 🔥 ADD THIS

//     if (!user || !user.password) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     if (!user.restaurant) {
//       return res.status(400).json({
//         message: "Employee not assigned to any restaurant",
//       });
//     }

//     const token = jwt.sign(
//       {
//         id: user._id.toString(),
//         role: user.role,
//         userType: "EMPLOYEE",
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "1d" }
//     );

//     res.json({
//       token,
//       user: {
//         id: user._id,
//         employeeId: user.employeeId,
//         name: user.name,
//         role: user.role,
//         restaurant: user.restaurant._id, // 🔥 ADD THIS
//       },
//     });
//   } catch (err) {
//     next(err);
//   }
// };









// 27.3 - add loggs

// import Employee from "../models/Employee.model.js";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";

// /* 🔥 LOGGER */
// import { logAction, logError } from "../utils/logger.js";

// export const login = async (req, res, next) => {
//   try {
//     const { employeeId, password } = req.body;

//     if (!employeeId || !password) {

//       await logAction({
//         action: "LOGIN_FAILED",
//         message: "Missing credentials",
//         meta: { employeeId },
//       });

//       return res
//         .status(400)
//         .json({ message: "Employee ID and password required" });
//     }

//     const user = await Employee
//       .findOne({ employeeId, isActive: true })
//       .select("+password")
//       .populate("restaurant");

//     if (!user || !user.password) {

//       await logAction({
//         action: "LOGIN_FAILED",
//         message: "User not found",
//         meta: { employeeId },
//       });

//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);

//     if (!isMatch) {

//       await logAction({
//         action: "LOGIN_FAILED",
//         userId: user._id,
//         role: user.role,
//         message: "Wrong password",
//       });

//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     if (!user.restaurant) {

//       await logAction({
//         action: "LOGIN_FAILED",
//         userId: user._id,
//         role: user.role,
//         message: "No restaurant assigned",
//       });

//       return res.status(400).json({
//         message: "Employee not assigned to any restaurant",
//       });
//     }

//     const token = jwt.sign(
//       {
//         id: user._id.toString(),
//         role: user.role,
//         userType: "EMPLOYEE",
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: "1d" }
//     );

//     /* ✅ SUCCESS LOG */
//     await logAction({
//       action: "LOGIN_SUCCESS",
//       userId: user._id,
//       role: user.role,
//       message: "User logged in",
//       meta: {
//         employeeId: user.employeeId,
//         restaurant: user.restaurant._id,
//       },
//     });

//     res.json({
//       token,
//       user: {
//         id: user._id,
//         employeeId: user.employeeId,
//         name: user.name,
//         role: user.role,
//         restaurant: user.restaurant._id,
//       },
//     });

//   } catch (err) {

//     /* ❌ ERROR LOG */
//     await logError(err, "LOGIN_CONTROLLER");

//     next(err);
//   }
// };








// 27.3 - secuirity improvements


import Employee from "../models/Employee.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  requestPasswordResetOtp,
  resetPasswordWithOtp,
} from "../utils/passwordReset.service.js";

/* 🔥 LOGGER */
import { logAction, logError } from "../utils/logger.js";

export const login = async (req, res, next) => {
  try {
    const { employeeId, password } = req.body;

    /* =========================
       VALIDATION
    ========================= */
    if (!employeeId || !password) {
      await logAction({
        action: "LOGIN_FAILED",
        message: "Missing credentials",
        meta: { employeeId },
      });

      return res.status(400).json({
        success: false,
        message: "Employee ID and password required",
      });
    }

    const user = await Employee
      .findOne({ employeeId, isActive: true })
      .select("+password")
      .populate("restaurant");

    /* =========================
       USER CHECK
    ========================= */
    if (!user || !user.password) {
      await logAction({
        action: "LOGIN_FAILED",
        message: "User not found",
        meta: { employeeId },
      });

      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    /* =========================
       ACCOUNT LOCK CHECK
    ========================= */
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(403).json({
        success: false,
        message: "Account locked. Try again later",
      });
    }

    /* =========================
       PASSWORD CHECK
    ========================= */
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;

      // lock after 5 attempts
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 15 * 60 * 1000; // 15 min
      }

      await user.save();

      await logAction({
        action: "LOGIN_FAILED",
        userId: user._id,
        role: user.role,
        message: "Wrong password",
      });

      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    /* =========================
       RESET ATTEMPTS
    ========================= */
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    /* =========================
       RESTAURANT CHECK
    ========================= */
    if (!user.restaurant) {
      await logAction({
        action: "LOGIN_FAILED",
        userId: user._id,
        role: user.role,
        message: "No restaurant assigned",
      });

      return res.status(400).json({
        success: false,
        message: "Employee not assigned to any restaurant",
      });
    }

    /* =========================
       TOKEN
    ========================= */
    const token = jwt.sign(
      {
        id: user._id.toString(),
        role: user.role,
        restaurantId: user.restaurant._id,
        userType: "EMPLOYEE",
      },
      process.env.JWT_SECRET,
      { expiresIn: "4d" }
    );

    /* =========================
       SUCCESS LOG
    ========================= */
    await logAction({
      action: "LOGIN_SUCCESS",
      userId: user._id,
      role: user.role,
      message: "User logged in",
      meta: {
        employeeId: user.employeeId,
        restaurant: user.restaurant._id,
      },
    });

    /* =========================
       RESPONSE (SAFE)
    ========================= */
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        employeeId: user.employeeId,
        name: user.name,
        role: user.role,
        restaurant: user.restaurant._id,
      },
    });

  } catch (err) {
    await logError(err, "LOGIN_CONTROLLER");
    next(err);
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const employeeId = String(req.body.employeeId || "").trim().toUpperCase();
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!employeeId || !email) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and email are required",
      });
    }

    const employee = await Employee.findOne({
      employeeId,
      email,
      isActive: true,
    }).select("_id name email role employeeId");

    if (!employee) {
      return res.status(404).json({
        success: false,
        message: "Employee account not found",
      });
    }

    await requestPasswordResetOtp({
      accountType: "employee",
      accountId: employee._id,
      email: employee.email,
      name: employee.name,
      roleLabel: employee.role
        ? String(employee.role).replace(/_/g, " ")
        : "Employee",
    });

    return res.json({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (err) {
    await logError(err, "EMPLOYEE_FORGOT_PASSWORD");
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const resetForgotPassword = async (req, res) => {
  try {
    const employeeId = String(req.body.employeeId || "").trim().toUpperCase();
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!employeeId || !email) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and email are required",
      });
    }

    await resetPasswordWithOtp({
      accountType: "employee",
      email,
      otp: req.body.otp,
      newPassword: req.body.newPassword,
      accountModel: Employee,
      accountQuery: {
        employeeId,
        email,
        isActive: true,
      },
    });

    return res.json({
      success: true,
      message: "Password reset successful. You can now login with the new password.",
    });
  } catch (err) {
    await logError(err, "EMPLOYEE_RESET_FORGOT_PASSWORD");
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};
