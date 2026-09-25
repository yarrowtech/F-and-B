import mongoose from "mongoose";

/**
 * Physical size/proportions of one floor-plan zone (e.g. "Main Hall",
 * "Terrace"), so the on-screen canvas can match the real room shape
 * instead of always being one fixed rectangle.
 */
const floorZoneSettingsSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    zone: {
      type: String,
      required: true,
      trim: true,
    },
    widthFt: {
      type: Number,
      default: 40,
      min: 5,
      max: 500,
    },
    heightFt: {
      type: Number,
      default: 25,
      min: 5,
      max: 500,
    },

    /* 🖼️ Optional background photo/blueprint of the real room, so tables
       can be dragged directly on top of it to match the real floor. */
    backgroundImageUrl: {
      type: String,
      default: "",
    },
    backgroundImagePublicId: {
      type: String,
      default: "",
    },
    backgroundOpacity: {
      type: Number,
      default: 0.6,
      min: 0.1,
      max: 1,
    },
  },
  { timestamps: true }
);

floorZoneSettingsSchema.index({ restaurant: 1, zone: 1 }, { unique: true });

export default mongoose.model("FloorZoneSettings", floorZoneSettingsSchema);
