import mongoose from "mongoose";

const supportTicketUpdateSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      required: true,
    },
    note: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SuperAdmin",
      required: true,
    },
    changedByEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    adminName: {
      type: String,
      trim: true,
      default: "",
    },
    adminEmail: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
    },
    restaurantName: {
      type: String,
      trim: true,
      default: "",
    },
    restaurantCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    category: {
      type: String,
      enum: ["bug", "billing", "inventory", "report", "login", "other"],
      default: "other",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
      index: true,
    },
    latestNote: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },
    updates: {
      type: [supportTicketUpdateSchema],
      default: [],
    },
  },
  { timestamps: true }
);

supportTicketSchema.index({ createdAt: -1 });
supportTicketSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.SupportTicket ||
  mongoose.model("SupportTicket", supportTicketSchema);
