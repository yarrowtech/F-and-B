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

    unit: String,

    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
    },

    action: {
      type: String,
      enum: ["ADD", "UPDATE", "DELETE"],
      default: "ADD",
    },
  },
  { timestamps: true }
);

export default mongoose.model("InventoryLog", inventoryLogSchema);