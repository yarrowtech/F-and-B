import mongoose from "mongoose";

const billPrintJobSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    bill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bill",
      required: true,
      index: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    printerName: {
      type: String,
      required: true,
      trim: true,
    },
    receiptText: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "PRINTED", "FAILED"],
      default: "PENDING",
      index: true,
    },
    printedByAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PrintAgent",
      default: null,
    },
    printedAt: {
      type: Date,
      default: null,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lastError: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

billPrintJobSchema.index({ restaurant: 1, status: 1, createdAt: 1 });
billPrintJobSchema.index({ bill: 1, status: 1 });

export default mongoose.model("BillPrintJob", billPrintJobSchema);
