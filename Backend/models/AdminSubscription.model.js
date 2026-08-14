import mongoose from "mongoose";

const adminSubscriptionSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      unique: true,
      index: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
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
    status: {
      type: String,
      enum: ["pending", "active", "expired", "cancelled", "trial"],
      default: "pending",
    },
    startDate: {
      type: Date,
      default: null,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    amountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
      uppercase: true,
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "manual", "free"],
      default: "pending",
    },
    paymentProvider: {
      type: String,
      enum: ["razorpay", "manual", "none"],
      default: "none",
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
    assignedByRole: {
      type: String,
      enum: ["self_signup", "super_admin", "system"],
      default: "self_signup",
    },
    assignedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.AdminSubscription ||
  mongoose.model("AdminSubscription", adminSubscriptionSchema);
