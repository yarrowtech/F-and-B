import mongoose from "mongoose";

/**
 * Fixed floor-plan landmarks - Entrance, Kitchen, Bar, Wall, Walkway, etc.
 * Drawn alongside tables on the Interactive Floor Plan so it reads like a
 * real map of the restaurant instead of just a grid of table dots.
 */
const floorMarkerSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },

    type: {
      type: String,
      enum: ["entrance", "kitchen", "bar", "washroom", "wall", "other"],
      default: "other",
    },

    label: {
      type: String,
      trim: true,
      default: "",
    },

    zone: {
      type: String,
      default: "Main Hall",
      trim: true,
    },

    layout: {
      x: { type: Number, default: 5 },
      y: { type: Number, default: 5 },
      width: { type: Number, default: 10 }, // % of floor width
      height: { type: Number, default: 6 }, // % of floor height
      rotation: { type: Number, default: 0 },
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

export default mongoose.model("FloorMarker", floorMarkerSchema);
