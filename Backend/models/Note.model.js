import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
{
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },

  note: {
    type: String,
    required: true
  },

  date: {
    type: Date,
    default: Date.now
  },

  isPinned: {
    type: Boolean,
    default: false
  }

},
{ timestamps: true }
);

/* enable word search */
noteSchema.index({ note: "text" });

export default mongoose.model("Note", noteSchema);