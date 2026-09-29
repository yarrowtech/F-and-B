import mongoose from "mongoose";

const campaignRecipientSchema = new mongoose.Schema(
  {
    phone: { type: String, trim: true },
    email: { type: String, trim: true, default: "" },
    name: { type: String, trim: true, default: "" },
    waAttempted: { type: Boolean, default: false },
    waSent: { type: Boolean, default: false },
    waError: { type: String, trim: true, default: "" },
    mailAttempted: { type: Boolean, default: false },
    mailSent: { type: Boolean, default: false },
    mailError: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const campaignSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },

    imageUrl: { type: String, default: "" },
    imagePublicId: { type: String, default: "" },
    deliveryWarnings: { type: [String], default: [] },

    segment: {
      type: String,
      enum: ["all", "repeat", "inactive"],
      required: true,
    },

    segmentParams: {
      minVisits: { type: Number, default: 2 },
      inactiveDays: { type: Number, default: 30 },
    },

    channel: {
      type: String,
      enum: ["whatsapp", "email", "both"],
      default: "whatsapp",
    },

    recipients: {
      type: [campaignRecipientSchema],
      default: [],
    },

    recipientCount: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },

    deliverable: {
      type: Boolean,
      default: false, // false if neither requested channel is configured on the server
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

campaignSchema.index({ restaurant: 1, createdAt: -1 });

export default mongoose.model("Campaign", campaignSchema);
