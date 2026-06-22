
// import mongoose from "mongoose";

// const menuSchema = new mongoose.Schema(
//   {
//     restaurant: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Restaurant",
//       required: true,
//       index: true, // 🔥 performance optimization
//     },

//     name: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     price: {
//       type: Number,
//       required: true,
//       min: 0,
//     },

//     category: {
//       type: String,
//       required: true,
//       trim: true,
//     },

//     isAvailable: {
//       type: Boolean,
//       default: true,
//     },
//   },
//   { timestamps: true }
// );

// /* 🔥 Prevent duplicate menu name per restaurant */
// menuSchema.index(
//   { restaurant: 1, name: 1 },
//   { unique: true }
// );

// export default mongoose.model("Menu", menuSchema);




import mongoose from "mongoose";

/* ===============================
   INGREDIENT SCHEMA
   (Used for inventory deduction)
=============================== */
const ingredientSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
    },

    quantity: {
      type: Number, // quantity required per 1 unit (plate)
      required: true,
      min: 0,
    },
  },
  { _id: false } // Prevent extra _id inside ingredients
);

/* ===============================
   MENU SCHEMA
=============================== */
const menuSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    menuCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 20,
      match: /^[A-Z0-9]+$/,
    },

    // 🔥 Cuisine Type (Indian, Chinese, etc.)
    cuisine: {
      type: String,
      required: true,
      trim: true,
    },

    // 🔥 Course Type (Starter, Main Course, Dessert, etc.)
    courseType: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    // 🔥 Ingredient mapping for stock deduction
    ingredients: {
      type: [ingredientSchema],
      default: [],
    },
  },
  { timestamps: true }
);

/* ===============================
   INDEXES (Performance + Safety)
=============================== */

// Prevent duplicate menu name per restaurant
menuSchema.index(
  { restaurant: 1, name: 1 },
  { unique: true }
);

// Prevent duplicate menu code per restaurant
menuSchema.index(
  { restaurant: 1, menuCode: 1 },
  { unique: true }
);

// Faster filtering by cuisine
menuSchema.index({ restaurant: 1, cuisine: 1 });

// Faster filtering by course type
menuSchema.index({ restaurant: 1, courseType: 1 });

/* ===============================
   EXPORT
=============================== */
export default mongoose.model("Menu", menuSchema);
