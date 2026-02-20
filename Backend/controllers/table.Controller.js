// import Table from "../models/Table.model.js";

// /* ===============================
//    CREATE TABLE
// =============================== */
// const createTable = async (req, res) => {
//   try {
//     const { tableNumber, capacity, status } = req.body;

//     // Debug logging
//     console.log("CREATE TABLE REQUEST:", {
//       body: req.body,
//       user: req.user,
//     });

//     // Validate input
//     if (!tableNumber || !capacity) {
//       return res.status(400).json({
//         success: false,
//         message: "Table number and capacity are required",
//       });
//     }

//     if (!req.user) {
//       return res.status(401).json({
//         success: false,
//         message: "User not authenticated",
//       });
//     }

//     const table = await Table.create({
//       tableNumber: Number(tableNumber),
//       capacity: Number(capacity),
//       status: status || "available",

//       createdBy: req.user.id,
//       createdByModel:
//         req.user.userType === "ADMIN" ? "Admin" : "Employee",
//     });

//     res.status(201).json({
//       success: true,
//       message: "Table created successfully",
//       data: table,
//     });
//   } catch (err) {
//     console.error("CREATE TABLE ERROR DETAILS:", {
//       message: err.message,
//       code: err.code,
//       name: err.name,
//       stack: err.stack,
//     });

//     if (err.code === 11000) {
//       return res.status(400).json({
//         success: false,
//         message: "Table number already exists",
//       });
//     }

//     // Mongoose validation error
//     if (err.name === "ValidationError") {
//       const messages = Object.values(err.errors)
//         .map((e) => e.message)
//         .join(", ");
//       return res.status(400).json({
//         success: false,
//         message: `Validation error: ${messages}`,
//       });
//     }

//     res.status(500).json({
//       success: false,
//       message: err.message || "Failed to create table",
//     });
//   }
// };

// /* ===============================
//    GET ALL TABLES
// =============================== */
// const getTables = async (_req, res) => {
//   try {
//     const tables = await Table.find({})
//       .sort({ createdAt: -1 })
//       .populate("createdBy", "name email");

//     res.json({
//       success: true,
//       data: tables,
//     });
//   } catch (err) {
//     console.error("GET TABLES ERROR:", err);
//     res.status(400).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };

// /* ===============================
//    GET TABLE BY ID
// =============================== */
// const getTableById = async (req, res) => {
//   try {
//     const table = await Table.findById(req.params.id).populate(
//       "createdBy",
//       "name email"
//     );

//     if (!table) {
//       return res.status(404).json({
//         success: false,
//         message: "Table not found",
//       });
//     }

//     res.json({
//       success: true,
//       data: table,
//     });
//   } catch (err) {
//     res.status(400).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };

// /* ===============================
//    UPDATE TABLE STATUS
// =============================== */
// const updateTableStatus = async (req, res) => {
//   try {
//     const { status } = req.body;

//     if (!["available", "occupied", "reserved"].includes(status)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid table status",
//       });
//     }

//     const table = await Table.findByIdAndUpdate(
//       req.params.id,
//       { status },
//       { new: true }
//     );

//     if (!table) {
//       return res.status(404).json({
//         success: false,
//         message: "Table not found",
//       });
//     }

//     res.json({
//       success: true,
//       message: "Table status updated",
//       data: table,
//     });
//   } catch (err) {
//     res.status(400).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };

// /* ===============================
//    DELETE TABLE
// =============================== */
// const deleteTable = async (req, res) => {
//   try {
//     const table = await Table.findByIdAndDelete(req.params.id);

//     if (!table) {
//       return res.status(404).json({
//         success: false,
//         message: "Table not found",
//       });
//     }

//     res.json({
//       success: true,
//       message: "Table deleted successfully",
//     });
//   } catch (err) {
//     res.status(400).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };

// export default {
//   createTable,
//   getTables,
//   getTableById,
//   updateTableStatus,
//   deleteTable,
// };











import Table from "../models/Table.model.js";
import Restaurant from "../models/Restaurant.model.js";

/* ===============================
   CREATE TABLE
=============================== */
const createTable = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { tableNumber, capacity, status } = req.body;

    if (!tableNumber || !capacity) {
      return res.status(400).json({
        success: false,
        message: "Table number and capacity are required",
      });
    }

    // 🔐 Check restaurant ownership
    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      admin: req.user.id,
    });

    if (!restaurant) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const table = await Table.create({
      restaurant: restaurantId,
      tableNumber: Number(tableNumber),
      capacity: Number(capacity),
      status: status || "available",
      createdBy: req.user.id,
      createdByModel:
        req.user.userType === "ADMIN" ? "Admin" : "Employee",
    });

    res.status(201).json({
      success: true,
      message: "Table created successfully",
      data: table,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Table number already exists for this restaurant",
      });
    }

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ===============================
   GET TABLES BY RESTAURANT
=============================== */
const getTables = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const tables = await Table.find({
      restaurant: restaurantId,
    })
      .sort({ createdAt: -1 })
      .populate("createdBy", "name email");

    res.json({
      success: true,
      data: tables,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

/* ===============================
   GET TABLE BY ID
=============================== */
const getTableById = async (req, res) => {
  try {
    const { restaurantId, id } = req.params;

    const table = await Table.findOne({
      _id: id,
      restaurant: restaurantId,
    }).populate("createdBy", "name email");

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found",
      });
    }

    res.json({
      success: true,
      data: table,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

/* ===============================
   UPDATE TABLE STATUS
=============================== */
const updateTableStatus = async (req, res) => {
  try {
    const { restaurantId, id } = req.params;
    const { status } = req.body;

    if (!["available", "occupied", "reserved"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid table status",
      });
    }

    const table = await Table.findOneAndUpdate(
      {
        _id: id,
        restaurant: restaurantId,
      },
      { status },
      { new: true }
    );

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found",
      });
    }

    res.json({
      success: true,
      message: "Table status updated",
      data: table,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

/* ===============================
   DELETE TABLE
=============================== */
const deleteTable = async (req, res) => {
  try {
    const { restaurantId, id } = req.params;

    const table = await Table.findOneAndDelete({
      _id: id,
      restaurant: restaurantId,
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Table not found",
      });
    }

    res.json({
      success: true,
      message: "Table deleted successfully",
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

export default {
  createTable,
  getTables,
  getTableById,
  updateTableStatus,
  deleteTable,
};
