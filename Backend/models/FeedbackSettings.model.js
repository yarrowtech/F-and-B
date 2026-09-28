import mongoose from "mongoose";

const customQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      trim: true,
      required: true,
      maxlength: 200,
    },
    type: {
      type: String,
      enum: ["rating", "text"],
      default: "rating",
    },
    required: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

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

    customQuestions: {
      type: [customQuestionSchema],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: "You can add up to 10 custom questions",
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("FeedbackSettings", feedbackSettingsSchema);
