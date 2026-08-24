import mongoose from "mongoose";

const inventoryStockTransferSchema = new mongoose.Schema(
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

    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KitchenSection",
      required: true,
    },

    // ISSUE = warehouse -> section, RETURN = section -> warehouse
    direction: {
      type: String,
      enum: ["ISSUE", "RETURN"],
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    reason: {
      type: String,
      default: "",
      trim: true,
    },

    transferredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },

    transferredByName: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

inventoryStockTransferSchema.index({ restaurant: 1, item: 1, createdAt: -1 });
inventoryStockTransferSchema.index({ restaurant: 1, section: 1, createdAt: -1 });

export default mongoose.model("InventoryStockTransfer", inventoryStockTransferSchema);
