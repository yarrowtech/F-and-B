import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },

    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    discountPercent: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },

    customerPhone: {
      type: String,
      trim: true,
      default: "",
    },

    customerName: {
      type: String,
      trim: true,
      default: "",
    },

    reason: {
      type: String,
      enum: ["loyalty", "manual"],
      default: "manual",
    },

    isRedeemed: {
      type: Boolean,
      default: false,
    },

    redeemedAt: {
      type: Date,
      default: null,
    },

    redeemedBill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bill",
      default: null,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "createdByModel",
    },

    createdByModel: {
      type: String,
      required: true,
      enum: ["Admin", "Employee"],
    },
  },
  { timestamps: true }
);

couponSchema.index({ restaurant: 1, code: 1 }, { unique: true });
couponSchema.index({ restaurant: 1, customerPhone: 1 });

export default mongoose.model("Coupon", couponSchema);
