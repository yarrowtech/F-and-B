import mongoose from "mongoose";

const vendorSettlementSchema = new mongoose.Schema(
  {
    settlementNo: {
      type: String,
      unique: true,
      index: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      default: null,
      index: true,
    },
    createdByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      default: null,
      index: true,
    },
    cycle: {
      type: String,
      enum: ["manual", "weekly", "15_days", "monthly"],
      default: "manual",
      index: true,
    },
    periodStart: {
      type: Date,
      required: true,
      index: true,
    },
    periodEnd: {
      type: Date,
      required: true,
      index: true,
    },
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "VendorOrder",
      },
    ],
    orderCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    totals: {
      grossAmount: {
        type: Number,
        min: 0,
        default: 0,
      },
      discountAmount: {
        type: Number,
        min: 0,
        default: 0,
      },
      taxableAmount: {
        type: Number,
        min: 0,
        default: 0,
      },
      taxAmount: {
        type: Number,
        min: 0,
        default: 0,
      },
      netPayable: {
        type: Number,
        min: 0,
        default: 0,
      },
    },
    status: {
      type: String,
      enum: ["pending", "paid", "cancelled"],
      default: "pending",
      index: true,
    },
    paymentMethod: {
      type: String,
      trim: true,
      default: "",
    },
    referenceNo: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

vendorSettlementSchema.pre("save", function (next) {
  if (!this.settlementNo) {
    this.settlementNo = `VS-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  }
  next();
});

vendorSettlementSchema.index({ vendor: 1, createdAt: -1 });

export default mongoose.models.VendorSettlement ||
  mongoose.model("VendorSettlement", vendorSettlementSchema);
