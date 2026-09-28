import mongoose from "mongoose";

const blacklistedTokenSchema = new mongoose.Schema({
  tokenHash: {
    type: String,
    required: true,
    unique: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
});

// TTL index: Mongo auto-removes the entry once its token would have
// expired naturally anyway, so this collection never grows unbounded.
blacklistedTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("BlacklistedToken", blacklistedTokenSchema);
