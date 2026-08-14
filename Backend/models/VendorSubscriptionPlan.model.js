import mongoose from "mongoose";

const vendorSubscriptionPlanSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    tagline: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    tier: {
      type: String,
      enum: ["basic", "pro", "business"],
      required: true,
    },
    monthlyPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    priceDisplay: {
      type: String,
      default: "",
      trim: true,
    },
    badgeLabel: {
      type: String,
      default: "",
      trim: true,
    },
    restaurantLimit: {
      type: Number,
      default: 0,
      min: 0,
    },
    restaurantLimitLabel: {
      type: String,
      default: "",
      trim: true,
    },
    featureSummary: {
      type: [String],
      default: [],
    },
    includedFeatures: {
      type: [String],
      default: [],
    },
    excludedFeatures: {
      type: [String],
      default: [],
    },
    lockedTriggers: {
      type: [String],
      default: [],
    },
    pageAccess: {
      type: [String],
      default: [],
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.models.VendorSubscriptionPlan ||
  mongoose.model("VendorSubscriptionPlan", vendorSubscriptionPlanSchema);
