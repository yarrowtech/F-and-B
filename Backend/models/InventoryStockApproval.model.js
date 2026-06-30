import mongoose from "mongoose";

const inventoryStockApprovalSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
      index: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    mode: {
      type: String,
      enum: ["ADD", "SET"],
      required: true,
    },
    requestedQuantity: {
      type: Number,
      required: true,
    },
    effectiveDate: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
      index: true,
    },
    itemName: {
      type: String,
      default: "",
    },
    unit: {
      type: String,
      default: "",
    },
    currentQuantityAtRequest: {
      type: Number,
      default: 0,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    requestedByName: {
      type: String,
      default: "",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    approvedByName: {
      type: String,
      default: "",
    },
    reviewedAt: Date,
    rejectionReason: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

inventoryStockApprovalSchema.index({ restaurant: 1, status: 1, createdAt: -1 });

export default mongoose.model("InventoryStockApproval", inventoryStockApprovalSchema);
