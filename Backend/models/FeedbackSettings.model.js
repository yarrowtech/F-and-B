import mongoose from "mongoose";

const feedbackSettingsSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      unique: true,
    },

    collectService: { type: Boolean, default: true },
    collectAmbiance: { type: Boolean, default: true },
    collectItemRatings: { type: Boolean, default: true },
    collectComment: { type: Boolean, default: true },
    collectCustomerName: { type: Boolean, default: true },

    welcomeMessage: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "How was your visit?",
    },

    thankYouMessage: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "Your feedback has been recorded.",
    },
  },
  { timestamps: true }
);

export default mongoose.model("FeedbackSettings", feedbackSettingsSchema);
