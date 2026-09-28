import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },

    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      default: null,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    partySize: {
      type: Number,
      required: true,
    },

    bookingTime: {
      type: Date,
      required: true,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["upcoming", "seated", "cancelled", "no_show"],
      default: "upcoming",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "createdByModel",
    },

    createdByModel: {
      type: String,
      required: true,
      enum: ["Admin", "Employee"],
    },
  },
  { timestamps: true }
);

reservationSchema.index({ restaurant: 1, bookingTime: 1 });
reservationSchema.index({ restaurant: 1, status: 1 });

export default mongoose.model("Reservation", reservationSchema);
