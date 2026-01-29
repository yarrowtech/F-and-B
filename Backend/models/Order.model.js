
// const mongoose = require("mongoose");

// const lineItemSchema = new mongoose.Schema({
//   menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "Menu", required: true },
//   quantity: { type: Number, default: 1, min: 1 },
// });

// const orderSchema = new mongoose.Schema(
//   {
//     // table: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
//     table: { type: Number, required: true },
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

// // Reuse existing model if already compiled (prevents OverwriteModelError)
// const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

// module.exports = Order;










import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Menu",
    required: true,
  },

  quantity: {
    type: Number,
    required: true,
    min: 1,
  },

  customization: {
    type: [String], // ["extra chili", "no onion"]
    default: [],
  },
});

const orderSchema = new mongoose.Schema(
  {
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: true,
    },

    waiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    chef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },

    items: {
      type: [orderItemSchema],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "PLACED",
        "ACCEPTED",
        "PREPARING",
        "READY",
        "SERVED",
        "BILLED",
        "PAID",
      ],
      default: "PLACED",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
