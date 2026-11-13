import mongoose from "mongoose";

const stampSettingsSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      unique: true,
    },

    enabled: { type: Boolean, default: true },

    // Dynamic reward: set per restaurant by the admin.
    stampsRequired: { type: Number, default: 5, min: 1, max: 50 },
    rewardTitle: { type: String, trim: true, maxlength: 80, default: "Free dessert" },
    rewardDescription: { type: String, trim: true, maxlength: 300, default: "" },
    rewardValidityDays: { type: Number, default: 30, min: 1, max: 365 },

    // Minimum hours between two stamps for the same phone number.
    cooldownHours: { type: Number, default: 24, min: 0, max: 720 },

    welcomeMessage: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "Review us and collect a stamp!",
    },
  },
  { timestamps: true }
);

export default mongoose.model("StampSettings", stampSettingsSchema);
