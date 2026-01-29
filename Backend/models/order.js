// const mongoose = require("mongoose");

// const orderSchema = new mongoose.Schema({
//   table: { type: Number, required: true },
//   items: [String], // e.g. ["Paneer Butter Masala", "Mojito"]
//   itemsDetail: [
//     {
//       name: String,
//       price: Number,
//       quantity: Number,
//       customization: String,
//     },
//   ],
//   category: [String], // e.g. ["indian", "beverages"]
//   totalPrice: Number,
//   status: { type: String, default: "pending" }, // pending, preparing, ready, delayed, served
//   served: { type: Boolean, default: false },
//   customizations: { type: Object }, // { "Paneer Butter Masala": ["Extra Paneer"] }
//   createdAt: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model("Order", orderSchema);





// // models/order.js
// const mongoose = require("mongoose");

// const orderSchema = new mongoose.Schema({
//   table: { type: Number, required: true },
//   items: [String],
//   itemsDetail: [
//     {
//       name: String,
//       price: Number,
//       quantity: Number,
//       customization: String,
//     },
//   ],
//   category: [String],
//   totalPrice: Number,

//   // ✅ All-lowercase statuses; auto-lowercase incoming values
//   status: {
//     type: String,
//     enum: ["pending", "preparing", "ready", "delayed", "served"],
//     lowercase: true,              // converts "Ready" → "ready" before validating
//     default: "pending",
//   },

//   served: { type: Boolean, default: false },
//   customizations: { type: Object },
//   createdAt: { type: Date, default: Date.now },
// });

// module.exports = mongoose.model("Order", orderSchema);



// const mongoose = require("mongoose");

// const orderSchema = new mongoose.Schema(
//   {
//     table: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Table",
//       required: true,
//     },
//     items: [
//       {
//         menuItem: {
//           type: mongoose.Schema.Types.ObjectId,
//           ref: "Menu",
//           required: true,
//         },
//         quantity: { type: Number, required: true, min: 1 },
//       },
//     ],
//     status: {
//       type: String,
//       enum: ["pending", "preparing", "ready", "served", "cancelled"],
//       default: "pending",
//     },
//     totalAmount: { type: Number, required: true },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Order", orderSchema);





// import mongoose from "mongoose";

// const ItemSchema = new mongoose.Schema(
//   {
//     menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
//     name: { type: String, required: true },        // denormalized for snapshot
//     category: { type: String },                    // denormalized
//     price: { type: Number, required: true },
//     qty: { type: Number, default: 1, min: 1 },
//     customization: { type: String, default: "" }
//   },
//   { _id: false }
// );

// const TotalsSchema = new mongoose.Schema(
//   {
//     baseAmount: { type: Number, default: 0 },
//     discount: { type: Number, default: 0 },
//     tip: { type: Number, default: 0 },
//     taxPct: { type: Number, default: 0 },
//     taxAmt: { type: Number, default: 0 },
//     payable: { type: Number, default: 0 }
//   },
//   { _id: false }
// );

// const BillSchema = new mongoose.Schema(
//   {
//     generatedAt: Date,
//     notes: String,
//     paymentMethod: { type: String, default: "UPI" },
//     totals: { type: TotalsSchema, default: {} }
//   },
//   { _id: false }
// );

// const PaymentSchema = new mongoose.Schema(
//   {
//     status: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
//     paidAt: Date,
//     method: { type: String, default: "UPI" }
//   },
//   { _id: false }
// );

// const OrderSchema = new mongoose.Schema(
//   {
//     tableNo: { type: Number, required: true },
//     items: { type: [ItemSchema], default: [] },
//     status: {
//       type: String,
//       enum: ["pending", "preparing", "delayed", "ready", "served", "closed"],
//       default: "pending"
//     },
//     served: { type: Boolean, default: false },
//     closed: { type: Boolean, default: false },

//     // Lifecycle adjuncts
//     billed: {
//       sent: { type: Boolean, default: false },
//       bill: { type: BillSchema, default: null }
//     },
//     payment: { type: PaymentSchema, default: {} },

//     // Denormalized quick lookups
//     categories: { type: [String], default: [] },
//     totalPrice: { type: Number, default: 0 } // base amount snapshot (sum price*qty)
//   },
//   { timestamps: true }
// );

// OrderSchema.index({ tableNo: 1, closed: 1 });
// OrderSchema.index({ status: 1, served: 1 });

// export default mongoose.model("Order", OrderSchema);







// const mongoose = require("mongoose");

// const lineItemSchema = new mongoose.Schema({
//   menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "Menu", required: true },
//   quantity: { type: Number, default: 1, min: 1 },
// });

// const orderSchema = new mongoose.Schema(
//   {
//     table: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
//     items: { type: [lineItemSchema], default: [] },
//     status: {
//       type: String,
//       enum: ["pending", "preparing", "ready", "served", "closed", "delayed"],
//       default: "pending",
//     },
//     totalAmount: { type: Number, default: 0 },
//     notes: { type: String, default: "" },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("order", orderSchema);













// models/Order.js
const mongoose = require("mongoose");

const lineItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "Menu", required: true },
  quantity: { type: Number, default: 1, min: 1 },
});

const orderSchema = new mongoose.Schema(
  {
    // table: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
    table: { type: Number, required: true },
    items: { type: [lineItemSchema], default: [] },
    status: {
      type: String,
      enum: ["pending", "preparing", "ready", "served", "closed", "delayed"],
      default: "pending",
    },
    totalAmount: { type: Number, default: 0 },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

// Reuse existing model if already compiled (prevents OverwriteModelError)
const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

module.exports = Order;

