import mongoose from "mongoose";

const vendorSubscriptionSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      unique: true,
      index: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VendorSubscriptionPlan",
      required: true,
    },
    planCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["active", "trial", "expired", "blocked_due_to_plan", "cancelled"],
      default: "active",
    },
    startDate: {
      type: Date,
      default: null,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    scheduledPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VendorSubscriptionPlan",
      default: null,
    },
    scheduledPlanCode: {
      type: String,
      default: "",
      uppercase: true,
      trim: true,
    },
    scheduledChangeAt: {
      type: Date,
      default: null,
    },
    scheduledAmountPaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    scheduledPaymentMode: {
      type: String,
      enum: ["razorpay", "manual", "free", "none"],
      default: "none",
    },
    scheduledProviderOrderId: {
      type: String,
      default: "",
      trim: true,
    },
    scheduledProviderPaymentId: {
      type: String,
      default: "",
      trim: true,
    },
    scheduledAssignedByRole: {
      type: String,
      enum: ["vendor", "super_admin", "system"],
      default: "system",
    },
    scheduledAssignedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    scheduledNotes: {
      type: String,
      default: "",
      trim: true,
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
    paymentMode: {
      type: String,
      enum: ["razorpay", "manual", "free", "none"],
      default: "manual",
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
      enum: ["vendor", "super_admin", "system"],
      default: "vendor",
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

export default mongoose.models.VendorSubscription ||
  mongoose.model("VendorSubscription", vendorSubscriptionSchema);
