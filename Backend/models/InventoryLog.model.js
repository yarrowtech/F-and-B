import mongoose from "mongoose";

const inventoryLogSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
    },

    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },

    quantityAdded: Number,

    previousQuantity: {
      type: Number,
      default: 0,
    },

    newQuantity: {
      type: Number,
      default: 0,
    },

    unit: String,

    unitCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalCost: {
      type: Number,
      default: 0,
    },

    previousAverageCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    newAverageCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    reason: {
      type: String,
      trim: true,
      default: "",
    },

    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },

    addedByName: {
      type: String,
      default: "",
    },

    action: {
      type: String,
      enum: ["ADD", "UPDATE", "DELETE", "CONSUME"],
      default: "ADD",
    },

    effectiveDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("InventoryLog", inventoryLogSchema);
