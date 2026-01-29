
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
    employeeId: {
      type: String,
      required: true,
      unique: true, // ADMNRESTWA0001
    },

    name: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["ADMIN", "MANAGER", "WAITER", "CHEF", "ACCOUNTANT"],
      required: true,
    },

    password: {
      type: String,
      required: true,
    },

    phone: String,
    email: String,

    isActive: {
      type: Boolean,
      default: true,
    },

    stats: {
      ordersTaken: { type: Number, default: 0 },      // waiter
      ordersPrepared: { type: Number, default: 0 },   // chef
      billsGenerated: { type: Number, default: 0 },   // accountant
    },
  },
  { timestamps: true }
);

export default mongoose.model("Employee", employeeSchema);
