import mongoose from "mongoose";

const featureFlagSchema = new mongoose.Schema(
  {
    inventoryManagement: { type: Boolean, default: false },
    vendorOrdering: { type: Boolean, default: false },
    vendorSettlement: { type: Boolean, default: false },
    reportsAnalytics: { type: String, default: "none" },
    exportEnabled: { type: Boolean, default: false },
    multiRestaurantDashboard: { type: Boolean, default: false },
    customSettlementCycles: { type: Boolean, default: false },
    auditLogs: { type: Boolean, default: false },
    prioritySupport: { type: String, default: "standard" },
    apiIntegrationReady: { type: Boolean, default: false },
  },
  { _id: false }
);

const planOfferSchema = new mongoose.Schema(
  {
    enabled: { type: Boolean, default: false },
    label: {
      type: String,
      default: "",
      trim: true,
    },
    discountedPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    durationMonths: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  { _id: false }
);

const subscriptionPlanSchema = new mongoose.Schema(
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
    description: {
      type: String,
      default: "",
      trim: true,
    },
    monthlyPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    yearlyPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    yearlyDiscountPercent: {
      type: Number,
      default: 0,
      min: 0,
    },
    offers: {
      monthly: {
        type: planOfferSchema,
        default: () => ({}),
      },
      yearly: {
        type: planOfferSchema,
        default: () => ({}),
      },
    },
    maxRestaurants: {
      type: Number,
      required: true,
      min: 1,
    },
    maxStaff: {
      type: Number,
      required: true,
      min: 1,
    },
    extraRestaurantMonthlyPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    trialDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    features: {
      type: featureFlagSchema,
      default: () => ({}),
    },
    displayFeatures: {
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

export default mongoose.models.SubscriptionPlan ||
  mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
