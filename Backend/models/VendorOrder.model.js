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
