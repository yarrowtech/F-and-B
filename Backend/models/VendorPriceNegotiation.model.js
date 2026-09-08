import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderRole: { type: String, enum: ["admin", "vendor"], required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, required: true },
    text: { type: String, trim: true, default: "" },
    offeredPrice: { type: Number, min: 0, default: null },
  },
  { timestamps: true }
);

const vendorPriceNegotiationSchema = new mongoose.Schema(
  {
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: "Vendor", required: true, index: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "VendorProduct", required: true, index: true },
    status: {
      type: String,
      enum: ["open", "accepted", "rejected"],
      default: "open",
      index: true,
    },
    agreedPrice: { type: Number, min: 0, default: null },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true }
);

vendorPriceNegotiationSchema.index(
  { vendor: 1, admin: 1, restaurant: 1, product: 1 },
  { unique: true }
);

export default mongoose.models.VendorPriceNegotiation ||
  mongoose.model("VendorPriceNegotiation", vendorPriceNegotiationSchema);
