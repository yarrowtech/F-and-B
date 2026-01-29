// const mongoose = require("mongoose");

// const menuItemSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   category: { type: String, required: true }, // e.g. "indian"
//   price: { type: Number, required: true },
// });

// module.exports = mongoose.model("MenuItem", menuItemSchema);






// const mongoose = require("mongoose");

// const menuSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true },
//     category: {
//       type: String,
//       enum: ["indian", "chinese", "italian", "beverages", "dessert"],
//       required: true,
//     },
//     price: { type: Number, required: true },
//     availability: { type: Boolean, default: true },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Menu", menuSchema);



// const mongoose = require("mongoose");

// const menuSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   price: { type: Number, required: true },
//   category: { type: String, required: true },
//   bestSeller: { type: Boolean, default: false },
// }, { timestamps: true });

// module.exports = mongoose.model("Menu", menuSchema);












// models/Menu.js
// models/Menu.js
const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    category: { type: String, required: true }, // e.g., Indian, Chinese, Beverages
    price: { type: Number, required: true },
    description: { type: String, default: "" },
    available: { type: Boolean, default: true },
    bestSeller: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Menu = mongoose.model("Menu", menuSchema);

module.exports = Menu;
