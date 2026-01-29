// // // const mongoose = require("mongoose");
// // // const bcrypt = require("bcryptjs");

// // // const employeeSchema = new mongoose.Schema({
// // //   role: { type: String, required: true },
// // //   employeeId: { type: String, unique: true, required: true },
// // //   password: { type: String, required: true }
// // // });

// // // // Encrypt password before saving
// // // employeeSchema.pre("save", async function (next) {
// // //   if (!this.isModified("password")) return next();
// // //   const salt = await bcrypt.genSalt(10);
// // //   this.password = await bcrypt.hash(this.password, salt);
// // //   next();
// // // });

// // // // Match password
// // // employeeSchema.methods.matchPassword = async function (enteredPassword) {
// // //   return await bcrypt.compare(enteredPassword, this.password);
// // // };

// // // module.exports = mongoose.model("Employee", employeeSchema);

// // // const mongoose = require("mongoose");
// // // const bcrypt = require("bcryptjs");

// // // const employeeSchema = new mongoose.Schema(
// // //   {
// // //     fullName: { type: String, required: true, trim: true },   // employee full name
// // //     email: { type: String, required: true, unique: true, lowercase: true }, // unique email
// // //     mobile: { type: String, required: true },                 // phone number
// // //     restaurantName: { type: String, required: false },         // linked restaurant name
// // //     role: { type: String, required: true },                   // Manager, Server, Cleaner, etc.
// // //     employeeId: { type: String, unique: true, required: true }, // system ID (unique)
// // //     password: { type: String, required: true },               // login password (hashed)
// // //   },
// // //   { timestamps: true }
// // // );

// // // // Encrypt password before saving
// // // employeeSchema.pre("save", async function (next) {
// // //   if (!this.isModified("password")) return next();
// // //   const salt = await bcrypt.genSalt(10);
// // //   this.password = await bcrypt.hash(this.password, salt);
// // //   next();
// // // });

// // // // Match password
// // // employeeSchema.methods.matchPassword = async function (enteredPassword) {
// // //   return await bcrypt.compare(enteredPassword, this.password);
// // // };

// // // module.exports = mongoose.model("Employee", employeeSchema);




// // models/employee.js
// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");

// // Employee Schema
// const employeeSchema = new mongoose.Schema(
//   {
//     fullName: { type: String, required: true },
//     employeeId: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     role: {
//       type: String,
//       enum: [
//         "Manager",
//         "Chief",
//         "Sub-Chief",
//         "Server",
//         "Inventory Manager",
//         "Cleaner",
//         "Accountant",
//       ],
//       required: true,
//     },
//     restaurantName: { type: String, required: true },
//     email: { type: String, required: true, unique: true },
//     mobile: { type: String, required: true },
//     attendance: {
//       type: String,
//       enum: ["Present", "Absent", "Leave"],
//       default: "Leave",
//     },
//   },
//   { timestamps: true }
// );

// // Hash password before saving
// employeeSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   this.password = await bcrypt.hash(this.password, 10);
//   next();
// });

// // Compare password for login
// employeeSchema.methods.matchPassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// module.exports = mongoose.model("Employee", employeeSchema);






// // const mongoose = require("mongoose");
// // const bcrypt = require("bcryptjs");

// // const employeeSchema = new mongoose.Schema(
// //   {
// //     fullName: { type: String, required: true },
// //     employeeId: { type: String, unique: true }, // no longer "required: true"
// //     password: { type: String, required: true },
// //     role: {
// //       type: String,
// //       enum: [
// //         "Manager",
// //         "Chief",
// //         "Sub-Chief",
// //         "Server",
// //         "Inventory Manager",
// //         "Cleaner",
// //         "Accountant",
// //       ],
// //       required: true,
// //     },
// //     restaurantName: { type: String, required: true },
// //     email: { type: String, required: true, unique: true },
// //     mobile: { type: String, required: true },
// //     attendance: {
// //       type: String,
// //       enum: ["Present", "Absent", "Leave"],
// //       default: "Leave",
// //     },
// //   },
// //   { timestamps: true }
// // );

// // // 🔑 Auto-generate employeeId
// // employeeSchema.pre("save", async function (next) {
// //   if (!this.employeeId) {
// //     const lastEmployee = await mongoose.model("Employee").findOne().sort({ _id: -1 });
// //     if (lastEmployee && lastEmployee.employeeId) {
// //       const lastNumber = parseInt(lastEmployee.employeeId.replace("EMP", ""), 10);
// //       this.employeeId = "EMP" + String(lastNumber + 1).padStart(3, "0");
// //     } else {
// //       this.employeeId = "EMP001"; // first employee
// //     }
// //   }

// //   // hash password if modified
// //   if (this.isModified("password")) {
// //     this.password = await bcrypt.hash(this.password, 10);
// //   }

// //   next();
// // });

// // // Compare password
// // employeeSchema.methods.matchPassword = async function (enteredPassword) {
// //   return await bcrypt.compare(enteredPassword, this.password);
// // };

// // module.exports = mongoose.model("Employee", employeeSchema);
// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");

// // ===============================
// // Employee Schema
// // ===============================
// const employeeSchema = new mongoose.Schema(
//   {
//     fullName: { type: String, required: true },
//     employeeId: { type: String, required: true, unique: true },
//     email: { type: String, required: true, unique: true, lowercase: true },
//     password: { type: String, required: true },
//     role: {
//       type: String,
//       enum: [
//         "Admin",
//         "Manager",
//         "Chief",
//         "SubChief",
//         "Waiter",
//         "InventoryManager",
//         "Accountant",
//         "Cleaner",
//       ],
//       default: "Waiter",
//     },
//   },
//   { timestamps: true }
// );

// ===============================
// Password Hashing Middleware
// ===============================
// employeeSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// // ===============================
// // Match Password
// // ===============================
// employeeSchema.methods.matchPassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// module.exports = mongoose.model("Employee", employeeSchema);




// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const employeeSchema = new mongoose.Schema({
//   fullName: { type: String, required: true },
//   employeeId: { type: String, required: true, unique: true },
//   email: { type: String, required: false, unique: true, sparse: true, lowercase: true },
//   password: { type: String, required: true },
//   role: { type: String, enum: ['Admin','Manager','Chief','Sub-Chief','Server','Cleaner','Inventory Manager','Accountant'], required: true },
//   restaurantName: { type: String, required: true }
// }, { timestamps: true });

// employeeSchema.pre('save', async function(next){
//   if(!this.isModified('password')) return next();
//   this.password = await bcrypt.hash(this.password, 10);
//   next();
// });

// employeeSchema.methods.matchPassword = function(entered){
//   return bcrypt.compare(entered, this.password);
// };

// module.exports = require('mongoose').model('Employee', employeeSchema);


// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");

// const employeeSchema = new mongoose.Schema(
//   {
//     fullName: { type: String, required: true },
//     employeeId: { type: String, required: true, unique: true },
//     password: { type: String, required: true },
//     role: {
//       type: String,
//       enum: [
//         "Manager",
//         "Chief",
//         "SuChief",
//         "Waiter",
//         "Cleaner",
//         "Inventory Manager",
//         "Accountant",
//       ],
//       required: true,
//     },
//   },
//   { timestamps: true }
// );

// // Password hashing
// employeeSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// module.exports = mongoose.model("Employee", employeeSchema);


const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const employeeSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  employeeId: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  restaurantName: { type: String, required: true },
  email: { type: String },
  mobile: { type: String },
});

// Hash password before save
employeeSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password method
employeeSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Employee", employeeSchema);