import mongoose from "mongoose";

const inventoryCategorySchema = new mongoose.Schema(
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

    isCustom: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

/* prevent duplicate category name per restaurant */
inventoryCategorySchema.index({ restaurant: 1, name: 1 }, { unique: true });

export default mongoose.model("InventoryCategory", inventoryCategorySchema);
