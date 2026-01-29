// // const express = require("express");
// // const {
// //   getOrders,
// //   createOrder,
// //   updateOrder,
// //   deleteOrder,
// // } = require("../controllers/order.Controller");
// // const router = express.Router();

// // router.get("/", getOrders);
// // router.post("/", createOrder);
// // router.put("/:id", updateOrder);
// // router.delete("/:id", deleteOrder);

// // module.exports = router;



// // routes/orderRoutes.js
// const express = require("express");
// const router = express.Router();
// const Order = require("../models/order");
// const nextStatuses = require("../utils/statusFlow");

// // PUT /api/orders/:id
// router.put("/:id", async (req, res) => {
//   try {
//     const { status } = req.body;
//     const order = await Order.findById(req.params.id);

//     if (!order) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     // ✅ Validate allowed transition
//     if (!nextStatuses[order.status].includes(status)) {
//       return res.status(400).json({
//         message: `Invalid status change: ${order.status} → ${status}`,
//       });
//     }

//     order.status = status;
//     const updatedOrder = await order.save();

//     res.json(updatedOrder);
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// });

// module.exports = router;




// // routes/orderRoutes.js
// const express = require("express");
// const router = express.Router();
// const Order = require("../models/order");
// const nextStatuses = require("../utils/statusFlow");

// // GET all orders
// router.get("/", async (req, res) => {
//   try {
//     const orders = await Order.find();
//     res.json(orders);
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // POST create new order
// router.post("/", async (req, res) => {
//   try {
//     const order = new Order(req.body);
//     const savedOrder = await order.save();
//     res.status(201).json(savedOrder);
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // PUT update order
// router.put("/:id", async (req, res) => {
//   try {
//     const { status } = req.body;
//     const order = await Order.findById(req.params.id);

//     if (!order) return res.status(404).json({ message: "Order not found" });

//     // Optional: Validate allowed transition
//     if (status && nextStatuses[order.status] && !nextStatuses[order.status].includes(status)) {
//       return res.status(400).json({ message: `Invalid status change: ${order.status} → ${status}` });
//     }

//     Object.assign(order, req.body);
//     const updatedOrder = await order.save();
//     res.json(updatedOrder);
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // DELETE order
// router.delete("/:id", async (req, res) => {
//   try {
//     const order = await Order.findByIdAndDelete(req.params.id);
//     if (!order) return res.status(404).json({ message: "Order not found" });
//     res.json({ message: "Order deleted successfully" });
//   } catch (err) {
//     res.status(500).json({ message: "Server error" });
//   }
// });

// module.exports = router;





// const express = require("express");
// const router = express.Router();
// const {
//   getOrders,
//   createOrder,
//   updateOrder,
//   deleteOrder,
// } = require("../controllers/order.Controller");

// // Routes
// router.get("/", getOrders);
// router.post("/", createOrder);
// router.put("/:id", updateOrder);
// router.delete("/:id", deleteOrder);

// module.exports = router;




// const express = require("express");
// const router = express.Router();
// const {
//   getOrders,
//   createOrder,
//   updateOrder,
//   deleteOrder,
// } = require("../controllers/order.Controller");

// // List + create
// router.get("/", getOrders);
// router.post("/", createOrder);

// // Update (support PATCH because the frontend uses PATCH)
// router.patch("/:id", updateOrder);   // ✅ ADD THIS
// router.put("/:id", updateOrder);     // keep if you also call PUT elsewhere

// // Delete
// router.delete("/:id", deleteOrder);

// module.exports = router;





const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.Controller");

router.get("/", orderController.getOrders);
router.post("/", orderController.createOrder);
router.put("/:id", orderController.updateOrder);
router.patch("/:id", orderController.updateOrder);
router.delete("/:id", orderController.deleteOrder);

module.exports = router;
