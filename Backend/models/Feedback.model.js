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

    // Required for bill feedback (one per bill). Stamp-QR reviews have no bill.
    bill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bill",
      default: undefined,
    },

    source: {
      type: String,
      enum: ["bill", "stamp"],
      default: "bill",
      index: true,
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

// One feedback per bill — only enforced when a bill is present.
feedbackSchema.index(
  { bill: 1 },
  { unique: true, partialFilterExpression: { bill: { $type: "objectId" } } }
);

// Replaces the old non-partial unique index on `bill` (which would reject
// a second bill-less stamp review). Safe to call repeatedly.
export const ensureFeedbackIndexes = async () => {
  try {
    const indexes = await mongoose.model("Feedback").collection.indexes();
    const legacy = indexes.find((i) => i.name === "bill_1" && !i.partialFilterExpression);
    if (legacy) await mongoose.model("Feedback").collection.dropIndex("bill_1");
    await mongoose.model("Feedback").createIndexes();
  } catch (err) {
    console.error("Feedback index sync failed:", err.message);
  }
};

export default mongoose.model("Feedback", feedbackSchema);
