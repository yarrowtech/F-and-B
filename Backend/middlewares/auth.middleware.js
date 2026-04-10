import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Admin from "../models/Admin.model.js";
import Employee from "../models/Employee.model.js";
import SuperAdmin from "../models/superAdmin.js";

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
    const role = decoded.role?.toLowerCase();

    if (!decoded.id || !role) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
      return res.status(401).json({
        success: false,
        message: "Invalid token ID",
      });
    }

    if (role === "super_admin") {
      const superAdmin = await SuperAdmin.findById(decoded.id).select("-password");

      if (!superAdmin) {
        return res.status(401).json({
          success: false,
          message: "Super admin not authorized",
        });
      }

      req.user = {
        id: superAdmin._id.toString(),
        role: "super_admin",
        email: superAdmin.email,
      };

      return next();
    }

    if (role === "admin") {
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
    } else if (
      [
        "manager",
        "inventory_manager",
        "chef",
        "suchef",
        "waiter",
        "cleaner",
        "accountant",
      ].includes(role)
    ) {
      const employee = await Employee.findById(decoded.id).select("-password");

      if (!employee || employee.isActive === false) {
        return res.status(401).json({
          success: false,
          message: "Employee not authorized",
        });
      }

      req.user = {
        id: employee._id.toString(),
        role,
        employeeId: employee.employeeId,
        restaurant: employee.restaurant,
      };
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid role in token",
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
