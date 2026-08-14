import mongoose from "mongoose";

const pendingAdminSignupSchema = new mongoose.Schema(
  {
    businessName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    mobile: { type: String, required: true, trim: true },
    address: {
      line1: { type: String, trim: true, default: "" },
      line2: { type: String, trim: true, default: "" },
      landmark: { type: String, trim: true, default: "" },
      city: { type: String, trim: true, default: "" },
      state: { type: String, trim: true, default: "" },
      pincode: { type: String, trim: true, default: "" },
      country: { type: String, trim: true, default: "India" },
    },
    panNumber: { type: String, required: true, uppercase: true, trim: true },
    gstNumber: { type: String, required: true, uppercase: true, trim: true },
    password: { type: String, required: true },
    planCode: { type: String, required: true, uppercase: true, trim: true },
    billingCycle: { type: String, enum: ["monthly", "yearly"], required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR", uppercase: true, trim: true },
    razorpayOrderId: { type: String, required: true, trim: true, unique: true },
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

export default mongoose.models.PendingAdminSignup ||
  mongoose.model("PendingAdminSignup", pendingAdminSignupSchema);
