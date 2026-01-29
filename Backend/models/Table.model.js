
// const mongoose = require("mongoose");

// const tableSchema = new mongoose.Schema(
//   {
//     number: { type: Number, required: true, unique: true }, // e.g., 1..20
//     capacity: { type: Number, default: 4 },
//     status: {
//       type: String,
//       enum: ["free", "occupied", "preparing", "ready", "delayed"],
//       default: "free",
//     },
//     notes: { type: String, default: "" },
//   },
//   { timestamps: true }
// );

// const Table = mongoose.models.Table || mongoose.model("Table", tableSchema);
// module.exports = Table;






import mongoose from "mongoose";

const tableSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: Number,
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ["FREE", "OCCUPIED"],
      default: "FREE",
    },

    activeOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Table", tableSchema);
