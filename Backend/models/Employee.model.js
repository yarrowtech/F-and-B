
// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");

// const employeeSchema = new mongoose.Schema({
//   fullName: { type: String, required: true },
//   employeeId: { type: String, unique: true, required: true },
//   password: { type: String, required: true },
//   role: { type: String, required: true },
//   restaurantName: { type: String, required: true },
//   email: { type: String },
//   mobile: { type: String },
// });

// // Hash password before save
// employeeSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   this.password = await bcrypt.hash(this.password, 10);
//   next();
// });

// // Compare password method
// employeeSchema.methods.matchPassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// module.exports = mongoose.model("Employee", employeeSchema);

















import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    /* =========================
       EMPLOYEE ID
       Format: AAAA-RR-0001
    ========================= */
    employeeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    /* =========================
       BASIC INFO
    ========================= */
    name: {
      type: String,
      required: true,
      trim: true,
    },

    role: {
      type: String,
      required: true,
      enum: [
        "MANAGER",
        "INVENTORY_MANAGER",
        "CHEF",
        "SUCHEF",
        "WAITER",
        "CLEANER",
        "ACCOUNTANT",
      ],
    },

    password: {
      type: String,
      required: true,
      select: false, // 🔒 never return password
    },

    phone: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    /* =========================
       STATUS
    ========================= */
    isActive: {
      type: Boolean,
      default: true,
    },

    /* =========================
       PERFORMANCE STATS
    ========================= */
    stats: {
      ordersTaken: { type: Number, default: 0 },     // waiter
      ordersPrepared: { type: Number, default: 0 },  // chef
      billsGenerated: { type: Number, default: 0 },  // accountant
    },

    /* =========================
       RELATION
    ========================= */
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Employee", employeeSchema);
