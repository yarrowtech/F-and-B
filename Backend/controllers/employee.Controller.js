// // controllers/employee.controller.js

// import bcrypt from "bcryptjs";
// import Employee from "../models/Employee.model.js";
// import Restaurant from "../models/Restaurant.model.js";

// /* ===============================
//    ROLE CODE MAP
// =============================== */

// const ROLE_CODES = {
//   MANAGER: "MGR",
//   INVENTORY_MANAGER: "INV",
//   CHEF: "CHF",
//   SUCHEF: "SCF",
//   WAITER: "WTR",
//   CLEANER: "CLN",
//   ACCOUNTANT: "ACC",
// };

// /* ===============================
//    CREATE EMPLOYEE
// =============================== */

// const createEmployee = async (req, res) => {
//   try {

//     const { password, restaurantId, role, ...rest } = req.body;

//     if (!restaurantId) {
//       return res.status(400).json({
//         message: "Restaurant is required",
//       });
//     }

//     /* Find restaurant */
//     const restaurant = await Restaurant.findById(restaurantId);

//     if (!restaurant) {
//       return res.status(404).json({
//         message: "Restaurant not found",
//       });
//     }

//     /* Generate role code */
//     const roleCode = ROLE_CODES[role] || "EMP";

//     /* Count employees in same restaurant + role */
//     const count = await Employee.countDocuments({
//       restaurant: restaurantId,
//       role,
//     });

//     const sequence = String(count + 1).padStart(3, "0");

//     const employeeId =
//       `${restaurant.restaurantCode}-${roleCode}-${sequence}`;

//     /* Hash password */
//     const hashedPassword = await bcrypt.hash(password, 10);

//     const employee = await Employee.create({
//       ...rest,
//       role,
//       employeeId,
//       password: hashedPassword,
//       createdBy: req.user.id,
//       restaurant: restaurantId,
//     });

//     res.status(201).json(employee);

//   } catch (err) {
//     res.status(400).json({
//       message: err.message
//     });
//   }
// };

// /* ===============================
//    GET ALL EMPLOYEES
// =============================== */

// const getEmployees = async (req, res) => {
//   try {

//     const employees = await Employee.find({
//       createdBy: req.user.id,
//     }).populate("restaurant", "name restaurantCode");

//     res.json(employees);

//   } catch (err) {
//     res.status(500).json({
//       message: err.message
//     });
//   }
// };

// /* ===============================
//    GET EMPLOYEE BY ID
// =============================== */

// const getEmployeeById = async (req, res) => {
//   try {

//     const employee = await Employee.findOne({
//       _id: req.params.id,
//       createdBy: req.user.id,
//     }).populate("restaurant", "name restaurantCode");

//     if (!employee) {
//       return res.status(404).json({
//         message: "Employee not found"
//       });
//     }

//     res.json(employee);

//   } catch (err) {
//     res.status(400).json({
//       message: err.message
//     });
//   }
// };

// /* ===============================
//    UPDATE EMPLOYEE
// =============================== */

// const updateEmployee = async (req, res) => {
//   try {

//     const employee = await Employee.findOneAndUpdate(
//       {
//         _id: req.params.id,
//         createdBy: req.user.id,
//       },
//       req.body,
//       { new: true }
//     );

//     if (!employee) {
//       return res.status(404).json({
//         message: "Employee not found"
//       });
//     }

//     res.json(employee);

//   } catch (err) {
//     res.status(400).json({
//       message: err.message
//     });
//   }
// };

// /* ===============================
//    DELETE EMPLOYEE
// =============================== */

// const deleteEmployee = async (req, res) => {
//   try {

//     const employee = await Employee.findOneAndDelete({
//       _id: req.params.id,
//       createdBy: req.user.id,
//     });

//     if (!employee) {
//       return res.status(404).json({
//         message: "Employee not found"
//       });
//     }

//     res.json({
//       success: true,
//       message: "Employee deleted successfully",
//     });

//   } catch (err) {
//     res.status(400).json({
//       message: err.message
//     });
//   }
// };

// /* ===============================
//    REMOVE EMPLOYEE FROM RESTAURANT
// =============================== */

// const removeEmployeeFromRestaurant = async (req, res) => {
//   try {

//     const employee = await Employee.findOneAndUpdate(
//       {
//         _id: req.params.id,
//         createdBy: req.user.id,
//       },
//       { restaurant: null },
//       { new: true }
//     );

//     if (!employee) {
//       return res.status(404).json({
//         message: "Employee not found"
//       });
//     }

//     res.json({
//       success: true,
//       message: "Employee removed from restaurant"
//     });

//   } catch (err) {
//     res.status(400).json({
//       message: err.message
//     });
//   }
// };

// /* ===============================
//    RESET EMPLOYEE PASSWORD
// =============================== */

// const resetEmployeePassword = async (req, res) => {
//   try {

//     const { newPassword } = req.body;

//     const employee = await Employee.findOne({
//       _id: req.params.id,
//       createdBy: req.user.id,
//     });

//     if (!employee) {
//       return res.status(404).json({
//         message: "Employee not found"
//       });
//     }

//     const hashedPassword = await bcrypt.hash(newPassword, 10);

//     employee.password = hashedPassword;
//     employee.mustChangePassword = true;

//     await employee.save();

//     res.json({
//       success: true,
//       message: "Password reset successfully",
//     });

//   } catch (err) {
//     res.status(400).json({
//       message: err.message
//     });
//   }
// };

// /* ===============================
//    GET MY PROFILE (EMPLOYEE)
// =============================== */

// const getMyProfile = async (req, res) => {
//   try {
//     const employee = await Employee.findById(req.user.id)
//       .populate("restaurant", "name");

//     if (!employee) {
//       return res.status(404).json({
//         message: "Employee not found",
//       });
//     }

//     // ✅ Send only required fields
//     const profile = {
//       employeeId: employee.employeeId,
//       name: employee.name,
//       email: employee.email,
//       phone: employee.phone,
//       restaurantName: employee.restaurant?.name,
//     };

//     res.json(profile);

//   } catch (err) {
//     res.status(500).json({
//       message: err.message,
//     });
//   }
// };

// /* ===============================
//    EXPORT
// =============================== */

// export default {
//   createEmployee,
//   getEmployees,
//   getEmployeeById,
//   updateEmployee,
//   deleteEmployee,
//   removeEmployeeFromRestaurant,
//   resetEmployeePassword,
//   getMyProfile,
// };



















//27.3 - add loggs


// import bcrypt from "bcryptjs";
// import Employee from "../models/Employee.model.js";
// import Restaurant from "../models/Restaurant.model.js";

// /* 🔥 LOGGER */
// import { logAction, logError } from "../utils/logger.js";

// /* ===============================
//    ROLE CODE MAP
// =============================== */

// const ROLE_CODES = {
//   MANAGER: "MGR",
//   INVENTORY_MANAGER: "INV",
//   CHEF: "CHF",
//   SUCHEF: "SCF",
//   WAITER: "WTR",
//   CLEANER: "CLN",
//   ACCOUNTANT: "ACC",
// };

// /* ===============================
//    CREATE EMPLOYEE
// =============================== */

// const createEmployee = async (req, res) => {
//   try {

//     const { password, restaurantId, role, ...rest } = req.body;

//     if (!restaurantId) {
//       await logAction({
//         action: "EMPLOYEE_CREATE_FAILED",
//         userId: req.user.id,
//         message: "Restaurant is required",
//       });

//       return res.status(400).json({
//         message: "Restaurant is required",
//       });
//     }

//     const restaurant = await Restaurant.findById(restaurantId);

//     if (!restaurant) {
//       await logAction({
//         action: "EMPLOYEE_CREATE_FAILED",
//         userId: req.user.id,
//         message: "Restaurant not found",
//       });

//       return res.status(404).json({
//         message: "Restaurant not found",
//       });
//     }

//     const roleCode = ROLE_CODES[role] || "EMP";

//     const count = await Employee.countDocuments({
//       restaurant: restaurantId,
//       role,
//     });

//     const sequence = String(count + 1).padStart(3, "0");

//     const employeeId =
//       `${restaurant.restaurantCode}-${roleCode}-${sequence}`;

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const employee = await Employee.create({
//       ...rest,
//       role,
//       employeeId,
//       password: hashedPassword,
//       createdBy: req.user.id,
//       restaurant: restaurantId,
//     });

//     await logAction({
//       action: "EMPLOYEE_CREATED",
//       userId: req.user.id,
//       meta: { employeeId: employee._id },
//     });

//     res.status(201).json(employee);

//   } catch (err) {
//     await logError(err, "CREATE_EMPLOYEE");
//     res.status(400).json({
//       message: err.message
//     });
//   }
// };

// /* ===============================
//    GET ALL EMPLOYEES
// =============================== */

// const getEmployees = async (req, res) => {
//   try {

//     const employees = await Employee.find({
//       createdBy: req.user.id,
//     }).populate("restaurant", "name restaurantCode");

//     res.json(employees);

//   } catch (err) {
//     await logError(err, "GET_EMPLOYEES");
//     res.status(500).json({
//       message: err.message
//     });
//   }
// };

// /* ===============================
//    GET EMPLOYEE BY ID
// =============================== */

// const getEmployeeById = async (req, res) => {
//   try {

//     const employee = await Employee.findOne({
//       _id: req.params.id,
//       createdBy: req.user.id,
//     }).populate("restaurant", "name restaurantCode");

//     if (!employee) {
//       await logAction({
//         action: "EMPLOYEE_FETCH_FAILED",
//         userId: req.user.id,
//         message: "Employee not found",
//       });

//       return res.status(404).json({
//         message: "Employee not found"
//       });
//     }

//     res.json(employee);

//   } catch (err) {
//     await logError(err, "GET_EMPLOYEE_BY_ID");
//     res.status(400).json({
//       message: err.message
//     });
//   }
// };

// /* ===============================
//    UPDATE EMPLOYEE
// =============================== */

// const updateEmployee = async (req, res) => {
//   try {

//     const employee = await Employee.findOneAndUpdate(
//       {
//         _id: req.params.id,
//         createdBy: req.user.id,
//       },
//       req.body,
//       { new: true }
//     );

//     if (!employee) {
//       return res.status(404).json({
//         message: "Employee not found"
//       });
//     }

//     await logAction({
//       action: "EMPLOYEE_UPDATED",
//       userId: req.user.id,
//       meta: { employeeId: employee._id },
//     });

//     res.json(employee);

//   } catch (err) {
//     await logError(err, "UPDATE_EMPLOYEE");
//     res.status(400).json({
//       message: err.message
//     });
//   }
// };

// /* ===============================
//    DELETE EMPLOYEE
// =============================== */

// const deleteEmployee = async (req, res) => {
//   try {

//     const employee = await Employee.findOneAndDelete({
//       _id: req.params.id,
//       createdBy: req.user.id,
//     });

//     if (!employee) {
//       return res.status(404).json({
//         message: "Employee not found"
//       });
//     }

//     await logAction({
//       action: "EMPLOYEE_DELETED",
//       userId: req.user.id,
//       meta: { employeeId: employee._id },
//     });

//     res.json({
//       success: true,
//       message: "Employee deleted successfully",
//     });

//   } catch (err) {
//     await logError(err, "DELETE_EMPLOYEE");
//     res.status(400).json({
//       message: err.message
//     });
//   }
// };

// /* ===============================
//    REMOVE EMPLOYEE FROM RESTAURANT
// =============================== */

// const removeEmployeeFromRestaurant = async (req, res) => {
//   try {

//     const employee = await Employee.findOneAndUpdate(
//       {
//         _id: req.params.id,
//         createdBy: req.user.id,
//       },
//       { restaurant: null },
//       { new: true }
//     );

//     if (!employee) {
//       return res.status(404).json({
//         message: "Employee not found"
//       });
//     }

//     await logAction({
//       action: "EMPLOYEE_REMOVED_FROM_RESTAURANT",
//       userId: req.user.id,
//       meta: { employeeId: employee._id },
//     });

//     res.json({
//       success: true,
//       message: "Employee removed from restaurant"
//     });

//   } catch (err) {
//     await logError(err, "REMOVE_EMPLOYEE");
//     res.status(400).json({
//       message: err.message
//     });
//   }
// };

// /* ===============================
//    RESET EMPLOYEE PASSWORD
// =============================== */

// const resetEmployeePassword = async (req, res) => {
//   try {

//     const { newPassword } = req.body;

//     const employee = await Employee.findOne({
//       _id: req.params.id,
//       createdBy: req.user.id,
//     });

//     if (!employee) {
//       return res.status(404).json({
//         message: "Employee not found"
//       });
//     }

//     const hashedPassword = await bcrypt.hash(newPassword, 10);

//     employee.password = hashedPassword;
//     employee.mustChangePassword = true;

//     await employee.save();

//     await logAction({
//       action: "EMPLOYEE_PASSWORD_RESET",
//       userId: req.user.id,
//       meta: { employeeId: employee._id },
//     });

//     res.json({
//       success: true,
//       message: "Password reset successfully",
//     });

//   } catch (err) {
//     await logError(err, "RESET_PASSWORD");
//     res.status(400).json({
//       message: err.message
//     });
//   }
// };

// /* ===============================
//    GET MY PROFILE (EMPLOYEE)
// =============================== */

// const getMyProfile = async (req, res) => {
//   try {
//     const employee = await Employee.findById(req.user.id)
//       .populate("restaurant", "name");

//     if (!employee) {
//       return res.status(404).json({
//         message: "Employee not found",
//       });
//     }

//     const profile = {
//       employeeId: employee.employeeId,
//       name: employee.name,
//       email: employee.email,
//       phone: employee.phone,
//       restaurantName: employee.restaurant?.name,
//     };

//     res.json(profile);

//   } catch (err) {
//     await logError(err, "GET_PROFILE");
//     res.status(500).json({
//       message: err.message,
//     });
//   }
// };

// /* ===============================
//    EXPORT
// =============================== */

// export default {
//   createEmployee,
//   getEmployees,
//   getEmployeeById,
//   updateEmployee,
//   deleteEmployee,
//   removeEmployeeFromRestaurant,
//   resetEmployeePassword,
//   getMyProfile,
// };








// 27.3 - secuirity 


import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Employee from "../models/Employee.model.js";
import Restaurant from "../models/Restaurant.model.js";
import Log from "../models/Log.model.js";
import Order from "../models/Order.model.js";
import Bill from "../models/Bill.model.js";

/* 🔥 LOGGER */
import { logAction, logError } from "../utils/logger.js";

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

    // 🔐 Role check
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admin can create employees",
      });
    }

    if (!restaurantId) {
      await logAction({
        action: "EMPLOYEE_CREATE_FAILED",
        userId: req.user.id,
        message: "Restaurant is required",
      });

      return res.status(400).json({
        message: "Restaurant is required",
      });
    }

    // 🔐 Ownership check
    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      admin: req.user.id,
    });

    if (!restaurant) {
      await logAction({
        action: "EMPLOYEE_CREATE_FAILED",
        userId: req.user.id,
        message: "Restaurant not found or unauthorized",
      });

      return res.status(404).json({
        message: "Restaurant not found",
      });
    }

    const roleCode = ROLE_CODES[role] || "EMP";

    const count = await Employee.countDocuments({
      restaurant: restaurantId,
      role,
    });

    const sequence = String(count + 1).padStart(3, "0");

    const employeeId =
      `${restaurant.restaurantCode}-${roleCode}-${sequence}`;

    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = await Employee.create({
      ...rest,
      role,
      employeeId,
      password: hashedPassword,
      createdBy: req.user.id,
      restaurant: restaurantId,
    });

    await logAction({
      action: "EMPLOYEE_CREATED",
      userId: req.user.id,
      meta: { employeeId: employee._id },
    });

    // 🔐 Safe response
    res.status(201).json({
      id: employee._id,
      name: employee.name,
      role: employee.role,
      employeeId: employee.employeeId,
      restaurant: employee.restaurant,
      phone: employee.phone,
      email: employee.email,
      address: employee.address,
    });

  } catch (err) {
    await logError(err, "CREATE_EMPLOYEE");
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

    // 🔐 Safe response
    const safeEmployees = employees.map(emp => ({
      id: emp._id,
      name: emp.name,
      role: emp.role,
      employeeId: emp.employeeId,
      restaurant: emp.restaurant,
      address: emp.address,
      phone: emp.phone,     // ✅ ADD THIS
      email: emp.email,     // ✅ ADD THI
    }));

    res.json(safeEmployees);

  } catch (err) {
    await logError(err, "GET_EMPLOYEES");
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
      await logAction({
        action: "EMPLOYEE_FETCH_FAILED",
        userId: req.user.id,
        message: "Employee not found",
      });

      return res.status(404).json({
        message: "Employee not found"
      });
    }

    res.json({
      id: employee._id,
      name: employee.name,
      role: employee.role,
      employeeId: employee.employeeId,
      restaurant: employee.restaurant,
      phone: employee.phone,
      email: employee.email,
      address: employee.address,
    });

  } catch (err) {
    await logError(err, "GET_EMPLOYEE_BY_ID");
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
    // 🔐 Role check
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admin can update employees",
      });
    }

    // 🔐 Whitelist updates
    const allowedUpdates = ["name", "email", "phone", "role", "address"];
    const updates = {};

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Admin can also move the employee to another restaurant (optional)
    if (req.body.restaurantId !== undefined) {
      const restaurant = await Restaurant.findOne({
        _id: req.body.restaurantId,
        admin: req.user.id,
      });

      if (!restaurant) {
        return res.status(404).json({
          message: "Restaurant not found",
        });
      }

      updates.restaurant = req.body.restaurantId;
    }

    const employee = await Employee.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user.id,
      },
      updates,
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    await logAction({
      action: "EMPLOYEE_UPDATED",
      userId: req.user.id,
      meta: { employeeId: employee._id },
    });

    res.json({
      id: employee._id,
      name: employee.name,
      role: employee.role,
      employeeId: employee.employeeId,
      phone: employee.phone,
      email: employee.email,
      restaurant: employee.restaurant,
      address: employee.address,
    });

  } catch (err) {
    await logError(err, "UPDATE_EMPLOYEE");
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
    // 🔐 Role check
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admin can delete employees",
      });
    }

    const employee = await Employee.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    await logAction({
      action: "EMPLOYEE_DELETED",
      userId: req.user.id,
      message: `Employee "${employee.name}" (${employee.employeeId}) was deleted`,
      meta: {
        adminId: req.user.id,
        employeeDbId: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        role: employee.role,
        restaurant: employee.restaurant,
      },
    });

    res.json({
      success: true,
      message: "Employee deleted successfully",
    });

  } catch (err) {
    await logError(err, "DELETE_EMPLOYEE");
    res.status(400).json({
      message: err.message
    });
  }
};

/* ===============================
   EMPLOYEE DELETE HISTORY (ADMIN)
=============================== */
const getDeletedEmployeesHistory = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admin can view history",
      });
    }

    const logs = await Log.find({
      type: "ACTION",
      action: "EMPLOYEE_DELETED",
      $or: [{ userId: req.user.id }, { "meta.adminId": req.user.id }],
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
  } catch (err) {
    await logError(err, "GET_EMPLOYEE_DELETE_HISTORY");
    res.status(500).json({
      message: err.message,
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

    await logAction({
      action: "EMPLOYEE_REMOVED_FROM_RESTAURANT",
      userId: req.user.id,
      meta: { employeeId: employee._id },
    });

    res.json({
      success: true,
      message: "Employee removed from restaurant"
    });

  } catch (err) {
    await logError(err, "REMOVE_EMPLOYEE");
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
    // 🔐 Role check
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only admin can reset password",
      });
    }

    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

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

    await logAction({
      action: "EMPLOYEE_PASSWORD_RESET",
      userId: req.user.id,
      meta: { employeeId: employee._id },
    });

    res.json({
      success: true,
      message: "Password reset successfully",
    });

  } catch (err) {
    await logError(err, "RESET_PASSWORD");
    res.status(400).json({
      message: err.message
    });
  }
};

/* ===============================
   GET MY PROFILE (EMPLOYEE)
=============================== */

const getMyProfile = async (req, res) => {
  try {
    const employee = await Employee.findById(req.user.id)
      .populate("restaurant", "name");

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    const profile = {
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      restaurantName: employee.restaurant?.name,
    };

    res.json(profile);

  } catch (err) {
    await logError(err, "GET_PROFILE");
    res.status(500).json({
      message: err.message,
    });
  }
};

/* ===============================
   GET RESTAURANT EMPLOYEES (MANAGER)
=============================== */

const getRestaurantEmployees = async (req, res) => {
  try {
    const restaurantId = req.user.restaurant;
    if (!restaurantId) {
      return res.status(400).json({ message: "No restaurant assigned to this manager" });
    }

    const employees = await Employee.find({ restaurant: restaurantId })
      .select("name role employeeId phone email")
      .lean();

    res.json({ success: true, data: employees });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===============================
   STAFF WORK REPORT (MANAGER)
=============================== */

const getStaffWorkReport = async (req, res) => {
  try {
    const restaurantId = req.user.restaurant?.toString?.() || req.user.restaurant;
    if (!restaurantId) {
      return res.status(400).json({ message: "No restaurant assigned" });
    }

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({ message: "Invalid restaurant assigned" });
    }

    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate + "T00:00:00");
    if (endDate)   dateFilter.$lte = new Date(endDate   + "T23:59:59");

    const orderMatch = {
      restaurant: new mongoose.Types.ObjectId(restaurantId),
      ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
    };

    const employees = await Employee.find({ restaurant: restaurantId })
      .select("name role employeeId")
      .lean();

    const billMatch = {
      restaurant: new mongoose.Types.ObjectId(restaurantId),
      accountant: { $ne: null },
      ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}),
    };

    const [waiterStats, chefStats, accountantStats] = await Promise.all([
      Order.aggregate([
        { $match: orderMatch },
        { $group: { _id: "$waiter", ordersTaken: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { ...orderMatch, chef: { $ne: null } } },
        { $group: { _id: "$chef", ordersPrepared: { $sum: 1 } } },
      ]),
      Bill.aggregate([
        { $match: billMatch },
        { $group: { _id: "$accountant", billsGenerated: { $sum: 1 } } },
      ]),
    ]);

    const waiterMap  = Object.fromEntries(waiterStats.map(x => [x._id.toString(), x.ordersTaken]));
    const chefMap    = Object.fromEntries(chefStats.map(x  => [x._id.toString(), x.ordersPrepared]));
    const accountantMap = Object.fromEntries(
      accountantStats.map((x) => [x._id.toString(), x.billsGenerated])
    );

    const data = employees.map((emp) => {
      const id = emp._id.toString();
      return {
        _id:           emp._id,
        name:          emp.name,
        role:          String(emp.role || "").toLowerCase(),
        employeeId:    emp.employeeId,
        ordersTaken:   waiterMap[id]  || 0,
        ordersPrepared: chefMap[id]   || 0,
        billsGenerated: accountantMap[id] || 0,
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
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
  getDeletedEmployeesHistory,
  getMyProfile,
  getRestaurantEmployees,
  getStaffWorkReport,
};
