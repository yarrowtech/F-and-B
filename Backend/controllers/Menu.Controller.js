
// import Menu from "../models/Menu.model.js";
// import Restaurant from "../models/Restaurant.model.js";

// /* ================= CREATE MENU ITEM ================= */
// export const createMenuItem = async (req, res) => {
//   try {
//     const { restaurantId } = req.params;
//     const { name, price, category, isAvailable } = req.body;

//     if (!name || !price || !category) {
//       return res.status(400).json({
//         message: "Name, price and category are required",
//       });
//     }

//     // 🔒 Verify restaurant ownership
//     const restaurant = await Restaurant.findOne({
//       _id: restaurantId,
//       admin: req.user.id,
//     });

//     if (!restaurant) {
//       return res.status(403).json({
//         message: "Access denied",
//       });
//     }

//     const menuItem = await Menu.create({
//       restaurant: restaurantId,
//       name: name.trim(),
//       price: Number(price),
//       category: category.trim(),
//       isAvailable: isAvailable ?? true,
//     });

//     res.status(201).json(menuItem);
//   } catch (err) {
//     if (err.code === 11000) {
//       return res.status(400).json({
//         message: "Menu item already exists for this restaurant",
//       });
//     }
//     res.status(400).json({ message: err.message });
//   }
// };

// /* ================= GET ALL MENU BY RESTAURANT ================= */
// // export const getMenu = async (req, res) => {
// //   try {
// //     const { restaurantId } = req.params;

// //     // 🔒 Verify ownership
// //     const restaurant = await Restaurant.findOne({
// //       _id: restaurantId,
// //       admin: req.user.id,
// //     });

// //     if (!restaurant) {
// //       return res.status(403).json({
// //         message: "Access denied",
// //       });
// //     }

// //     const items = await Menu.find({
// //       restaurant: restaurantId,
// //     }).sort({ createdAt: -1 });

// //     res.json(items);
// //   } catch (err) {
// //     res.status(400).json({ message: err.message });
// //   }
// // };


// export const getMenu = async (req, res) => {
//   try {
//     const { restaurantId } = req.params;

//     let restaurant;

//     if (req.user.role === "admin") {
//       // Admin check
//       restaurant = await Restaurant.findOne({
//         _id: restaurantId,
//         admin: req.user.id,
//       });
//     } else {
//       // Employee check
//       if (req.user.userType === "EMPLOYEE") {

//       const employee = await Employee.findById(req.user.id);

//       if (!employee || 
//          !employee.restaurant ||
//         employee.restaurant.toString() !== restaurantId) {
//         return res.status(403).json({ message: "Access denied" });
//       }
//     }

//       restaurant = await Restaurant.findById(restaurantId);
//     }

//     if (!restaurant) {
//       return res.status(403).json({ message: "Access denied" });
//     }

//     const items = await Menu.find({ restaurant: restaurantId })
//       .sort({ createdAt: -1 });

//     res.json(items);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };


// /* ================= GET MENU ITEM BY ID ================= */
// export const getMenuItemById = async (req, res) => {
//   try {
//     const { restaurantId, id } = req.params;

//     const item = await Menu.findOne({
//       _id: id,
//       restaurant: restaurantId,
//     }).populate("restaurant");

//     if (!item) {
//       return res.status(404).json({
//         message: "Menu item not found",
//       });
//     }

//     if (item.restaurant.admin.toString() !== req.user.id) {
//       return res.status(403).json({
//         message: "Access denied",
//       });
//     }

//     res.json(item);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };

// /* ================= UPDATE MENU ================= */
// export const updateMenuItem = async (req, res) => {
//   try {
//     const { restaurantId, id } = req.params;

//     const item = await Menu.findOne({
//       _id: id,
//       restaurant: restaurantId,
//     }).populate("restaurant");

//     if (!item) {
//       return res.status(404).json({
//         message: "Menu item not found",
//       });
//     }

//     if (item.restaurant.admin.toString() !== req.user.id) {
//       return res.status(403).json({
//         message: "Access denied",
//       });
//     }

//     const { name, price, category, isAvailable } = req.body;

//     if (name !== undefined) item.name = name.trim();
//     if (price !== undefined) item.price = Number(price);
//     if (category !== undefined) item.category = category.trim();
//     if (isAvailable !== undefined) item.isAvailable = isAvailable;

//     await item.save();

//     res.json(item);
//   } catch (err) {
//     if (err.code === 11000) {
//       return res.status(400).json({
//         message: "Menu item already exists for this restaurant",
//       });
//     }
//     res.status(400).json({ message: err.message });
//   }
// };

// /* ================= DELETE MENU ================= */
// export const deleteMenuItem = async (req, res) => {
//   try {
//     const { restaurantId, id } = req.params;

//     const item = await Menu.findOne({
//       _id: id,
//       restaurant: restaurantId,
//     }).populate("restaurant");

//     if (!item) {
//       return res.status(404).json({
//         message: "Menu item not found",
//       });
//     }

//     if (item.restaurant.admin.toString() !== req.user.id) {
//       return res.status(403).json({
//         message: "Access denied",
//       });
//     }

//     await item.deleteOne();

//     res.json({
//       message: "Menu item deleted successfully",
//     });
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };










import Menu from "../models/Menu.model.js";
import Restaurant from "../models/Restaurant.model.js";
import Employee from "../models/Employee.model.js";
import Inventory from "../models/Inventory.model.js";
import Order from "../models/Order.model.js";
import mongoose from "mongoose";
import ExcelJS from "exceljs";
import { invalidateCacheNamespaces } from "../utils/cacheStore.js";

const invalidateMenuCaches = (restaurantId) => {
  invalidateCacheNamespaces([
    `menu:${restaurantId}`,
    `public-menu:${restaurantId}`,
    `menu-analytics:${restaurantId}`,
    "dashboard",
  ]);
};

/* ===============================
   CREATE MENU ITEM
=============================== */
export const createMenuItem = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const {
      name,
      price,
      cuisine,
      courseType,
      description,
      isAvailable,
      ingredients,
    } = req.body;

    if (!name || !price || !cuisine || !courseType) {
      return res.status(400).json({
        message:
          "Name, price, cuisine and courseType are required",
      });
    }

    /* 🔒 Verify restaurant ownership (Admin only) */
    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      admin: req.user.id,
    });

    if (!restaurant) {
      return res.status(403).json({ message: "Access denied" });
    }

    /* 🔥 VALIDATE INGREDIENTS (only if provided) */
    if (Array.isArray(ingredients) && ingredients.length > 0) {
      for (const ing of ingredients) {
        if (!ing.item || !ing.quantity || ing.quantity <= 0) {
          return res.status(400).json({
            message: "Each ingredient must have item and quantity greater than 0",
          });
        }

        const inventoryExists = await Inventory.findOne({
          _id: ing.item,
          restaurant: restaurantId,
          isActive: true,
        });

        if (!inventoryExists) {
          return res.status(400).json({
            message: "Invalid inventory item used in ingredients",
          });
        }
      }
    }

    const menuItem = await Menu.create({
      restaurant: restaurantId,
      name: name.trim(),
      price: Number(price),
      cuisine: cuisine.trim(),
      courseType: courseType.trim(),
      description: description || "",
      isAvailable: isAvailable ?? true,
      ingredients,
    });

    invalidateMenuCaches(restaurantId);

    res.status(201).json(menuItem);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        message:
          "Menu item already exists for this restaurant",
      });
    }
    res.status(400).json({ message: err.message });
  }
};

/* ===============================
   GET ALL MENU BY RESTAURANT
=============================== */
export const getMenu = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    let restaurant;

    if (req.user.role === "admin") {
      restaurant = await Restaurant.findOne({
        _id: restaurantId,
        admin: req.user.id,
      });
    } else {
      const employee = await Employee.findById(req.user.id);

      if (
        !employee ||
        !employee.restaurant ||
        employee.restaurant.toString() !== restaurantId
      ) {
        return res.status(403).json({
          message: "Access denied",
        });
      }

      restaurant = await Restaurant.findById(restaurantId);
    }

    if (!restaurant) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const items = await Menu.find({
      restaurant: restaurantId,
    })
      .populate({ path: "ingredients.item", select: "name unit", strictPopulate: false })
      .sort({ createdAt: -1 });

    res.json(items);
  } catch (err) {
    console.error("GET MENU ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ===============================
   PUBLIC MENU FOR QR SCAN
=============================== */
export const getPublicMenu = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return res.status(400).json({ message: "Invalid restaurant" });
    }

    const restaurant = await Restaurant.findById(restaurantId)
      .select("name address phone")
      .lean();

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const items = await Menu.find({
      restaurant: restaurantId,
      isAvailable: true,
    })
      .select("name cuisine courseType price")
      .sort({ courseType: 1, cuisine: 1, name: 1 })
      .lean();

    res.json({
      restaurant,
      items,
    });
  } catch (err) {
    console.error("PUBLIC MENU ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};

/* ===============================
   GET MENU ITEM BY ID
=============================== */
export const getMenuItemById = async (req, res) => {
  try {
    const { restaurantId, id } = req.params;

    const item = await Menu.findOne({
      _id: id,
      restaurant: restaurantId,
    })
      .populate("restaurant", "name")
      .populate("ingredients.item", "name unit quantity");

    if (!item) {
      return res.status(404).json({
        message: "Menu item not found",
      });
    }

    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ===============================
   UPDATE MENU ITEM
=============================== */
export const updateMenuItem = async (req, res) => {
  try {
    const { restaurantId, id } = req.params;

    const item = await Menu.findOne({
      _id: id,
      restaurant: restaurantId,
    }).populate("restaurant");

    if (!item) {
      return res.status(404).json({
        message: "Menu item not found",
      });
    }

    const isAdmin = req.user.role === "admin";
    const isManager = req.user.role === "manager";

    if (isAdmin) {
      if (item.restaurant.admin.toString() !== req.user.id) {
        return res.status(403).json({
          message: "Access denied",
        });
      }
    } else if (isManager) {
      const employee = await Employee.findById(req.user.id).select("restaurant");

      if (
        !employee ||
        !employee.restaurant ||
        employee.restaurant.toString() !== restaurantId
      ) {
        return res.status(403).json({
          message: "Access denied",
        });
      }
    } else {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const {
      name,
      price,
      cuisine,
      courseType,
      description,
      isAvailable,
      ingredients,
    } = req.body;

    if (isManager) {
      if (isAvailable === undefined) {
        return res.status(400).json({
          message: "Availability status is required",
        });
      }

      item.isAvailable = Boolean(isAvailable);
      await item.save();
      invalidateMenuCaches(restaurantId);
      return res.json(item);
    }

    if (name !== undefined) item.name = name.trim();
    if (price !== undefined) item.price = Number(price);
    if (cuisine !== undefined) item.cuisine = cuisine.trim();
    if (courseType !== undefined) item.courseType = courseType.trim();
    if (description !== undefined) item.description = description;
    if (isAvailable !== undefined) item.isAvailable = isAvailable;

    /* 🔥 Validate ingredients if updating (empty array allowed) */
    if (ingredients !== undefined) {
      if (!Array.isArray(ingredients)) {
        return res.status(400).json({ message: "Ingredients must be an array" });
      }

      for (const ing of ingredients) {
        if (!ing.item || !ing.quantity || ing.quantity <= 0) {
          return res.status(400).json({
            message: "Each ingredient must have item and quantity greater than 0",
          });
        }

        const inventoryExists = await Inventory.findOne({
          _id: ing.item,
          restaurant: restaurantId,
          isActive: true,
        });

        if (!inventoryExists) {
          return res.status(400).json({
            message: "Invalid inventory item used in ingredients",
          });
        }
      }

      item.ingredients = ingredients;
    }

    await item.save();
    invalidateMenuCaches(restaurantId);

    res.json(item);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        message:
          "Menu item already exists for this restaurant",
      });
    }
    res.status(400).json({ message: err.message });
  }
};

/* ===============================
   DELETE MENU ITEM
=============================== */
export const deleteMenuItem = async (req, res) => {
  try {
    const { restaurantId, id } = req.params;

    const item = await Menu.findOne({
      _id: id,
      restaurant: restaurantId,
    }).populate("restaurant");

    if (!item) {
      return res.status(404).json({
        message: "Menu item not found",
      });
    }

    if (item.restaurant.admin.toString() !== req.user.id) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    await item.deleteOne();
    invalidateMenuCaches(restaurantId);

    res.json({
      message: "Menu item deleted successfully",
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


const verifyMenuAnalyticsAccess = async (req, restaurantId) => {
  if (req.user.role === "admin") {
    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      admin: req.user.id,
    });
    return Boolean(restaurant);
  }

  const employee = await Employee.findById(req.user.id);
  return Boolean(
    employee &&
      employee.restaurant &&
      employee.restaurant.toString() === restaurantId
  );
};

const buildMenuAnalyticsRange = ({ range, startDate, endDate, date }) => {
  let start;
  let end;

  if (range === "today") {
    start = new Date();
    start.setHours(0, 0, 0, 0);

    end = new Date();
    end.setHours(23, 59, 59, 999);
  } else if (range === "last7days" || range === "week") {
    start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    end = new Date();
    end.setHours(23, 59, 59, 999);
  } else if (range === "last1month" || range === "month") {
    start = new Date();
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);

    end = new Date();
    end.setHours(23, 59, 59, 999);
  } else if (startDate && endDate) {
    start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  } else if (date) {
    start = new Date(date);
    start.setHours(0, 0, 0, 0);

    end = new Date(date);
    end.setHours(23, 59, 59, 999);
  }

  if (!start || !end) {
    throw new Error("Provide date, startDate and endDate, or range");
  }

  if (start > end) {
    throw new Error("Start date cannot be after end date");
  }

  return { start, end };
};

const buildMenuSalesAnalytics = async (restaurantId, start, end) =>
  Order.aggregate([
    {
      $match: {
        restaurant: new mongoose.Types.ObjectId(restaurantId),
        createdAt: { $gte: start, $lte: end },
        status: { $ne: "CANCELLED" },
      },
    },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.menuItem",
        totalOrders: { $sum: "$items.quantity" },
        salesAmount: {
          $sum: {
            $multiply: [
              "$items.quantity",
              { $ifNull: ["$items.price", 0] },
            ],
          },
        },
      },
    },
    {
      $lookup: {
        from: "menus",
        localField: "_id",
        foreignField: "_id",
        as: "menu",
      },
    },
    { $unwind: "$menu" },
    {
      $project: {
        name: "$menu.name",
        cuisine: "$menu.cuisine",
        courseType: "$menu.courseType",
        price: "$menu.price",
        totalOrders: 1,
        salesAmount: 1,
      },
    },
    { $sort: { totalOrders: -1 } },
  ]);

const formatAnalyticsDate = (date) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);

const roundMoney = (value) =>
  Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

export const getMenuOrdersByDate = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { date, range, startDate, endDate } = req.query;

    /* 🔒 Verify employee belongs to restaurant */
    if (req.user.role === "admin") {
      const restaurant = await Restaurant.findOne({
        _id: restaurantId,
        admin: req.user.id,
      });

      if (!restaurant) {
        return res.status(403).json({ message: "Access denied" });
      }
    } else {
      const employee = await Employee.findById(req.user.id);

      if (
        !employee ||
        !employee.restaurant ||
        employee.restaurant.toString() !== restaurantId
      ) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    let start;
    let end;

    /* ================= RANGE SUPPORT ================= */

    if (range === "today") {
      start = new Date();
      start.setHours(0, 0, 0, 0);

      end = new Date();
      end.setHours(23, 59, 59, 999);
    }

    else if (range === "last7days" || range === "week") {
      start = new Date();
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);

      end = new Date();
      end.setHours(23, 59, 59, 999);
    }

    else if (range === "last1month" || range === "month") {
      start = new Date();
      start.setDate(start.getDate() - 29);
      start.setHours(0, 0, 0, 0);

      end = new Date();
      end.setHours(23, 59, 59, 999);
    }

    /* ================= DATE RANGE SUPPORT ================= */

    else if (startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      if (start > end) {
        return res.status(400).json({
          message: "Start date cannot be after end date",
        });
      }
    }

    /* ================= SINGLE DATE SUPPORT ================= */

    else if (date) {
      start = new Date(date);
      start.setHours(0, 0, 0, 0);

      end = new Date(date);
      end.setHours(23, 59, 59, 999);
    }

    else {
      return res.status(400).json({
        message: "Provide date, startDate and endDate, or range",
      });
    }

    /* ================= ANALYTICS ================= */

const result = await Order.aggregate([

  {
    $match: {
      restaurant: new mongoose.Types.ObjectId(restaurantId),
      createdAt: { $gte: start, $lte: end },
      status: { $ne: "CANCELLED" }
    }
  },

  {
    $unwind: "$items"
  },

  {
    $group: {
      _id: "$items.menuItem",
      totalOrders: { $sum: "$items.quantity" }
    }
  },

  {
    $lookup: {
      from: "menus",
      localField: "_id",
      foreignField: "_id",
      as: "menu"
    }
  },

  {
    $unwind: "$menu"
  },

  {
    $project: {
      name: "$menu.name",
      cuisine: "$menu.cuisine",
      courseType: "$menu.courseType",
      totalOrders: 1
    }
  },

  {
    $sort: { totalOrders: -1 }
  }

]);

    res.json(result);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const exportMenuSalesExcel = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { date, range, startDate, endDate } = req.query;

    const hasAccess = await verifyMenuAnalyticsAccess(req, restaurantId);
    if (!hasAccess) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { start, end } = buildMenuAnalyticsRange({
      range,
      startDate,
      endDate,
      date,
    });
    const rows = await buildMenuSalesAnalytics(restaurantId, start, end);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "F&B ERP";
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet("Menu Item Sales");
    worksheet.columns = [
      { header: "Date Range", key: "dateRange", width: 28 },
      { header: "Menu Item", key: "name", width: 32 },
      { header: "Cuisine", key: "cuisine", width: 18 },
      { header: "Course", key: "courseType", width: 18 },
      { header: "Qty Sold", key: "totalOrders", width: 14 },
      { header: "Item Price", key: "price", width: 14 },
      { header: "Sales Amount", key: "salesAmount", width: 16 },
    ];

    worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    worksheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF047857" },
    };

    const dateRange =
      start.toDateString() === end.toDateString()
        ? formatAnalyticsDate(start)
        : `${formatAnalyticsDate(start)} to ${formatAnalyticsDate(end)}`;

    rows.forEach((item) => {
      worksheet.addRow({
        dateRange,
        name: item.name || "Menu Item",
        cuisine: item.cuisine || "-",
        courseType: item.courseType || "-",
        totalOrders: Number(item.totalOrders || 0),
        price: roundMoney(item.price),
        salesAmount: roundMoney(item.salesAmount || Number(item.totalOrders || 0) * Number(item.price || 0)),
      });
    });

    ["totalOrders", "price", "salesAmount"].forEach((key) => {
      worksheet.getColumn(key).numFmt = key === "totalOrders" ? "0.###" : "0.00";
    });

    worksheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    const fileFrom = start.toISOString().slice(0, 10);
    const fileTo = end.toISOString().slice(0, 10);
    const filename = `menu-item-sales-${fileFrom}-to-${fileTo}.xlsx`;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(err.message.includes("Provide") || err.message.includes("cannot") ? 400 : 500).json({ message: err.message });
  }
};
