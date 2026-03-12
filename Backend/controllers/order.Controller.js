
// import Order from "../models/Order.model.js";
// import Table from "../models/Table.model.js";
// import Bill from "../models/Bill.model.js";
// import SalesAnalytics from "../models/SalesAnalytics.model.js";
// import { getIO } from "../socket.js";

// /* ===============================
//    HELPER RESPONSE
// =============================== */
// const sendSuccess = (res, data, status = 200) => {
//   return res.status(status).json({
//     success: true,
//     data,
//   });
// };

// const sendError = (res, message, status = 400) => {
//   return res.status(status).json({
//     success: false,
//     message,
//   });
// };

// /* ===============================
//    CREATE ORDER (WAITER)
// =============================== */
// const createOrder = async (req, res) => {
//   try {
//     const table = await Table.findById(req.body.table);

//     if (!table) {
//       return sendError(res, "Table not found", 404);
//     }

//     const order = await Order.create({
//       ...req.body,
//       restaurant: table.restaurant,
//       waiter: req.user.id,
//       status: "PENDING",
//     });

//     await Table.findByIdAndUpdate(order.table, {
//       status: "occupied",
//     });

//     return sendSuccess(res, order, 201);
//   } catch (err) {
//     console.error("CREATE ORDER ERROR:", err);
//     return sendError(res, err.message);
//   }
// };

// /* ===============================
//    GET ALL ORDERS (ADMIN / MANAGER)
// =============================== */
// const getOrders = async (req, res) => {
//   try {
//     const orders = await Order.find({
//       restaurant: req.user.restaurant,
//     })
//       .populate("table", "tableNumber")
//       .populate("waiter", "name")
//       .populate("chef", "name")
//       .populate("items.menuItem", "name price")
//       .sort({ createdAt: -1 });

//     return sendSuccess(res, orders);
//   } catch (err) {
//     return sendError(res, err.message);
//   }
// };

// /* ===============================
//    GET CHEF ORDERS
// =============================== */
// const getChefOrders = async (req, res) => {
//   try {
//     const orders = await Order.find({
//       restaurant: req.user.restaurant,
//       status: { $in: ["PENDING", "ACCEPTED", "PREPARING"] },
//     })
//       .populate("table", "tableNumber")
//       .populate("waiter", "name")
//       .populate("items.menuItem", "name price")
//       .sort({ createdAt: -1 });

//     return sendSuccess(res, orders);
//   } catch (err) {
//     return sendError(res, err.message);
//   }
// };

// /* ===============================
//    GET WAITER ORDERS
// =============================== */
// const getWaiterOrders = async (req, res) => {
//   try {
//     const orders = await Order.find({
//       restaurant: req.user.restaurant,
//       status: { $in: ["PENDING", "ACCEPTED", "PREPARING", "READY"] },
//     })
//       .populate("table", "tableNumber")
//       .populate("items.menuItem", "name price")
//       .sort({ createdAt: -1 });

//     return sendSuccess(res, orders);
//   } catch (err) {
//     return sendError(res, err.message);
//   }
// };

// /* ===============================
//    GET ORDER BY ID
// =============================== */
// const getOrderById = async (req, res) => {
//   try {
//     const order = await Order.findOne({
//       _id: req.params.id,
//       restaurant: req.user.restaurant,
//     })
//       .populate("table", "tableNumber")
//       .populate("waiter", "name")
//       .populate("chef", "name")
//       .populate("items.menuItem", "name price");

//     if (!order) {
//       return sendError(res, "Order not found", 404);
//     }

//     return sendSuccess(res, order);
//   } catch (err) {
//     return sendError(res, err.message);
//   }
// };

// /* ===============================
//    ACCEPT ORDER (CHEF)
// =============================== */
// const acceptOrder = async (req, res) => {
//   try {
//     const order = await Order.findOne({
//       _id: req.params.id,
//       restaurant: req.user.restaurant,
//     });

//     if (!order || order.status !== "PENDING") {
//       return sendError(res, "Invalid order");
//     }

//     order.chef = req.user.id;
//     order.status = "ACCEPTED";
//     await order.save();

//     return sendSuccess(res, order);
//   } catch (err) {
//     return sendError(res, err.message);
//   }
// };

// /* ===============================
//    UPDATE STATUS
// =============================== */
// const updateStatus = async (req, res, status) => {
//   try {
//     const order = await Order.findOne({
//       _id: req.params.id,
//       restaurant: req.user.restaurant,
//     })
//       .populate("items.menuItem", "name price")
//       .populate("table");

//     if (!order) {
//       return sendError(res, "Order not found", 404);
//     }

//     const validFlow = {
//       PENDING: ["ACCEPTED"],
//       ACCEPTED: ["PREPARING"],
//       PREPARING: ["READY"],
//       READY: ["SERVED"],
//       SERVED: ["PAID"],
//     };

//     if (!validFlow[order.status]?.includes(status)) {
//       return sendError(
//         res,
//         `Cannot change status from ${order.status} to ${status}`
//       );
//     }

//     order.status = status;
//     await order.save();

//     /* ===============================
//        CREATE BILL WHEN SERVED
//     =============================== */
//     if (status === "SERVED") {
//       const existingBill = await Bill.findOne({ order: order._id });

//       if (!existingBill) {
//         const itemsTotal = order.items.reduce(
//           (sum, i) => sum + i.menuItem.price * i.quantity,
//           0
//         );

//         await Bill.create({
//           restaurant: order.restaurant,
//           order: order._id,
//           table: order.table._id,
//           itemsTotal,
//           cgst: Math.round(itemsTotal * 0.025),
//           sgst: Math.round(itemsTotal * 0.025),
//           serviceCharge: 0,
//           totalAmount:
//             itemsTotal + Math.round(itemsTotal * 0.025) * 2,
//           paymentStatus: "PENDING",
//         });
//       }
//     }

//     /* ===============================
//        WHEN PAID (ANALYTICS FIXED)
//     =============================== */
//     if (status === "PAID") {

//       // Free table
//       await Table.findByIdAndUpdate(order.table._id, {
//         status: "available",
//       });

//       const today = new Date().toISOString().split("T")[0];

//       let analytics = await SalesAnalytics.findOne({
//         restaurant: order.restaurant,
//         date: today
//       });

//       if (!analytics) {
//         analytics = new SalesAnalytics({
//           restaurant: order.restaurant,
//           date: today
//         });
//       }

//       // 🔥 FIXED REVENUE LOGIC
//       const bill = await Bill.findOne({ order: order._id });

//       analytics.totalOrders += 1;
//       analytics.totalRevenue += bill ? bill.totalAmount : 0;

//       // Update item stats
//       for (const item of order.items) {
//         const existingItem = analytics.items.find(
//           i => i.menuItem.toString() === item.menuItem._id.toString()
//         );

//         if (existingItem) {
//           existingItem.quantity += item.quantity;
//           existingItem.revenue += item.menuItem.price * item.quantity;
//         } else {
//           analytics.items.push({
//             menuItem: item.menuItem._id,
//             name: item.menuItem.name,
//             quantity: item.quantity,
//             revenue: item.menuItem.price * item.quantity
//           });
//         }
//       }

//       await analytics.save();

//       // Real-time update
//       const io = getIO();
//       io.emit("dashboardUpdate", {
//         restaurant: order.restaurant.toString(),
//         orderId: order._id
//       });
//     }

//     return sendSuccess(res, order);

//   } catch (err) {
//     console.error("UPDATE STATUS ERROR:", err);
//     return sendError(res, err.message);
//   }
// };

// /* ===============================
//    SHORTCUTS
// =============================== */
// const markPreparing = (req, res) =>
//   updateStatus(req, res, "PREPARING");

// const markReady = (req, res) =>
//   updateStatus(req, res, "READY");

// const markServed = (req, res) =>
//   updateStatus(req, res, "SERVED");

// const markPaid = (req, res) =>
//   updateStatus(req, res, "PAID");

// export default {
//   createOrder,
//   getOrders,
//   getChefOrders,
//   getWaiterOrders,
//   getOrderById,
//   acceptOrder,
//   markPreparing,
//   markReady,
//   markServed,
//   markPaid,
// };



















// import mongoose from "mongoose";
// import Order from "../models/Order.model.js";
// import Table from "../models/Table.model.js";
// import Bill from "../models/Bill.model.js";
// import SalesAnalytics from "../models/SalesAnalytics.model.js";
// import Menu from "../models/Menu.model.js";
// import Inventory from "../models/Inventory.model.js";
// import { getIO } from "../socket.js";

// /* ================= HELPER ================= */

// const sendSuccess = (res, data, status = 200) =>
//   res.status(status).json({ success: true, data });

// const sendError = (res, message, status = 400) =>
//   res.status(status).json({ success: false, message });

// /* ================= CREATE ORDER ================= */

// export const createOrder = async (req, res) => {
//   try {
//     const table = await Table.findById(req.body.table);

//     if (!table) return sendError(res, "Table not found", 404);

//     const itemsWithPrice = [];

//     for (const item of req.body.items) {
//       const menu = await Menu.findById(item.menuItem);

//       if (!menu || !menu.isAvailable)
//         throw new Error("Menu item not available");

//       itemsWithPrice.push({
//         menuItem: menu._id,
//         quantity: item.quantity,
//         customization: item.customization || [],
//         price: menu.price,
//       });
//     }

//     const order = await Order.create({
//       restaurant: table.restaurant,
//       table: table._id,
//       waiter: req.user.id,
//       items: itemsWithPrice,
//       status: "PENDING",
//     });

//     await Table.findByIdAndUpdate(table._id, {
//       status: "occupied",
//     });

//     return sendSuccess(res, order, 201);
//   } catch (err) {
//     return sendError(res, err.message);
//   }
// };

// /* ================= ADD MORE ITEMS (FIXED MERGE LOGIC) ================= */

// export const addItemsToOrder = async (req, res) => {
//   try {
//     const order = await Order.findOne({
//       _id: req.params.id,
//       restaurant: req.user.restaurant,
//       status: { $ne: "PAID" },
//     });

//     if (!order)
//       return sendError(res, "Active order not found", 404);

//     for (const newItem of req.body.items) {
//       const menu = await Menu.findById(newItem.menuItem);

//       if (!menu || !menu.isAvailable)
//         throw new Error("Menu item not available");

//       const existingItem = order.items.find(
//         (i) =>
//           i.menuItem.toString() ===
//           newItem.menuItem.toString()
//       );

//       if (existingItem) {
//         existingItem.quantity += newItem.quantity;
//       } else {
//         order.items.push({
//           menuItem: menu._id,
//           quantity: newItem.quantity,
//           customization: newItem.customization || [],
//           price: menu.price,
//         });
//       }
//     }

//     // If order was READY or SERVED and new items added
//     if (["READY", "SERVED"].includes(order.status)) {
//       order.status = "ACCEPTED";
//     }

//     await order.save();

//     return sendSuccess(res, order);
//   } catch (err) {
//     return sendError(res, err.message);
//   }
// };

// /* ================= GET ORDERS ================= */

// export const getOrders = async (req, res) => {
//   try {
//     const orders = await Order.find({
//       restaurant: req.user.restaurant,
//     })
//       .populate("table", "tableNumber")
//       .populate("waiter", "name")
//       .populate("chef", "name")
//       .populate("items.menuItem", "name")
//       .sort({ createdAt: -1 });

//     return sendSuccess(res, orders);
//   } catch (err) {
//     return sendError(res, err.message);
//   }
// };

// /* ================= GET CHEF ORDERS ================= */

// export const getChefOrders = async (req, res) => {
//   try {
//     const orders = await Order.find({
//       restaurant: req.user.restaurant,
//       status: { $in: ["PENDING", "ACCEPTED", "PREPARING"] },
//     })
//       .populate("table", "tableNumber")
//       .populate("waiter", "name")
//       .populate("items.menuItem", "name")
//       .sort({ createdAt: -1 });

//     return sendSuccess(res, orders);
//   } catch (err) {
//     return sendError(res, err.message);
//   }
// };

// /* ================= GET WAITER ORDERS ================= */

// export const getWaiterOrders = async (req, res) => {
//   try {
//     const orders = await Order.find({
//       restaurant: req.user.restaurant,
//       status: { $in: ["PENDING", "ACCEPTED", "PREPARING", "READY"] },
//     })
//       .populate("table", "tableNumber")
//       .populate("items.menuItem", "name")
//       .sort({ createdAt: -1 });

//     return sendSuccess(res, orders);
//   } catch (err) {
//     return sendError(res, err.message);
//   }
// };

// /* ================= GET ORDER BY ID ================= */

// export const getOrderById = async (req, res) => {
//   try {
//     const order = await Order.findOne({
//       _id: req.params.id,
//       restaurant: req.user.restaurant,
//     })
//       .populate("table", "tableNumber")
//       .populate("waiter", "name")
//       .populate("chef", "name")
//       .populate("items.menuItem", "name");

//     if (!order) return sendError(res, "Order not found", 404);

//     return sendSuccess(res, order);
//   } catch (err) {
//     return sendError(res, err.message);
//   }
// };

// /* ================= ACCEPT ORDER ================= */

// export const acceptOrder = async (req, res) => {
//   try {
//     const order = await Order.findOne({
//       _id: req.params.id,
//       restaurant: req.user.restaurant,
//     });

//     if (!order || order.status !== "PENDING")
//       return sendError(res, "Invalid order");

//     order.status = "ACCEPTED";
//     order.chef = req.user.id;
//     order.acceptedAt = new Date();

//     await order.save();

//     return sendSuccess(res, order);
//   } catch (err) {
//     return sendError(res, err.message);
//   }
// };

// /* ================= MARK PREPARING (INVENTORY DEDUCT) ================= */

// export const markPreparing = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const order = await Order.findOne({
//       _id: req.params.id,
//       restaurant: req.user.restaurant,
//     })
//       .populate({
//         path: "items.menuItem",
//         populate: { path: "ingredients.item" },
//       })
//       .session(session);

//     if (!order || order.status !== "ACCEPTED")
//       throw new Error("Order must be ACCEPTED first");

//     for (const item of order.items) {
//       for (const ingredient of item.menuItem.ingredients) {
//         const requiredQty =
//           ingredient.quantity * item.quantity;

//         const inventory = await Inventory.findById(
//           ingredient.item._id
//         ).session(session);

//         if (!inventory)
//           throw new Error("Inventory item not found");

//         if (inventory.quantity < requiredQty)
//           throw new Error(
//             `Insufficient stock for ${inventory.name}`
//           );

//         inventory.quantity -= requiredQty;
//         await inventory.save({ session });
//       }
//     }

//     order.status = "PREPARING";
//     order.preparingAt = new Date();

//     await order.save({ session });

//     await session.commitTransaction();
//     session.endSession();

//     return sendSuccess(res, order);
//   } catch (err) {
//     await session.abortTransaction();
//     session.endSession();
//     return sendError(res, err.message);
//   }
// };

// /* ================= MARK READY ================= */

// export const markReady = async (req, res) => {
//   const order = await Order.findOne({
//     _id: req.params.id,
//     restaurant: req.user.restaurant,
//   });

//   if (!order) return sendError(res, "Order not found", 404);

//   order.status = "READY";
//   order.readyAt = new Date();
//   await order.save();

//   return sendSuccess(res, order);
// };

// /* ================= MARK SERVED ================= */

// export const markServed = async (req, res) => {
//   const order = await Order.findOne({
//     _id: req.params.id,
//     restaurant: req.user.restaurant,
//   });

//   if (!order) return sendError(res, "Order not found", 404);

//   order.status = "SERVED";
//   order.servedAt = new Date();
//   await order.save();

//   const itemsTotal = order.items.reduce(
//     (sum, i) => sum + i.price * i.quantity,
//     0
//   );

//   const existingBill = await Bill.findOne({ order: order._id });

//   if (!existingBill) {
//     await Bill.create({
//       restaurant: order.restaurant,
//       order: order._id,
//       table: order.table,
//       itemsTotal,
//       cgst: Math.round(itemsTotal * 0.025),
//       sgst: Math.round(itemsTotal * 0.025),
//       totalAmount:
//         itemsTotal + Math.round(itemsTotal * 0.025) * 2,
//       paymentStatus: "PENDING",
//     });
//   }

//   return sendSuccess(res, order);
// };

// /* ================= MARK PAID ================= */

// export const markPaid = async (req, res) => {
//   const order = await Order.findOne({
//     _id: req.params.id,
//     restaurant: req.user.restaurant,
//   });

//   if (!order) return sendError(res, "Order not found", 404);

//   order.status = "PAID";
//   order.paidAt = new Date();
//   await order.save();

//   await Table.findByIdAndUpdate(order.table, {
//     status: "available",
//   });

//   const today = new Date().toISOString().split("T")[0];

//   let analytics = await SalesAnalytics.findOne({
//     restaurant: order.restaurant,
//     date: today,
//   });

//   if (!analytics) {
//     analytics = new SalesAnalytics({
//       restaurant: order.restaurant,
//       date: today,
//     });
//   }

//   const bill = await Bill.findOne({ order: order._id });

//   analytics.totalOrders += 1;
//   analytics.totalRevenue += bill?.totalAmount || 0;

//   for (const item of order.items) {
//     const existingItem = analytics.items.find(
//       (i) => i.menuItem.toString() === item.menuItem.toString()
//     );

//     if (existingItem) {
//       existingItem.quantity += item.quantity;
//       existingItem.revenue += item.price * item.quantity;
//     } else {
//       analytics.items.push({
//         menuItem: item.menuItem,
//         quantity: item.quantity,
//         revenue: item.price * item.quantity,
//       });
//     }
//   }

//   await analytics.save();

//   const io = getIO();
//   io.emit("dashboardUpdate", {
//     restaurant: order.restaurant.toString(),
//   });

//   return sendSuccess(res, order);
// };














import mongoose from "mongoose";
import Order from "../models/Order.model.js";
import Table from "../models/Table.model.js";
import Bill from "../models/Bill.model.js";
import SalesAnalytics from "../models/SalesAnalytics.model.js";
import Menu from "../models/Menu.model.js";
import Inventory from "../models/Inventory.model.js";
import { getIO } from "../socket.js";

/* ================= HELPER ================= */

const sendSuccess = (res, data, status = 200) =>
  res.status(status).json({ success: true, data });

const sendError = (res, message, status = 400) =>
  res.status(status).json({ success: false, message });

/* ================= CREATE ORDER ================= */

export const createOrder = async (req, res) => {
  try {
    const table = await Table.findById(req.body.table);
    if (!table) return sendError(res, "Table not found", 404);

    const itemsWithPrice = [];

    for (const item of req.body.items) {
      const menu = await Menu.findById(item.menuItem);
      if (!menu || !menu.isAvailable)
        throw new Error("Menu item not available");

      itemsWithPrice.push({
        menuItem: menu._id,
        quantity: item.quantity,
        customization: item.customization || [],
        price: menu.price,
      });
    }

    const order = await Order.create({
      restaurant: table.restaurant,
      table: table._id,
      waiter: req.user.id,
      items: itemsWithPrice,
      status: "PENDING",
    });

    await Table.findByIdAndUpdate(table._id, {
      status: "occupied",
    });

    return sendSuccess(res, order, 201);
  } catch (err) {
    return sendError(res, err.message);
  }
};

/* ================= ADD ITEMS ================= */

export const addItemsToOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      restaurant: req.user.restaurant,
      status: { $ne: "PAID" },
    });

    if (!order)
      return sendError(res, "Active order not found", 404);

    for (const newItem of req.body.items) {
      const menu = await Menu.findById(newItem.menuItem);
      if (!menu || !menu.isAvailable)
        throw new Error("Menu item not available");

      const existingItem = order.items.find(
        (i) => i.menuItem.toString() === newItem.menuItem.toString()
      );

      if (existingItem) {
        existingItem.quantity += newItem.quantity;
      } else {
        order.items.push({
          menuItem: menu._id,
          quantity: newItem.quantity,
          customization: newItem.customization || [],
          price: menu.price,
        });
      }
    }

    if (["READY", "SERVED"].includes(order.status)) {
      order.status = "ACCEPTED";
    }

    await order.save();
    return sendSuccess(res, order);
  } catch (err) {
    return sendError(res, err.message);
  }
};

/* ================= GET ALL ORDERS (ADMIN/MANAGER) ================= */

export const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      restaurant: req.user.restaurant,
    })
      .populate("table", "tableNumber")
      .populate("waiter", "name")
      .populate("chef", "name")
      .populate("items.menuItem", "name")
      .sort({ createdAt: -1 });

    return sendSuccess(res, orders);
  } catch (err) {
    return sendError(res, err.message);
  }
};

/* ================= GET CHEF ORDERS ================= */

export const getChefOrders = async (req, res) => {
  try {
    const { type } = req.query;

    const filter = {
      restaurant: req.user.restaurant,
      status: { $in: ["PENDING", "ACCEPTED", "PREPARING"] },
    };

    if (type === "mine") {
      filter.chef = req.user.id;
    }

    const orders = await Order.find(filter)
      .populate("table", "tableNumber")
      .populate("waiter", "name")
      .populate("chef", "name")
      .populate("items.menuItem", "name")
      .sort({ createdAt: -1 });

    return sendSuccess(res, orders);
  } catch (err) {
    return sendError(res, err.message);
  }
};

/* ================= GET WAITER ORDERS ================= */

export const getWaiterOrders = async (req, res) => {
  try {
    const filter = {
      restaurant: req.user.restaurant,
      waiter: req.user.id,
      status: { $in: ["PENDING", "ACCEPTED", "PREPARING", "READY"] },
    };

  const orders = await Order.find(filter)
  .populate("table", "tableNumber")
  .populate("waiter", "name")
  .populate("chef", "name")   // ⭐ THIS LINE
  .populate("items.menuItem", "name")
  .sort({ createdAt: -1 });

    return sendSuccess(res, orders);
  } catch (err) {
    return sendError(res, err.message);
  }
};

/* ================= GET ORDER BY ID ================= */

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      restaurant: req.user.restaurant,
    })
      .populate("table", "tableNumber")
      .populate("waiter", "name")
      .populate("chef", "name")
      .populate("items.menuItem", "name price");

    if (!order) return sendError(res, "Order not found", 404);

    return sendSuccess(res, order);
  } catch (err) {
    return sendError(res, err.message);
  }
};

/* ================= ACCEPT ================= */

export const acceptOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      restaurant: req.user.restaurant,
      status: "PENDING",
    });

    if (!order) return sendError(res, "Invalid order");

    order.status = "ACCEPTED";
    order.chef = req.user.id;
    order.acceptedAt = new Date();

    await order.save();
    return sendSuccess(res, order);
  } catch (err) {
    return sendError(res, err.message);
  }
};

/* ================= PREPARING ================= */

export const markPreparing = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findOne({
      _id: req.params.id,
      restaurant: req.user.restaurant,
      status: "ACCEPTED",
    })
      .populate({
        path: "items.menuItem",
        populate: { path: "ingredients.item" },
      })
      .session(session);

    if (!order)
      throw new Error("Order must be ACCEPTED first");

    for (const item of order.items) {
      for (const ingredient of item.menuItem.ingredients) {
        const requiredQty =
          ingredient.quantity * item.quantity;

        const inventory = await Inventory.findById(
          ingredient.item._id
        ).session(session);

        if (!inventory)
          throw new Error("Inventory item not found");

        if (inventory.quantity < requiredQty)
          throw new Error(
            `Insufficient stock for ${inventory.name}`
          );

        inventory.quantity -= requiredQty;
        await inventory.save({ session });
      }
    }

    order.status = "PREPARING";
    order.preparingAt = new Date();
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    return sendSuccess(res, order);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return sendError(res, err.message);
  }
};

/* ================= READY ================= */

export const markReady = async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    restaurant: req.user.restaurant,
  });

  if (!order) return sendError(res, "Order not found", 404);

  order.status = "READY";
  order.readyAt = new Date();
  await order.save();

  return sendSuccess(res, order);
};

/* ================= SERVED ================= */

export const markServed = async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    restaurant: req.user.restaurant,
  });

  if (!order) return sendError(res, "Order not found", 404);

  order.status = "SERVED";
  order.servedAt = new Date();
  await order.save();

  const itemsTotal = order.items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  const existingBill = await Bill.findOne({ order: order._id });

  if (!existingBill) {
    await Bill.create({
      restaurant: order.restaurant,
      order: order._id,
      table: order.table,
      itemsTotal,
      cgst: Math.round(itemsTotal * 0.025),
      sgst: Math.round(itemsTotal * 0.025),
      totalAmount:
        itemsTotal + Math.round(itemsTotal * 0.025) * 2,
      paymentStatus: "PENDING",
    });
  }

  return sendSuccess(res, order);
};

/* ================= PAID ================= */

export const markPaid = async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    restaurant: req.user.restaurant,
  });

  if (!order) return sendError(res, "Order not found", 404);

  order.status = "PAID";
  order.paidAt = new Date();
  await order.save();

  await Table.findByIdAndUpdate(order.table, {
    status: "available",
  });

  return sendSuccess(res, order);
};