import mongoose from "mongoose";

const vendorProductSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    buyingPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    unit: {
      type: String,
      trim: true,
      default: "",
    },
    stockUnit: {
      type: String,
      trim: true,
      default: "",
    },
    orderUnitsPerStockUnit: {
      type: Number,
      min: 0.000001,
      default: 1,
    },
    orderPackQuantity: {
      type: Number,
      min: 0.000001,
      default: 1,
    },
    category: {
      type: String,
      trim: true,
      default: "",
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      min: 0,
      default: 10,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isForSale: {
      type: Boolean,
      default: true,
      index: true,
    },
    isListedInMyProducts: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

vendorProductSchema.index({ vendor: 1, isActive: 1 });

export default mongoose.models.VendorProduct ||
  mongoose.model("VendorProduct", vendorProductSchema);
