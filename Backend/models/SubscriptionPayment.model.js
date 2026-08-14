import mongoose from "mongoose";

const subscriptionPaymentSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
    subscription: {
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
    provider: {
      type: String,
      enum: ["razorpay", "manual"],
      required: true,
    },
    providerOrderId: {
      type: String,
      default: "",
      trim: true,
    },
    providerPaymentId: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["paid", "failed", "manual"],
      required: true,
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.SubscriptionPayment ||
  mongoose.model("SubscriptionPayment", subscriptionPaymentSchema);
