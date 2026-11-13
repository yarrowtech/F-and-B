import mongoose from "mongoose";

const rewardSchema = new mongoose.Schema({
  code: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  earnedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null },
  redeemed: { type: Boolean, default: false },
  redeemedAt: { type: Date, default: null },
  redeemedBy: { type: mongoose.Schema.Types.ObjectId, default: null },
});

const stampCardSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    customerPhone: { type: String, required: true, trim: true },
    customerName: { type: String, trim: true, default: "" },

    // Stamps collected towards the next reward (resets when a reward is earned).
    stamps: { type: Number, default: 0, min: 0 },
    totalStamps: { type: Number, default: 0, min: 0 },
    lastStampAt: { type: Date, default: null },

    rewards: { type: [rewardSchema], default: [] },
  },
  { timestamps: true }
);

stampCardSchema.index({ restaurant: 1, customerPhone: 1 }, { unique: true });

export default mongoose.model("StampCard", stampCardSchema);
