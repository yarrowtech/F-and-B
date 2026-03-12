// import jwt from "jsonwebtoken";
// import mongoose from "mongoose";
// import Admin from "../models/Admin.model.js";
// import Employee from "../models/Employee.model.js";

// const auth = async (req, res, next) => {
//   try {
//     let token;

//     /* ===============================
//        READ TOKEN
//     =============================== */
//     if (
//       req.headers.authorization &&
//       req.headers.authorization.startsWith("Bearer ")
//     ) {
//       token = req.headers.authorization.split(" ")[1];
//     }

//     if (!token) {
//       return res.status(401).json({
//         success: false,
//         message: "Not authorized, no token",
//       });
//     }

//     /* ===============================
//        VERIFY TOKEN
//     =============================== */
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid token payload",
//       });
//     }

//     /* ===============================
//        ADMIN TOKEN
//     =============================== */
//     if (decoded.role === "admin") {
//       const admin = await Admin.findById(decoded.id).select("-password");

//       if (!admin) {
//         return res.status(401).json({
//           success: false,
//           message: "Admin not authorized",
//         });
//       }

//       req.user = {
//         id: admin._id.toString(),
//         role: "admin",
//       };
//     }

//     /* ===============================
//        EMPLOYEE TOKEN
//     =============================== */
//     else if (decoded.role) {
//       const employee = await Employee.findById(decoded.id);

//       if (!employee || employee.isActive === false) {
//         return res.status(401).json({
//           success: false,
//           message: "Employee not authorized",
//         });
//       }

//       req.user = {
//         id: employee._id.toString(),
//         role: employee.role.toLowerCase(),
//         employeeId: employee.employeeId,
//       };
//     }

//     /* ===============================
//        INVALID TOKEN
//     =============================== */
//     else {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid token",
//       });
//     }

//     next();
//   } catch (err) {
//     console.error("AUTH ERROR:", err.message);
//     return res.status(401).json({
//       success: false,
//       message: "Token invalid or expired",
//     });
//   }
// };

// export default auth;






import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Admin from "../models/Admin.model.js";
import Employee from "../models/Employee.model.js";

const auth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    /* ===== ADMIN ===== */
    if (decoded.role === "admin") {
      const admin = await Admin.findById(decoded.id).select("-password");

      if (!admin) {
        return res.status(401).json({
          success: false,
          message: "Admin not authorized",
        });
      }

      req.user = {
        id: admin._id.toString(),
        role: "admin",
        restaurant: admin.restaurant || null,
      };
    }

    /* ===== EMPLOYEE ===== */
    else if (decoded.role) {
      const employee = await Employee.findById(decoded.id);

      if (!employee || employee.isActive === false) {
        return res.status(401).json({
          success: false,
          message: "Employee not authorized",
        });
      }

      req.user = {
        id: employee._id.toString(),
        role: employee.role,
        employeeId: employee.employeeId,
        restaurant: employee.restaurant,
      };
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    next();
  } catch (err) {
    console.error("AUTH ERROR:", err.message);
    return res.status(401).json({
      success: false,
      message: "Token invalid or expired",
    });
  }
};

export default auth;
