
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
      { expiresIn: "1d" }
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