
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

    /* 🔥 VALIDATE INGREDIENTS */
    if (
      !ingredients ||
      !Array.isArray(ingredients) ||
      ingredients.length === 0
    ) {
      return res.status(400).json({
        message:
          "Menu must have at least one ingredient",
      });
    }

    for (const ing of ingredients) {
      if (!ing.item || !ing.quantity || ing.quantity <= 0) {
        return res.status(400).json({
          message:
            "Each ingredient must have item and quantity greater than 0",
        });
      }

      // Ensure inventory item exists
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
      .populate("ingredients.item", "name unit")
      .sort({ createdAt: -1 });

    res.json(items);
  } catch (err) {
    res.status(400).json({ message: err.message });
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

    if (item.restaurant.admin.toString() !== req.user.id) {
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

    if (name !== undefined) item.name = name.trim();
    if (price !== undefined) item.price = Number(price);
    if (cuisine !== undefined)
      item.cuisine = cuisine.trim();
    if (courseType !== undefined)
      item.courseType = courseType.trim();
    if (description !== undefined)
      item.description = description;
    if (isAvailable !== undefined)
      item.isAvailable = isAvailable;

    /* 🔥 Validate ingredients if updating */
    if (ingredients !== undefined) {
      if (
        !Array.isArray(ingredients) ||
        ingredients.length === 0
      ) {
        return res.status(400).json({
          message:
            "Menu must have at least one ingredient",
        });
      }

      for (const ing of ingredients) {
        if (!ing.item || !ing.quantity || ing.quantity <= 0) {
          return res.status(400).json({
            message:
              "Each ingredient must have item and quantity greater than 0",
          });
        }

        const inventoryExists = await Inventory.findOne({
          _id: ing.item,
          restaurant: restaurantId,
          isActive: true,
        });

        if (!inventoryExists) {
          return res.status(400).json({
            message:
              "Invalid inventory item used in ingredients",
          });
        }
      }

      item.ingredients = ingredients;
    }

    await item.save();

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

    res.json({
      message: "Menu item deleted successfully",
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


export const getMenuOrdersByDate = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { date, range } = req.query;

    /* 🔒 Verify employee belongs to restaurant */
    const employee = await Employee.findById(req.user.id);

    if (
      !employee ||
      !employee.restaurant ||
      employee.restaurant.toString() !== restaurantId
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    let start;
    let end;

    const now = new Date();

    /* ================= RANGE SUPPORT ================= */

    if (range === "today") {
      start = new Date();
      start.setHours(0, 0, 0, 0);

      end = new Date();
      end.setHours(23, 59, 59, 999);
    }

    else if (range === "yesterday") {
      start = new Date();
      start.setDate(start.getDate() - 1);
      start.setHours(0, 0, 0, 0);

      end = new Date();
      end.setDate(end.getDate() - 1);
      end.setHours(23, 59, 59, 999);
    }

    else if (range === "week") {
      start = new Date();
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);

      end = new Date();
      end.setHours(23, 59, 59, 999);
    }

    /* ================= DATE SUPPORT ================= */

    else if (date) {
      start = new Date(date);
      start.setHours(0, 0, 0, 0);

      end = new Date(date);
      end.setHours(23, 59, 59, 999);
    }

    else {
      return res.status(400).json({
        message: "Provide date or range",
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