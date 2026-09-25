import mongoose from "mongoose";

const partySchema = {
  id: { type: mongoose.Schema.Types.ObjectId, required: true },
  role: { type: String, required: true, lowercase: true, trim: true },
  name: { type: String, default: "" },
};

const messageSchema = new mongoose.Schema(
  {
    sender: partySchema,
    recipient: partySchema,
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    readAt: { type: Date, default: null },
    // set when an admin sends one message to a whole department
    priority: { type: String, enum: ["normal", "urgent"], default: "normal" },
    broadcastId: { type: String, default: null, index: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, default: null },
    groupRole: { type: String, default: null, lowercase: true },
  },
  { timestamps: true }
);

messageSchema.index({ "sender.id": 1, "recipient.id": 1, createdAt: -1 });
messageSchema.index({ "recipient.id": 1, readAt: 1 });

export default mongoose.models.Message || mongoose.model("Message", messageSchema);
