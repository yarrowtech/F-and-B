import mongoose from "mongoose";

const vendorStockLogSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VendorProduct",
      required: true,
      index: true,
    },

    productName: {
      type: String,
      trim: true,
      default: "",
    },

    type: {
      type: String,
      enum: ["add", "waste"],
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    unit: {
      type: String,
      trim: true,
      default: "",
    },

    unitCost: {
      type: Number,
      default: 0,
      min: 0,
    },

    valueImpact: {
      type: Number,
      default: 0,
      min: 0,
    },

    previousStock: {
      type: Number,
      default: 0,
    },

    newStock: {
      type: Number,
      default: 0,
    },

    reason: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
  },
  { timestamps: true }
);

vendorStockLogSchema.index({ vendor: 1, type: 1, createdAt: -1 });
vendorStockLogSchema.index({ vendor: 1, product: 1, createdAt: -1 });

export default mongoose.model("VendorStockLog", vendorStockLogSchema);
