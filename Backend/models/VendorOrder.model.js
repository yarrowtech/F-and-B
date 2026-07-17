import mongoose from "mongoose";

const vendorOrderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VendorProduct",
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      trim: true,
      default: "",
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    stockDeductionQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    buyingPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    costAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    lineTotal: {
      type: Number,
      min: 0,
      default: 0,
    },
    inventoryLinkedItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      default: null,
    },
    inventoryReceivedQuantity: {
      type: Number,
      min: 0,
      default: 0,
    },
    inventoryUnitCost: {
      type: Number,
      min: 0,
      default: 0,
    },
    inventoryReceivedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const vendorOrderBillingSchema = new mongoose.Schema(
  {
    itemsTotal: {
      type: Number,
      min: 0,
      default: 0,
    },
    discountType: {
      type: String,
      enum: ["none", "amount", "percentage"],
      default: "none",
    },
    discountValue: {
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
    cgstRate: {
      type: Number,
      min: 0,
      default: 0,
    },
    sgstRate: {
      type: Number,
      min: 0,
      default: 0,
    },
    cgst: {
      type: Number,
      min: 0,
      default: 0,
    },
    sgst: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalTax: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    showTaxBreakup: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const vendorOrderSchema = new mongoose.Schema(
  {
    orderNo: {
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
      required: true,
      index: true,
    },
    placedByAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
    items: {
      type: [vendorOrderItemSchema],
      required: true,
      validate: [(val) => val.length > 0, "Order must contain items"],
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    billing: {
      type: vendorOrderBillingSchema,
      default: () => ({}),
    },
    status: {
      type: String,
      enum: ["processing", "ready", "completed", "cancelled"],
      default: "processing",
      index: true,
    },
    readyAt: {
      type: Date,
      default: null,
    },
    billGeneratedAt: {
      type: Date,
      default: null,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid"],
      default: "unpaid",
      index: true,
    },
    settlementStatus: {
      type: String,
      enum: ["unsettled", "scheduled", "settled"],
      default: "unsettled",
      index: true,
    },
    settlement: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VendorSettlement",
      default: null,
      index: true,
    },
    paymentMethod: {
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

vendorOrderSchema.pre("save", function (next) {
  if (!this.orderNo) {
    this.orderNo = `PO-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
  }
  next();
});

vendorOrderSchema.index({ vendor: 1, createdAt: -1 });

export default mongoose.models.VendorOrder ||
  mongoose.model("VendorOrder", vendorOrderSchema);
