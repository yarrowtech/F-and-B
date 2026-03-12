

// // controllers/employee.controller.js
// import Employee from "../models/Employee.model.js";

// /* ===============================
//    CREATE EMPLOYEE
// =============================== */
// const createEmployee = async (req, res) => {
//   try {
//     const employee = await Employee.create(req.body);
//     res.status(201).json(employee);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };

// /* ===============================
//    GET ALL EMPLOYEES
// =============================== */
// const getEmployees = async (_req, res) => {
//   try {
//     const employees = await Employee.find({});
//     res.json(employees);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };

// /* ===============================
//    GET EMPLOYEE BY ID
// =============================== */
// const getEmployeeById = async (req, res) => {
//   try {
//     const employee = await Employee.findById(req.params.id);
//     if (!employee) {
//       return res.status(404).json({ message: "Employee not found" });
//     }
//     res.json(employee);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };

// /* ===============================
//    UPDATE EMPLOYEE
// =============================== */
// const updateEmployee = async (req, res) => {
//   try {
//     const employee = await Employee.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       { new: true }
//     );

//     if (!employee) {
//       return res.status(404).json({ message: "Employee not found" });
//     }

//     res.json(employee);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };

// /* ===============================
//    DELETE EMPLOYEE
// =============================== */
// const deleteEmployee = async (req, res) => {
//   try {
//     const employee = await Employee.findByIdAndDelete(req.params.id);
//     if (!employee) {
//       return res.status(404).json({ message: "Employee not found" });
//     }
//     res.json({ message: "Employee deleted successfully" });
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };

// /* ===============================
//    REMOVE EMPLOYEE FROM RESTAURANT
// =============================== */
// const removeEmployeeFromRestaurant = async (req, res) => {
//   try {
//     const employee = await Employee.findByIdAndUpdate(
//       req.params.id,
//       { restaurant: null },
//       { new: true }
//     );

//     if (!employee) {
//       return res.status(404).json({ message: "Employee not found" });
//     }

//     res.json({
//       success: true,
//       message: "Employee removed from restaurant",
//     });
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };


// /* ===============================
//    ✅ DEFAULT EXPORT (REQUIRED)
// =============================== */
// export default {
//   createEmployee,
//   getEmployees,
//   getEmployeeById,
//   updateEmployee,
//   deleteEmployee,
//   removeEmployeeFromRestaurant,
// };




// controllers/employee.controller.js

import bcrypt from "bcryptjs";
import Employee from "../models/Employee.model.js";
import Restaurant from "../models/Restaurant.model.js";

/* ===============================
   ROLE CODE MAP
=============================== */

const ROLE_CODES = {
  MANAGER: "MGR",
  INVENTORY_MANAGER: "INV",
  CHEF: "CHF",
  SUCHEF: "SCF",
  WAITER: "WTR",
  CLEANER: "CLN",
  ACCOUNTANT: "ACC",
};

/* ===============================
   CREATE EMPLOYEE
=============================== */

const createEmployee = async (req, res) => {
  try {

    const { password, restaurantId, role, ...rest } = req.body;

    if (!restaurantId) {
      return res.status(400).json({
        message: "Restaurant is required",
      });
    }

    /* Find restaurant */
    const restaurant = await Restaurant.findById(restaurantId);

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found",
      });
    }

    /* Generate role code */
    const roleCode = ROLE_CODES[role] || "EMP";

    /* Count employees in same restaurant + role */
    const count = await Employee.countDocuments({
      restaurant: restaurantId,
      role,
    });

    const sequence = String(count + 1).padStart(3, "0");

    const employeeId =
      `${restaurant.restaurantCode}-${roleCode}-${sequence}`;

    /* Hash password */
    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = await Employee.create({
      ...rest,
      role,
      employeeId,
      password: hashedPassword,
      createdBy: req.user.id,
      restaurant: restaurantId,
    });

    res.status(201).json(employee);

  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};

/* ===============================
   GET ALL EMPLOYEES
=============================== */

const getEmployees = async (req, res) => {
  try {

    const employees = await Employee.find({
      createdBy: req.user.id,
    }).populate("restaurant", "name restaurantCode");

    res.json(employees);

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

/* ===============================
   GET EMPLOYEE BY ID
=============================== */

const getEmployeeById = async (req, res) => {
  try {

    const employee = await Employee.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    }).populate("restaurant", "name restaurantCode");

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    res.json(employee);

  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};

/* ===============================
   UPDATE EMPLOYEE
=============================== */

const updateEmployee = async (req, res) => {
  try {

    const employee = await Employee.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user.id,
      },
      req.body,
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    res.json(employee);

  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};

/* ===============================
   DELETE EMPLOYEE
=============================== */

const deleteEmployee = async (req, res) => {
  try {

    const employee = await Employee.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    res.json({
      success: true,
      message: "Employee deleted successfully",
    });

  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};

/* ===============================
   REMOVE EMPLOYEE FROM RESTAURANT
=============================== */

const removeEmployeeFromRestaurant = async (req, res) => {
  try {

    const employee = await Employee.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user.id,
      },
      { restaurant: null },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    res.json({
      success: true,
      message: "Employee removed from restaurant"
    });

  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};

/* ===============================
   RESET EMPLOYEE PASSWORD
=============================== */

const resetEmployeePassword = async (req, res) => {
  try {

    const { newPassword } = req.body;

    const employee = await Employee.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    employee.password = hashedPassword;
    employee.mustChangePassword = true;

    await employee.save();

    res.json({
      success: true,
      message: "Password reset successfully",
    });

  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};

/* ===============================
   EXPORT
=============================== */

export default {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  removeEmployeeFromRestaurant,
  resetEmployeePassword,
};