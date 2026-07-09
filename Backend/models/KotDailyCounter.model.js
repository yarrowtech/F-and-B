import mongoose from "mongoose";

const kotDailyCounterSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    dateKey: {
      type: String,
      required: true,
      trim: true,
    },
    lastSerial: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

kotDailyCounterSchema.index({ restaurant: 1, dateKey: 1 }, { unique: true });

export default mongoose.model("KotDailyCounter", kotDailyCounterSchema);
