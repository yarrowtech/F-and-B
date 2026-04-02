// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");

// const superAdminSchema = new mongoose.Schema({
//   email: {
//     type: String,
//     required: true,
//     unique: true,
//     default: "superadmin@fnb.com", // default email
//   },
//   password: {
//     type: String,
//     required: true,
//     default: "Super@123", // default password
//   },
// });

// // hash password before saving
// superAdminSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// // method to compare password
// superAdminSchema.methods.matchPassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// const SuperAdmin = mongoose.model("SuperAdmin", superAdminSchema);
// module.exports = SuperAdmin;




import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const superAdminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "super_admin",
    },

    // 🔐 Reset password fields
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

// 🔐 Hash password
superAdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// 🔐 Compare password
superAdminSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("SuperAdmin", superAdminSchema);