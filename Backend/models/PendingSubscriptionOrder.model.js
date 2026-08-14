import mongoose from "mongoose";

const pendingSubscriptionOrderSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
    currentSubscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminSubscription",
      default: null,
    },
    planCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    billingCycle: {
      type: String,
      enum: ["monthly", "yearly"],
      required: true,
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
      enum: ["upgrade"],
      default: "upgrade",
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

export default mongoose.models.PendingSubscriptionOrder ||
  mongoose.model("PendingSubscriptionOrder", pendingSubscriptionOrderSchema);
