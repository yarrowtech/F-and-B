import mongoose from "mongoose";

const vendorInventoryLinkSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    vendorProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VendorProduct",
      required: true,
      index: true,
    },
    inventoryItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
      index: true,
    },
    createdByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
    updatedByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
    },
  },
  { timestamps: true }
);

vendorInventoryLinkSchema.index(
  { restaurant: 1, vendorProduct: 1 },
  { unique: true }
);

export default mongoose.models.VendorInventoryLink ||
  mongoose.model("VendorInventoryLink", vendorInventoryLinkSchema);
