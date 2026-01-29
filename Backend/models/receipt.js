// models/receipt.js
const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema(
  {
    orderNo: { type: String, required: true },
    tableNo: { type: String },
    items: { type: [String], default: [] },
    category: { type: String, default: "" },

    baseAmount: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    tip: { type: Number, default: 0 },
    taxPct: { type: Number, default: 0 },
    payable: { type: Number, default: 0 },

    paymentMethod: { type: String, default: "UPI" },
    notes: { type: String, default: "" },

    billGeneratedAt: { type: Date },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Receipt || mongoose.model("Receipt", receiptSchema);
