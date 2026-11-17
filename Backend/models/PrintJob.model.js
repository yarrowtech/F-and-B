import mongoose from "mongoose";

const printJobSchema = new mongoose.Schema(
  {
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true, index: true },
    receiptText: { type: String, required: true },
    printerName: { type: String, default: "" },
    jobName: { type: String, default: "print" },
    status: { type: String, enum: ["PENDING", "PRINTING", "DONE", "FAILED"], default: "PENDING", index: true },
    error: { type: String, default: "" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, default: null },
    // Auto-delete finished/old jobs after 2 days.
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 2 },
  },
  { timestamps: false }
);

export default mongoose.models.PrintJob || mongoose.model("PrintJob", printJobSchema);
