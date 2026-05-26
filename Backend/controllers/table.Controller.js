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
import Order from "../models/Order.model.js";

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

    let restaurant;

    /* Admin access */
    if (req.user.role === "admin") {
      restaurant = await Restaurant.findOne({
        _id: restaurantId,
        admin: req.user.id,
      });
    } 
    /* Employee access */
    else {
      if (String(req.user.restaurant) !== String(restaurantId)) {
        return res.status(403).json({
          success: false,
          message: "Access denied for this restaurant",
        });
      }

      restaurant = await Restaurant.findById(restaurantId);
    }

    if (!restaurant) {
      return res.status(403).json({
        success: false,
        message: "Access denied for this restaurant",
      });
    }

    const tables = await Table.find({
      restaurant: restaurantId,
    })
      .sort({ tableNumber: 1 })
      .populate("createdBy", "name email")
      .lean();

    const activeOrders = await Order.find({
      restaurant: restaurantId,
      status: { $nin: ["PAID", "CANCELLED"] },
    })
      .populate("waiter", "name employeeId")
      .populate("items.menuItem", "name price cuisine courseType")
      .populate("tableChangeHistory.fromTable", "tableNumber")
      .populate("tableChangeHistory.toTable", "tableNumber")
      .populate("tableChangeHistory.changedBy", "name")
      .sort({ createdAt: -1 })
      .lean();

    const activeOrderByTable = new Map();
    activeOrders.forEach((order) => {
      const tableId = order.table?.toString();
      if (tableId && !activeOrderByTable.has(tableId)) {
        activeOrderByTable.set(tableId, order);
      }
    });

    const data = tables.map((table) => ({
      ...table,
      activeOrder: activeOrderByTable.get(table._id.toString()) || null,
    }));

    res.json({
      success: true,
      data,
    });

  } catch (err) {
    res.status(500).json({
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
   UPDATE TABLE (capacity + status)
=============================== */
const updateTable = async (req, res) => {
  try {
    const { restaurantId, id } = req.params;
    const { capacity, status } = req.body;

    const updates = {};
    if (capacity !== undefined) {
      const cap = Number(capacity);
      if (!cap || cap <= 0) {
        return res.status(400).json({ success: false, message: "Invalid capacity" });
      }
      updates.capacity = cap;
    }
    if (status !== undefined) {
      if (!["available", "occupied", "reserved"].includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid table status" });
      }
      updates.status = status;
    }

    const table = await Table.findOneAndUpdate(
      { _id: id, restaurant: restaurantId },
      updates,
      { new: true }
    );

    if (!table) {
      return res.status(404).json({ success: false, message: "Table not found" });
    }

    res.json({ success: true, message: "Table updated", data: table });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
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
  updateTable,
  deleteTable,
};
