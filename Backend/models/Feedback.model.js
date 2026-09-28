import mongoose from "mongoose";

const itemFeedbackSchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Menu",
      default: null,
    },
    name: {
      type: String,
      trim: true,
      default: "Item",
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  { _id: false }
);

const customAnswerSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      trim: true,
      required: true,
    },
    type: {
      type: String,
      enum: ["rating", "text"],
      default: "rating",
    },
    answer: {
      type: mongoose.Schema.Types.Mixed, // Number for rating, String for text
      required: true,
    },
  },
  { _id: false }
);

const feedbackSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },

    bill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bill",
      required: true,
      unique: true, // one feedback per bill
    },

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },

    customerName: {
      type: String,
      trim: true,
      default: "",
    },

    customerPhone: {
      type: String,
      trim: true,
      default: "",
    },

    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    serviceRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },

    ambianceRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },

    itemRatings: {
      type: [itemFeedbackSchema],
      default: [],
    },

    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    customAnswers: {
      type: [customAnswerSchema],
      default: [],
    },

    submittedVia: {
      type: String,
      enum: ["whatsapp", "email", "direct"],
      default: "direct",
    },
  },
  { timestamps: true }
);

feedbackSchema.index({ restaurant: 1, createdAt: -1 });

export default mongoose.model("Feedback", feedbackSchema);
