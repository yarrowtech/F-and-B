
// // import Order from "../models/Order.model.js";
// // import Table from "../models/Table.model.js";
// // import Bill from "../models/Bill.model.js";
// // import SalesAnalytics from "../models/SalesAnalytics.model.js";
// // import { getIO } from "../socket.js";

// // /* ===============================
// //    HELPER RESPONSE
// // =============================== */
// // const sendSuccess = (res, data, status = 200) => {
// //   return res.status(status).json({
// //     success: true,
// //     data,
// //   });
// // };

// // const sendError = (res, message, status = 400) => {
// //   return res.status(status).json({
// //     success: false,
// //     message,
// //   });
// // };

// // /* ===============================
// //    CREATE ORDER (WAITER)
// // =============================== */
// // const createOrder = async (req, res) => {
// //   try {
// //     const table = await Table.findById(req.body.table);

// //     if (!table) {
// //       return sendError(res, "Table not found", 404);
// //     }

// //     const order = await Order.create({
// //       ...req.body,
// //       restaurant: table.restaurant,
// //       waiter: req.user.id,
// //       status: "PENDING",
// //     });

// //     await Table.findByIdAndUpdate(order.table, {
// //       status: "occupied",
// //     });

// //     return sendSuccess(res, order, 201);
// //   } catch (err) {
// //     console.error("CREATE ORDER ERROR:", err);
// //     return sendError(res, err.message);
// //   }
// // };

// // /* ===============================
// //    GET ALL ORDERS (ADMIN / MANAGER)
// // =============================== */
// // const getOrders = async (req, res) => {
// //   try {
// //     const orders = await Order.find({
// //       restaurant: req.user.restaurant,
// //     })
// //       .populate("table", "tableNumber")
// //       .populate("waiter", "name")
// //       .populate("chef", "name")
// //       .populate("items.menuItem", "name price")
// //       .sort({ createdAt: -1 });

// //     return sendSuccess(res, orders);
// //   } catch (err) {
// //     return sendError(res, err.message);
// //   }
// // };

// // /* ===============================
// //    GET CHEF ORDERS
// // =============================== */
// // const getChefOrders = async (req, res) => {
// //   try {
// //     const orders = await Order.find({
// //       restaurant: req.user.restaurant,
// //       status: { $in: ["PENDING", "ACCEPTED", "PREPARING"] },
// //     })
// //       .populate("table", "tableNumber")
// //       .populate("waiter", "name")
// //       .populate("items.menuItem", "name price")
// //       .sort({ createdAt: -1 });

// //     return sendSuccess(res, orders);
// //   } catch (err) {
// //     return sendError(res, err.message);
// //   }
// // };

// // /* ===============================
// //    GET WAITER ORDERS
// // =============================== */
// // const getWaiterOrders = async (req, res) => {
// //   try {
// //     const orders = await Order.find({
// //       restaurant: req.user.restaurant,
// //       status: { $in: ["PENDING", "ACCEPTED", "PREPARING", "READY"] },
// //     })
// //       .populate("table", "tableNumber")
// //       .populate("items.menuItem", "name price")
// //       .sort({ createdAt: -1 });

// //     return sendSuccess(res, orders);
// //   } catch (err) {
// //     return sendError(res, err.message);
// //   }
// // };

// // /* ===============================
// //    GET ORDER BY ID
// // =============================== */
// // const getOrderById = async (req, res) => {
// //   try {
// //     const order = await Order.findOne({
// //       _id: req.params.id,
// //       restaurant: req.user.restaurant,
// //     })
// //       .populate("table", "tableNumber")
// //       .populate("waiter", "name")
// //       .populate("chef", "name")
// //       .populate("items.menuItem", "name price");

// //     if (!order) {
// //       return sendError(res, "Order not found", 404);
// //     }

// //     return sendSuccess(res, order);
// //   } catch (err) {
// //     return sendError(res, err.message);
// //   }
// // };

// // /* ===============================
// //    ACCEPT ORDER (CHEF)
// // =============================== */
// // const acceptOrder = async (req, res) => {
// //   try {
// //     const order = await Order.findOne({
// //       _id: req.params.id,
// //       restaurant: req.user.restaurant,
// //     });

// //     if (!order || order.status !== "PENDING") {
// //       return sendError(res, "Invalid order");
// //     }

// //     order.chef = req.user.id;
// //     order.status = "ACCEPTED";
// //     await order.save();

// //     return sendSuccess(res, order);
// //   } catch (err) {
// //     return sendError(res, err.message);
// //   }
// // };

// // /* ===============================
// //    UPDATE STATUS
// // =============================== */
// // const updateStatus = async (req, res, status) => {
// //   try {
// //     const order = await Order.findOne({
// //       _id: req.params.id,
// //       restaurant: req.user.restaurant,
// //     })
// //       .populate("items.menuItem", "name price")
// //       .populate("table");

// //     if (!order) {
// //       return sendError(res, "Order not found", 404);
// //     }

// //     const validFlow = {
// //       PENDING: ["ACCEPTED"],
// //       ACCEPTED: ["PREPARING"],
// //       PREPARING: ["READY"],
// //       READY: ["SERVED"],
// //       SERVED: ["PAID"],
// //     };

// //     if (!validFlow[order.status]?.includes(status)) {
// //       return sendError(
// //         res,
// //         `Cannot change status from ${order.status} to ${status}`
// //       );
// //     }

// //     order.status = status;
// //     await order.save();

// //     /* ===============================
// //        CREATE BILL WHEN SERVED
// //     =============================== */
// //     if (status === "SERVED") {
// //       const existingBill = await Bill.findOne({ order: order._id });

// //       if (!existingBill) {
// //         const itemsTotal = order.items.reduce(
// //           (sum, i) => sum + i.menuItem.price * i.quantity,
// //           0
// //         );

// //         await Bill.create({
// //           restaurant: order.restaurant,
// //           order: order._id,
// //           table: order.table._id,
// //           itemsTotal,
// //           cgst: Math.round(itemsTotal * 0.025),
// //           sgst: Math.round(itemsTotal * 0.025),
// //           serviceCharge: 0,
// //           totalAmount:
// //             itemsTotal + Math.round(itemsTotal * 0.025) * 2,
// //           paymentStatus: "PENDING",
// //         });
// //       }
// //     }

// //     /* ===============================
// //        WHEN PAID (ANALYTICS FIXED)
// //     =============================== */
// //     if (status === "PAID") {

// //       // Free table
// //       await Table.findByIdAndUpdate(order.table._id, {
// //         status: "available",
// //       });

// //       const today = new Date().toISOString().split("T")[0];

// //       let analytics = await SalesAnalytics.findOne({
// //         restaurant: order.restaurant,
// //         date: today
// //       });

// //       if (!analytics) {
// //         analytics = new SalesAnalytics({
// //           restaurant: order.restaurant,
// //           date: today
// //         });
// //       }

// //       // 🔥 FIXED REVENUE LOGIC
// //       const bill = await Bill.findOne({ order: order._id });

// //       analytics.totalOrders += 1;
// //       analytics.totalRevenue += bill ? bill.totalAmount : 0;

// //       // Update item stats
// //       for (const item of order.items) {
// //         const existingItem = analytics.items.find(
// //           i => i.menuItem.toString() === item.menuItem._id.toString()
// //         );

// //         if (existingItem) {
// //           existingItem.quantity += item.quantity;
// //           existingItem.revenue += item.menuItem.price * item.quantity;
// //         } else {
// //           analytics.items.push({
// //             menuItem: item.menuItem._id,
// //             name: item.menuItem.name,
// //             quantity: item.quantity,
// //             revenue: item.menuItem.price * item.quantity
// //           });
// //         }
// //       }

// //       await analytics.save();

// //       // Real-time update
// //       const io = getIO();
// //       io.emit("dashboardUpdate", {
// //         restaurant: order.restaurant.toString(),
// //         orderId: order._id
// //       });
// //     }

// //     return sendSuccess(res, order);

// //   } catch (err) {
// //     console.error("UPDATE STATUS ERROR:", err);
// //     return sendError(res, err.message);
// //   }
// // };

// // /* ===============================
// //    SHORTCUTS
// // =============================== */
// // const markPreparing = (req, res) =>
// //   updateStatus(req, res, "PREPARING");

// // const markReady = (req, res) =>
// //   updateStatus(req, res, "READY");

// // const markServed = (req, res) =>
// //   updateStatus(req, res, "SERVED");

// // const markPaid = (req, res) =>
// //   updateStatus(req, res, "PAID");

// // export default {
// //   createOrder,
// //   getOrders,
// //   getChefOrders,
// //   getWaiterOrders,
// //   getOrderById,
// //   acceptOrder,
// //   markPreparing,
// //   markReady,
// //   markServed,
// //   markPaid,
// // };



















// // import mongoose from "mongoose";
// // import Order from "../models/Order.model.js";
// // import Table from "../models/Table.model.js";
// // import Bill from "../models/Bill.model.js";
// // import SalesAnalytics from "../models/SalesAnalytics.model.js";
// // import Menu from "../models/Menu.model.js";
// // import Inventory from "../models/Inventory.model.js";
// // import { getIO } from "../socket.js";

// // /* ================= HELPER ================= */

// // const sendSuccess = (res, data, status = 200) =>
// //   res.status(status).json({ success: true, data });

// // const sendError = (res, message, status = 400) =>
// //   res.status(status).json({ success: false, message });

// // /* ================= CREATE ORDER ================= */

// // export const createOrder = async (req, res) => {
// //   try {
// //     const table = await Table.findById(req.body.table);

// //     if (!table) return sendError(res, "Table not found", 404);

// //     const itemsWithPrice = [];

// //     for (const item of req.body.items) {
// //       const menu = await Menu.findById(item.menuItem);

// //       if (!menu || !menu.isAvailable)
// //         throw new Error("Menu item not available");

// //       itemsWithPrice.push({
// //         menuItem: menu._id,
// //         quantity: item.quantity,
// //         customization: item.customization || [],
// //         price: menu.price,
// //       });
// //     }

// //     const order = await Order.create({
// //       restaurant: table.restaurant,
// //       table: table._id,
// //       waiter: req.user.id,
// //       items: itemsWithPrice,
// //       status: "PENDING",
// //     });

// //     await Table.findByIdAndUpdate(table._id, {
// //       status: "occupied",
// //     });

// //     return sendSuccess(res, order, 201);
// //   } catch (err) {
// //     return sendError(res, err.message);
// //   }
// // };

// // /* ================= ADD MORE ITEMS (FIXED MERGE LOGIC) ================= */

// // export const addItemsToOrder = async (req, res) => {
// //   try {
// //     const order = await Order.findOne({
// //       _id: req.params.id,
// //       restaurant: req.user.restaurant,
// //       status: { $ne: "PAID" },
// //     });

// //     if (!order)
// //       return sendError(res, "Active order not found", 404);

// //     for (const newItem of req.body.items) {
// //       const menu = await Menu.findById(newItem.menuItem);

// //       if (!menu || !menu.isAvailable)
// //         throw new Error("Menu item not available");

// //       const existingItem = order.items.find(
// //         (i) =>
// //           i.menuItem.toString() ===
// //           newItem.menuItem.toString()
// //       );

// //       if (existingItem) {
// //         existingItem.quantity += newItem.quantity;
// //       } else {
// //         order.items.push({
// //           menuItem: menu._id,
// //           quantity: newItem.quantity,
// //           customization: newItem.customization || [],
// //           price: menu.price,
// //         });
// //       }
// //     }

// //     // If order was READY or SERVED and new items added
// //     if (["READY", "SERVED"].includes(order.status)) {
// //       order.status = "ACCEPTED";
// //     }

// //     await order.save();

// //     return sendSuccess(res, order);
// //   } catch (err) {
// //     return sendError(res, err.message);
// //   }
// // };

// // /* ================= GET ORDERS ================= */

// // export const getOrders = async (req, res) => {
// //   try {
// //     const orders = await Order.find({
// //       restaurant: req.user.restaurant,
// //     })
// //       .populate("table", "tableNumber")
// //       .populate("waiter", "name")
// //       .populate("chef", "name")
// //       .populate("items.menuItem", "name")
// //       .sort({ createdAt: -1 });

// //     return sendSuccess(res, orders);
// //   } catch (err) {
// //     return sendError(res, err.message);
// //   }
// // };

// // /* ================= GET CHEF ORDERS ================= */

// // export const getChefOrders = async (req, res) => {
// //   try {
// //     const orders = await Order.find({
// //       restaurant: req.user.restaurant,
// //       status: { $in: ["PENDING", "ACCEPTED", "PREPARING"] },
// //     })
// //       .populate("table", "tableNumber")
// //       .populate("waiter", "name")
// //       .populate("items.menuItem", "name")
// //       .sort({ createdAt: -1 });

// //     return sendSuccess(res, orders);
// //   } catch (err) {
// //     return sendError(res, err.message);
// //   }
// // };

// // /* ================= GET WAITER ORDERS ================= */

// // export const getWaiterOrders = async (req, res) => {
// //   try {
// //     const orders = await Order.find({
// //       restaurant: req.user.restaurant,
// //       status: { $in: ["PENDING", "ACCEPTED", "PREPARING", "READY"] },
// //     })
// //       .populate("table", "tableNumber")
// //       .populate("items.menuItem", "name")
// //       .sort({ createdAt: -1 });

// //     return sendSuccess(res, orders);
// //   } catch (err) {
// //     return sendError(res, err.message);
// //   }
// // };

// // /* ================= GET ORDER BY ID ================= */

// // export const getOrderById = async (req, res) => {
// //   try {
// //     const order = await Order.findOne({
// //       _id: req.params.id,
// //       restaurant: req.user.restaurant,
// //     })
// //       .populate("table", "tableNumber")
// //       .populate("waiter", "name")
// //       .populate("chef", "name")
// //       .populate("items.menuItem", "name");

// //     if (!order) return sendError(res, "Order not found", 404);

// //     return sendSuccess(res, order);
// //   } catch (err) {
// //     return sendError(res, err.message);
// //   }
// // };

// // /* ================= ACCEPT ORDER ================= */

// // export const acceptOrder = async (req, res) => {
// //   try {
// //     const order = await Order.findOne({
// //       _id: req.params.id,
// //       restaurant: req.user.restaurant,
// //     });

// //     if (!order || order.status !== "PENDING")
// //       return sendError(res, "Invalid order");

// //     order.status = "ACCEPTED";
// //     order.chef = req.user.id;
// //     order.acceptedAt = new Date();

// //     await order.save();

// //     return sendSuccess(res, order);
// //   } catch (err) {
// //     return sendError(res, err.message);
// //   }
// // };

// // /* ================= MARK PREPARING (INVENTORY DEDUCT) ================= */

// // export const markPreparing = async (req, res) => {
// //   const session = await mongoose.startSession();
// //   session.startTransaction();

// //   try {
// //     const order = await Order.findOne({
// //       _id: req.params.id,
// //       restaurant: req.user.restaurant,
// //     })
// //       .populate({
// //         path: "items.menuItem",
// //         populate: { path: "ingredients.item" },
// //       })
// //       .session(session);

// //     if (!order || order.status !== "ACCEPTED")
// //       throw new Error("Order must be ACCEPTED first");

// //     for (const item of order.items) {
// //       for (const ingredient of item.menuItem.ingredients) {
// //         const requiredQty =
// //           ingredient.quantity * item.quantity;

// //         const inventory = await Inventory.findById(
// //           ingredient.item._id
// //         ).session(session);

// //         if (!inventory)
// //           throw new Error("Inventory item not found");

// //         if (inventory.quantity < requiredQty)
// //           throw new Error(
// //             `Insufficient stock for ${inventory.name}`
// //           );

// //         inventory.quantity -= requiredQty;
// //         await inventory.save({ session });
// //       }
// //     }

// //     order.status = "PREPARING";
// //     order.preparingAt = new Date();

// //     await order.save({ session });

// //     await session.commitTransaction();
// //     session.endSession();

// //     return sendSuccess(res, order);
// //   } catch (err) {
// //     await session.abortTransaction();
// //     session.endSession();
// //     return sendError(res, err.message);
// //   }
// // };

// // /* ================= MARK READY ================= */

// // export const markReady = async (req, res) => {
// //   const order = await Order.findOne({
// //     _id: req.params.id,
// //     restaurant: req.user.restaurant,
// //   });

// //   if (!order) return sendError(res, "Order not found", 404);

// //   order.status = "READY";
// //   order.readyAt = new Date();
// //   await order.save();

// //   return sendSuccess(res, order);
// // };

// // /* ================= MARK SERVED ================= */

// // export const markServed = async (req, res) => {
// //   const order = await Order.findOne({
// //     _id: req.params.id,
// //     restaurant: req.user.restaurant,
// //   });

// //   if (!order) return sendError(res, "Order not found", 404);

// //   order.status = "SERVED";
// //   order.servedAt = new Date();
// //   await order.save();

// //   const itemsTotal = order.items.reduce(
// //     (sum, i) => sum + i.price * i.quantity,
// //     0
// //   );

// //   const existingBill = await Bill.findOne({ order: order._id });

// //   if (!existingBill) {
// //     await Bill.create({
// //       restaurant: order.restaurant,
// //       order: order._id,
// //       table: order.table,
// //       itemsTotal,
// //       cgst: Math.round(itemsTotal * 0.025),
// //       sgst: Math.round(itemsTotal * 0.025),
// //       totalAmount:
// //         itemsTotal + Math.round(itemsTotal * 0.025) * 2,
// //       paymentStatus: "PENDING",
// //     });
// //   }

// //   return sendSuccess(res, order);
// // };

// // /* ================= MARK PAID ================= */

// // export const markPaid = async (req, res) => {
// //   const order = await Order.findOne({
// //     _id: req.params.id,
// //     restaurant: req.user.restaurant,
// //   });

// //   if (!order) return sendError(res, "Order not found", 404);

// //   order.status = "PAID";
// //   order.paidAt = new Date();
// //   await order.save();

// //   await Table.findByIdAndUpdate(order.table, {
// //     status: "available",
// //   });

// //   const today = new Date().toISOString().split("T")[0];

// //   let analytics = await SalesAnalytics.findOne({
// //     restaurant: order.restaurant,
// //     date: today,
// //   });

// //   if (!analytics) {
// //     analytics = new SalesAnalytics({
// //       restaurant: order.restaurant,
// //       date: today,
// //     });
// //   }

// //   const bill = await Bill.findOne({ order: order._id });

// //   analytics.totalOrders += 1;
// //   analytics.totalRevenue += bill?.totalAmount || 0;

// //   for (const item of order.items) {
// //     const existingItem = analytics.items.find(
// //       (i) => i.menuItem.toString() === item.menuItem.toString()
// //     );

// //     if (existingItem) {
// //       existingItem.quantity += item.quantity;
// //       existingItem.revenue += item.price * item.quantity;
// //     } else {
// //       analytics.items.push({
// //         menuItem: item.menuItem,
// //         quantity: item.quantity,
// //         revenue: item.price * item.quantity,
// //       });
// //     }
// //   }

// //   await analytics.save();

// //   const io = getIO();
// //   io.emit("dashboardUpdate", {
// //     restaurant: order.restaurant.toString(),
// //   });

// //   return sendSuccess(res, order);
// // };














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

// /* ================= ADD ITEMS ================= */

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
//         (i) => i.menuItem.toString() === newItem.menuItem.toString()
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

//     if (["READY", "SERVED"].includes(order.status)) {
//       order.status = "ACCEPTED";
//     }

//     await order.save();
//     return sendSuccess(res, order);
//   } catch (err) {
//     return sendError(res, err.message);
//   }
// };

// /* ================= GET ALL ORDERS (ADMIN/MANAGER) ================= */

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
//     const { type } = req.query;

//     const filter = {
//       restaurant: req.user.restaurant,
//       status: { $in: ["PENDING", "ACCEPTED", "PREPARING"] },
//     };

//     if (type === "mine") {
//       filter.chef = req.user.id;
//     }

//     const orders = await Order.find(filter)
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

// /* ================= GET WAITER ORDERS ================= */

// export const getWaiterOrders = async (req, res) => {
//   try {
//     const filter = {
//       restaurant: req.user.restaurant,
//       waiter: req.user.id,
//       status: { $in: ["PENDING", "ACCEPTED", "PREPARING", "READY"] },
//     };

//   const orders = await Order.find(filter)
//   .populate("table", "tableNumber")
//   .populate("waiter", "name")
//   .populate("chef", "name")   // ⭐ THIS LINE
//   .populate("items.menuItem", "name")
//   .sort({ createdAt: -1 });

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
//       .populate("items.menuItem", "name price");

//     if (!order) return sendError(res, "Order not found", 404);

//     return sendSuccess(res, order);
//   } catch (err) {
//     return sendError(res, err.message);
//   }
// };

// /* ================= ACCEPT ================= */

// export const acceptOrder = async (req, res) => {
//   try {
//     const order = await Order.findOne({
//       _id: req.params.id,
//       restaurant: req.user.restaurant,
//       status: "PENDING",
//     });

//     if (!order) return sendError(res, "Invalid order");

//     order.status = "ACCEPTED";
//     order.chef = req.user.id;
//     order.acceptedAt = new Date();

//     await order.save();
//     return sendSuccess(res, order);
//   } catch (err) {
//     return sendError(res, err.message);
//   }
// };

// /* ================= PREPARING ================= */

// export const markPreparing = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const order = await Order.findOne({
//       _id: req.params.id,
//       restaurant: req.user.restaurant,
//       status: "ACCEPTED",
//     })
//       .populate({
//         path: "items.menuItem",
//         populate: { path: "ingredients.item" },
//       })
//       .session(session);

//     if (!order)
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

// /* ================= READY ================= */

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

// /* ================= SERVED ================= */

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

// /* ================= PAID ================= */

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

/* 🔥 LOGGER */
import { logAction, logError } from "../utils/logger.js";

/* ================= HELPER ================= */

const sendSuccess = (res, data, status = 200) =>
  res.status(status).json({ success: true, data });

const sendError = (res, message, status = 400) =>
  res.status(status).json({ success: false, message });

const ACTIVE_ORDER_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "SERVED",
];

const normalizeCustomization = (value) =>
  Array.isArray(value)
    ? value
        .map((item) => String(item || "").trim())
        .filter(Boolean)
        .slice(0, 8)
    : [];

const getCustomizationKey = (value) =>
  normalizeCustomization(value)
    .map((item) => item.toLowerCase())
    .sort()
    .join("|");

const getItemsForInventoryDeduction = (order) => {
  const additionalItems = (order.items || []).filter((item) => item.isAdditional);
  return additionalItems.length > 0 ? additionalItems : order.items || [];
};

const getIngredientMultiplier = (ingredientName, customizations = []) => {
  const name = String(ingredientName || "").toLowerCase();
  if (!name) return 1;
  const singularName = name.endsWith("s") ? name.slice(0, -1) : name;

  const notes = normalizeCustomization(customizations).map((item) =>
    item.toLowerCase()
  );
  const mentionsIngredient = (note) =>
    note.includes(name) || note.includes(singularName);

  if (
    notes.some(
      (note) =>
        mentionsIngredient(note) &&
        /\b(no|without|remove|skip|less)\b/.test(note)
    )
  ) {
    return 0;
  }

  if (
    notes.some(
      (note) =>
        mentionsIngredient(note) &&
        /\b(extra|more|add|double)\b/.test(note)
    )
  ) {
    return 2;
  }

  return 1;
};

const populateOrderDetails = (query) =>
  query
    .populate("table", "tableNumber")
    .populate("waiter", "name")
    .populate("chef", "name")
    .populate("items.menuItem", "name price")
    .populate("tableChangeHistory.fromTable", "tableNumber")
    .populate("tableChangeHistory.toTable", "tableNumber")
    .populate("tableChangeHistory.changedBy", "name");

const syncTableStatusAfterMove = async ({
  restaurantId,
  oldTableId,
  newTableId,
  orderId,
}) => {
  if (newTableId) {
    await Table.findByIdAndUpdate(newTableId, { status: "occupied" });
  }

  if (!oldTableId || String(oldTableId) === String(newTableId)) return;

  const oldTableActiveOrders = await Order.countDocuments({
    _id: { $ne: orderId },
    restaurant: restaurantId,
    table: oldTableId,
    status: { $in: ACTIVE_ORDER_STATUSES },
  });

  if (oldTableActiveOrders === 0) {
    await Table.findByIdAndUpdate(oldTableId, { status: "available" });
  }
};

const deductInventoryForOrder = async (order, session) => {
  const itemsToDeduct = getItemsForInventoryDeduction(order);

  for (const item of itemsToDeduct) {
    if (!item.menuItem || !Array.isArray(item.menuItem.ingredients)) {
      throw new Error("Menu item ingredients not configured properly");
    }

    for (const ingredient of item.menuItem.ingredients) {
      const ingredientName = ingredient.item?.name || "";
      const multiplier = getIngredientMultiplier(
        ingredientName,
        item.customization
      );
      const requiredQty =
        Number(ingredient.quantity || 0) *
        Number(item.quantity || 0) *
        multiplier;

      if (!requiredQty) {
        continue;
      }

      const inventory = await Inventory.findById(ingredient.item?._id || ingredient.item).session(session);

      if (!inventory) {
        throw new Error("Inventory item not found");
      }

      if (inventory.quantity < requiredQty) {
        throw new Error(`Insufficient stock for ${inventory.name}`);
      }

      inventory.quantity -= requiredQty;
      await inventory.save({ session });
    }
  }
};

/* ================= CREATE ORDER ================= */

export const createOrder = async (req, res) => {
  try {
    const table = await Table.findById(req.body.table);
    if (!table) return sendError(res, "Table not found", 404);
    if (String(table.restaurant) !== String(req.user.restaurant)) {
      return sendError(res, "Table does not belong to this restaurant", 403);
    }

    const existingTableOrder = await Order.findOne({
      restaurant: req.user.restaurant,
      table: table._id,
      status: { $in: ACTIVE_ORDER_STATUSES },
    });

    if (existingTableOrder) {
      return sendError(res, "This table already has an active order");
    }

    const itemsWithPrice = [];

    for (const item of req.body.items) {
      const menu = await Menu.findById(item.menuItem);
      if (!menu || !menu.isAvailable)
        throw new Error("Menu item not available");

      itemsWithPrice.push({
        menuItem: menu._id,
        quantity: item.quantity,
        customization: normalizeCustomization(item.customization),
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

    /* ✅ LOG */
    await logAction({
      action: "ORDER_CREATED",
      userId: req.user.id,
      role: "WAITER",
      meta: { orderId: order._id },
    });

    return sendSuccess(res, order, 201);
  } catch (err) {
    await logError(err, "CREATE_ORDER");
    return sendError(res, err.message);
  }
};

/* ================= ADD ITEMS ================= */

export const addItemsToOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      restaurant: req.user.restaurant,
      waiter: req.user.id,
      status: { $ne: "PAID" },
    });

    if (!order)
      return sendError(res, "Active order not found", 404);

    const shouldRestartFlow = ["ACCEPTED", "PREPARING", "READY", "SERVED"].includes(order.status);
    const addedAt = new Date();

    for (const newItem of req.body.items) {
      const menu = await Menu.findById(newItem.menuItem);
      if (!menu || !menu.isAvailable)
        throw new Error("Menu item not available");

      if (shouldRestartFlow) {
        order.items.push({
          menuItem: menu._id,
          quantity: newItem.quantity,
          customization: normalizeCustomization(newItem.customization),
          price: menu.price,
          isAdditional: true,
          addedAt,
        });
      } else {
        const existingItem = order.items.find(
          (i) =>
            i.menuItem.toString() === newItem.menuItem.toString() &&
            getCustomizationKey(i.customization) ===
              getCustomizationKey(newItem.customization)
        );

        if (existingItem) {
          existingItem.quantity += newItem.quantity;
        } else {
          order.items.push({
            menuItem: menu._id,
            quantity: newItem.quantity,
            customization: normalizeCustomization(newItem.customization),
            price: menu.price,
          });
        }
      }
    }

    if (shouldRestartFlow) {
      order.status = "PENDING";
      order.chef = null;
      order.acceptedAt = undefined;
      order.preparingAt = undefined;
      order.readyAt = undefined;
      order.servedAt = undefined;

      await Bill.deleteMany({
        order: order._id,
        paymentStatus: "PENDING",
      });
    }

    await order.save();

    /* ✅ LOG */
    await logAction({
      action: "ORDER_UPDATED",
      userId: req.user.id,
      role: "WAITER",
      meta: { orderId: order._id },
    });

    return sendSuccess(res, order);
  } catch (err) {
    await logError(err, "ADD_ITEMS");
    return sendError(res, err.message);
  }
};

/* ================= GET ORDERS ================= */

export const getOrders = async (req, res) => {
  try {
    const orders = await populateOrderDetails(
      Order.find({
        restaurant: req.user.restaurant,
      }).sort({ createdAt: -1 })
    );

    return sendSuccess(res, orders);
  } catch (err) {
    await logError(err, "GET_ORDERS");
    return sendError(res, err.message);
  }
};

/* ================= GET CHEF ORDERS ================= */

export const getChefOrders = async (req, res) => {
  try {
    const { type } = req.query;

    const filter = {
      restaurant: req.user.restaurant,
    };

    if (type === "history") {
      filter.chef = req.user.id;
    } else if (type === "mine") {
      filter.chef = req.user.id;
      filter.status = { $in: ["ACCEPTED", "PREPARING", "READY"] };
    } else {
      filter.$or = [
        { status: "PENDING", chef: null },
        {
          chef: req.user.id,
          status: { $in: ["ACCEPTED", "PREPARING", "READY"] },
        },
      ];
    }

    const orders = await populateOrderDetails(
      Order.find(filter).sort({ createdAt: -1 })
    );

    return sendSuccess(res, orders);
  } catch (err) {
    await logError(err, "GET_CHEF_ORDERS");
    return sendError(res, err.message);
  }
};

/* ================= GET WAITER ORDERS ================= */

export const getWaiterOrders = async (req, res) => {
  try {
    const { type = "active" } = req.query;
    const filter = {
      restaurant: req.user.restaurant,
      waiter: req.user.id,
    };

    if (type === "history") {
      // Dashboard history should include completed and paid orders too.
    } else if (type === "all") {
      filter.status = { $ne: "PAID" };
    } else {
      filter.status = { $in: ["PENDING", "ACCEPTED", "PREPARING", "READY", "SERVED"] };
    }

    const orders = await populateOrderDetails(
      Order.find(filter).sort({ createdAt: -1 })
    );

    return sendSuccess(res, orders);
  } catch (err) {
    await logError(err, "GET_WAITER_ORDERS");
    return sendError(res, err.message);
  }
};

/* ================= GET ORDER BY ID ================= */

export const getOrderById = async (req, res) => {
  try {
    const order = await populateOrderDetails(
      Order.findOne({
        _id: req.params.id,
        restaurant: req.user.restaurant,
      })
    );

    if (!order) return sendError(res, "Order not found", 404);

    return sendSuccess(res, order);
  } catch (err) {
    await logError(err, "GET_ORDER_BY_ID");
    return sendError(res, err.message);
  }
};

/* ================= CHANGE TABLE ================= */

export const changeOrderTable = async (req, res) => {
  try {
    const { tableId } = req.body;
    if (!tableId) return sendError(res, "Select a table");

    const orderFilter = {
      _id: req.params.id,
      restaurant: req.user.restaurant,
      status: { $in: ACTIVE_ORDER_STATUSES },
    };

    if (req.user.role === "waiter") {
      orderFilter.waiter = req.user.id;
    }

    const [order, targetTable] = await Promise.all([
      Order.findOne(orderFilter),
      Table.findOne({
        _id: tableId,
        restaurant: req.user.restaurant,
      }),
    ]);

    if (!order) return sendError(res, "Active order not found", 404);
    if (!targetTable) return sendError(res, "Target table not found", 404);

    const oldTableId = order.table;
    if (oldTableId && String(oldTableId) === String(targetTable._id)) {
      const populatedOrder = await populateOrderDetails(Order.findById(order._id));
      return sendSuccess(res, populatedOrder);
    }

    const existingTargetOrder = await Order.findOne({
      _id: { $ne: order._id },
      restaurant: req.user.restaurant,
      table: targetTable._id,
      status: { $in: ACTIVE_ORDER_STATUSES },
    });

    if (existingTargetOrder) {
      return sendError(res, "Selected table already has an active order");
    }

    order.table = targetTable._id;
    order.orderType = "DINE_IN";
    order.tableChangeHistory.push({
      fromTable: oldTableId || null,
      toTable: targetTable._id,
      changedBy: req.user.id,
      changedByRole: req.user.role,
      changedAt: new Date(),
    });

    await order.save();
    await syncTableStatusAfterMove({
      restaurantId: req.user.restaurant,
      oldTableId,
      newTableId: targetTable._id,
      orderId: order._id,
    });

    await logAction({
      action: "ORDER_TABLE_CHANGED",
      userId: req.user.id,
      role: req.user.role?.toUpperCase(),
      meta: {
        orderId: order._id,
        fromTable: oldTableId,
        toTable: targetTable._id,
      },
    });

    const populatedOrder = await populateOrderDetails(Order.findById(order._id));
    return sendSuccess(res, populatedOrder);
  } catch (err) {
    await logError(err, "CHANGE_ORDER_TABLE");
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

    await logAction({
      action: "ORDER_ACCEPTED",
      userId: req.user.id,
      role: "CHEF",
      meta: { orderId: order._id },
    });

    return sendSuccess(res, order);
  } catch (err) {
    await logError(err, "ACCEPT_ORDER");
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

    await deductInventoryForOrder(order, session);

    order.status = "PREPARING";
    order.preparingAt = new Date();
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    await logAction({
      action: "ORDER_PREPARING",
      userId: req.user.id,
      role: "CHEF",
      meta: { orderId: order._id },
    });

    return sendSuccess(res, order);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    await logError(err, "MARK_PREPARING");
    return sendError(res, err.message);
  }
};

/* ================= READY ================= */

export const markReady = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findOne({
      _id: req.params.id,
      restaurant: req.user.restaurant,
      status: { $in: ["ACCEPTED", "PREPARING"] },
    })
      .populate({
        path: "items.menuItem",
        populate: { path: "ingredients.item" },
      })
      .session(session);

    if (!order) return sendError(res, "Order must be accepted before marking ready", 404);

    // The current chef UI moves ACCEPTED -> READY directly, so deduct stock here
    // if the PREPARING step was skipped. Updated orders only deduct new items.
    if (order.status === "ACCEPTED" && !order.preparingAt) {
      await deductInventoryForOrder(order, session);
      order.preparingAt = new Date();
    }

    order.status = "READY";
    order.readyAt = new Date();
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    await logAction({
      action: "ORDER_READY",
      userId: req.user.id,
      role: "CHEF",
      meta: { orderId: order._id },
    });

    return sendSuccess(res, order);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();

    await logError(err, "MARK_READY");
    return sendError(res, err.message);
  }
};

/* ================= SERVED ================= */

export const markServed = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      restaurant: req.user.restaurant,
      waiter: req.user.id,
      status: "READY",
    });

    if (!order) return sendError(res, "Order must be ready before serving", 404);

    order.status = "SERVED";
    order.servedAt = new Date();
    order.items.forEach((item) => {
      item.isAdditional = false;
      item.addedAt = null;
    });
    await order.save();

    const itemsTotal = order.items.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );

    const existingBill = await Bill.findOne({ order: order._id });

    if (!existingBill) {
      const cgstRate = 2.5;
      const sgstRate = 2.5;
      const cgst = Math.round(itemsTotal * (cgstRate / 100));
      const sgst = Math.round(itemsTotal * (sgstRate / 100));

      await Bill.create({
        restaurant: order.restaurant,
        order: order._id,
        table: order.table,
        itemsTotal,
        cgst,
        cgstRate,
        sgst,
        sgstRate,
        discount: 0,
        totalAmount:
          itemsTotal + cgst + sgst,
        paymentStatus: "PENDING",
      });
    }

    await logAction({
      action: "ORDER_SERVED",
      userId: req.user.id,
      role: "WAITER",
      meta: { orderId: order._id },
    });

    return sendSuccess(res, order);
  } catch (err) {
    await logError(err, "MARK_SERVED");
    return sendError(res, err.message);
  }
};

/* ================= PAID ================= */

export const markPaid = async (req, res) => {
  try {
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

    await logAction({
      action: "ORDER_PAID",
      userId: req.user.id,
      role: "WAITER",
      meta: { orderId: order._id },
    });

    return sendSuccess(res, order);
  } catch (err) {
    await logError(err, "MARK_PAID");
    return sendError(res, err.message);
  }
};
