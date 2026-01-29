










// const mongoose = require("mongoose");

// const menuSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true, trim: true, unique: true },
//     category: { type: String, required: true }, // e.g., Indian, Chinese, Beverages
//     price: { type: Number, required: true },
//     description: { type: String, default: "" },
//     available: { type: Boolean, default: true },
//     bestSeller: { type: Boolean, default: false },
//   },
//   { timestamps: true }
// );

// const Menu = mongoose.model("Menu", menuSchema);

// module.exports = Menu;






import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    category: {
      type: String, // Starter, Main Course, Drinks
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Menu", menuItemSchema);

