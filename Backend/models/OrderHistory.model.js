import mongoose from "mongoose";

const orderHistorySchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    action: {
      type: String,
      required: true,
      // examples:
      // ORDER_PLACED
      // ORDER_ACCEPTED
      // PREPARING_STARTED
      // ORDER_READY
      // ORDER_SERVED
      // BILL_GENERATED
      // PAYMENT_COMPLETED
    },

    previousStatus: {
      type: String,
    },

    newStatus: {
      type: String,
    },

    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    role: {
      type: String,
      enum: ["WAITER", "CHEF", "ACCOUNTANT", "ADMIN", "SYSTEM"],
      required: true,
    },

    remarks: {
      type: String, // optional notes
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("OrderHistory", orderHistorySchema);
