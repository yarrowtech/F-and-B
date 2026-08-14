import mongoose from "mongoose";

const passwordResetOtpSchema = new mongoose.Schema(
  {
    accountType: {
      type: String,
      enum: ["admin", "vendor", "employee"],
      required: true,
      index: true,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    consumedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

passwordResetOtpSchema.index(
  { accountType: 1, accountId: 1, consumedAt: 1 },
  { unique: false }
);

export default mongoose.models.PasswordResetOtp ||
  mongoose.model("PasswordResetOtp", passwordResetOtpSchema);
