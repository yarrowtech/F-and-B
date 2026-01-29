


// // const mongoose = require("mongoose");
// // const bcrypt = require("bcryptjs");

// // const managerSchema = new mongoose.Schema({
// //   managerId: { type: String, required: true, unique: true }, // unique login ID
// //   fullName: { type: String, required: true },
// //   email: { type: String, required: true, unique: true },
// //   password: { type: String, required: true },
// //   restaurantName: { type: String, required: true },
// // });

// // // hash password before save
// // managerSchema.pre("save", async function (next) {
// //   if (!this.isModified("password")) return next();
// //   this.password = await bcrypt.hash(this.password, 10);
// //   next();
// // });

// // module.exports = mongoose.model("Manager", managerSchema);


// // const mongoose = require("mongoose");
// // const bcrypt = require("bcryptjs");

// // const managerSchema = new mongoose.Schema({
// //   managerId: { type: String, required: true, unique: true },
// //   fullName: { type: String, required: true },
// //   email: { type: String, required: true, unique: true },
// //   password: { type: String, required: true },
// //   restaurantName: { type: String, required: true },
// //   createdByAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" }
// // });

// // managerSchema.pre("save", async function (next) {
// //   if (!this.isModified("password")) return next();
// //   this.password = await bcrypt.hash(this.password, 10);
// //   next();
// // });

// // module.exports = mongoose.model("Manager", managerSchema);

// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");

// const managerSchema = new mongoose.Schema(
//   {
//     fullName: { type: String, required: true, trim: true },   // employee full name
//     email: { type: String, required: true, unique: true, lowercase: true }, // unique email
//     mobile: { type: String, required: true },                 // phone number
//     restaurantName: { type: String, required: false },         // linked restaurant name
//     role: { type: String, required: true },                   // Manager, Server, Cleaner, etc.
//     managerId: { type: String, unique: true, required: true }, // system ID (unique)
//     password: { type: String, required: true },               // login password (hashed)
//   },
//   { timestamps: true }
// );

// // Encrypt password before saving
// managerSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// // Match password
// managerSchema.methods.matchPassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// module.exports = mongoose.model("Manager", managerSchema);
