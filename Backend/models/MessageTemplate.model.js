import mongoose from "mongoose";

const messageTemplateSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 60 },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    priority: { type: String, enum: ["normal", "urgent"], default: "normal" },
  },
  { timestamps: true }
);

export default mongoose.models.MessageTemplate ||
  mongoose.model("MessageTemplate", messageTemplateSchema);
