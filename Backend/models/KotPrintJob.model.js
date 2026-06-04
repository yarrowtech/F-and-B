import mongoose from "mongoose";

const kotPrintJobSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    waiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    cuisine: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    printerName: {
      type: String,
      required: true,
      trim: true,
    },
    payload: {
      type: Object,
      required: true,
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

kotPrintJobSchema.index(
  { order: 1, cuisine: 1 },
  { unique: true }
);
kotPrintJobSchema.index({ restaurant: 1, status: 1, createdAt: 1 });

export default mongoose.model("KotPrintJob", kotPrintJobSchema);
