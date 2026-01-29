// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");

// const accountantSchema = new mongoose.Schema(
//   {
//     fullName: { type: String, required: true, trim: true },   // employee full name
//     email: { type: String, required: true, unique: true, lowercase: true }, // unique email
//     mobile: { type: String, required: true },                 // phone number
//     restaurantName: { type: String, required: false },         // linked restaurant name
//     role: { type: String, required: true },                   // Manager, Server, Cleaner, etc.
//     accountantId: { type: String, unique: true, required: true }, // system ID (unique)
//     password: { type: String, required: true },               // login password (hashed)
//   },
//   { timestamps: true }
// );

// // Encrypt password before saving
// accountantSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// // Match password
// accountantSchema.methods.matchPassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// module.exports = mongoose.model("Accountant", accountantSchema);
