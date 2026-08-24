import mongoose from "mongoose";

/* ===============================
   PER-LOCATION STOCK SCHEMA
   One row per (item, location). "WAREHOUSE" is the single central
   store per restaurant; "SECTION" rows track stock issued to a
   specific KitchenSection (kitchen department).
=============================== */
const inventoryStockSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },

    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
      index: true,
    },

    locationType: {
      type: String,
      enum: ["WAREHOUSE", "SECTION"],
      required: true,
    },

    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KitchenSection",
      default: null,
    },

    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

inventoryStockSchema.index(
  { restaurant: 1, item: 1, locationType: 1, section: 1 },
  { unique: true }
);

export default mongoose.model("InventoryStock", inventoryStockSchema);
