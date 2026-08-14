import mongoose from "mongoose";

const pendingVendorSubscriptionOrderSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },
    currentSubscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VendorSubscription",
      default: null,
    },
    planCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    purpose: {
      type: String,
      enum: ["activation"],
      default: "activation",
    },
    status: {
      type: String,
      enum: ["created", "verified", "expired", "cancelled"],
      default: "created",
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  { timestamps: true }
);

export default mongoose.models.PendingVendorSubscriptionOrder ||
  mongoose.model("PendingVendorSubscriptionOrder", pendingVendorSubscriptionOrderSchema);
