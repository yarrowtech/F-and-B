import mongoose from "mongoose";

const kitchenSectionSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Windows printer queue name for this section's KOT jobs.
    // Falls back to KOT_DEFAULT_PRINTER when empty.
    printerQueueName: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

/* prevent duplicate section name per restaurant */
kitchenSectionSchema.index({ restaurant: 1, name: 1 }, { unique: true });

export default mongoose.model("KitchenSection", kitchenSectionSchema);
