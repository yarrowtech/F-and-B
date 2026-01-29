
// const mongoose = require("mongoose");

// const billSchema = new mongoose.Schema(
//   {
//     order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
//     amount: { type: Number, required: true },      // subtotal before tax+tip
//     tax: { type: Number, default: 0 },
//     tip: { type: Number, default: 0 },
//     discount: { type: Number, default: 0 },
//     totalAmount: { type: Number, required: true }, // final amount (amount + tax + tip - discount)
//     paid: { type: Boolean, default: false },
//     paymentMethod: { type: String, enum: ["cash", "card", "upi", "other"], default: "cash" },
//     paidAt: { type: Date },
//     note: { type: String, default: "" },
//   },
//   { timestamps: true }
// );

// const Bill = mongoose.model("Bill", billSchema);
// module.exports = Bill;



import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      unique: true,
    },

    accountant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    itemsTotal: {
      type: Number,
      required: true,
    },

    taxAmount: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ["CASH", "UPI", "CARD"],
    },

    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Bill", billSchema);
