import mongoose from "mongoose";

const loyaltySettingsSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      unique: true,
    },

    enabled: {
      type: Boolean,
      default: false,
    },

    minVisits: {
      type: Number,
      default: 3,
      min: 2,
    },

    discountPercent: {
      type: Number,
      default: 10,
      min: 1,
      max: 100,
    },

    couponValidityDays: {
      type: Number,
      default: 30,
      min: 1,
    },
  },
  { timestamps: true }
);

export default mongoose.model("LoyaltySettings", loyaltySettingsSchema);
