import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // ACTION / ERROR
    action: String,
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    role: String,
    message: String,
    meta: Object,
    context: String,
    stack: String,
  },
  { timestamps: true }
);

export default mongoose.model("Log", logSchema);