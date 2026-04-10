import mongoose from "mongoose";

/* ===============================
   INVENTORY SCHEMA
=============================== */
const inventorySchema = new mongoose.Schema(
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

    unit: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    category: {
      type: String,
      trim: true,
      default: "",
    },

    // 🔥 Low stock alert threshold
    lowStockThreshold: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
  },
  { timestamps: true }
);

/* ===============================
   INDEXES
=============================== */

// Prevent duplicate inventory name per restaurant
inventorySchema.index(
  { restaurant: 1, name: 1 },
  { unique: true }
);

// Faster restaurant inventory queries
inventorySchema.index({ restaurant: 1, quantity: 1 });

/* ===============================
   VIRTUAL FIELD (Low Stock Check)
=============================== */
inventorySchema.virtual("isLowStock").get(function () {
  return this.quantity <= this.lowStockThreshold;
});

/* ===============================
   EXPORT
=============================== */
export default mongoose.model("Inventory", inventorySchema);
