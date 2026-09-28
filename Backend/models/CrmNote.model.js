import mongoose from "mongoose";

const crmNoteSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },

    customerPhone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    note: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
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

    createdByName: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

crmNoteSchema.index({ restaurant: 1, customerPhone: 1, createdAt: -1 });

export default mongoose.model("CrmNote", crmNoteSchema);
