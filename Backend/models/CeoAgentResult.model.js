import mongoose from "mongoose";

// Marketing results the CEO Agent sends back after a campaign or send.
const ceoAgentResultSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },

    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      default: null,
    },

    campaignId: { type: String, required: true, trim: true, maxlength: 200 },
    channel: { type: String, required: true, trim: true, lowercase: true, maxlength: 50 },
    sentAt: { type: Date, default: null },

    targetCustomerIds: { type: [String], default: [] },

    // sent / opened / clicked / replied ... (any named counts)
    metrics: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);

// Sending the same campaign + channel again updates its numbers.
ceoAgentResultSchema.index({ admin: 1, campaignId: 1, channel: 1 }, { unique: true });
ceoAgentResultSchema.index({ admin: 1, updatedAt: -1 });

export default mongoose.models.CeoAgentResult ||
  mongoose.model("CeoAgentResult", ceoAgentResultSchema);
