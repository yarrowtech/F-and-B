import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
    index: true
  },

  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    required: true,
    index: true
  },

  // 🔥 Use Date instead of String (enterprise best practice)
  date: {
    type: Date,
    required: true,
    index: true
  },

  checkIn: Date,
  checkOut: Date,

  workHours: {
    type: Number,
    default: 0,
  },

  isLate: {
    type: Boolean,
    default: false,
  },

  status: {
    type: String,
    enum: ["PRESENT", "ABSENT", "LEAVE"],
    default: "PRESENT",
    index: true
  },

  location: {
    lat: Number,
    lng: Number,
  }

}, { timestamps: true });

/* 🔥 Composite Index (Very Important for Large Scale) */
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
attendanceSchema.index({ restaurant: 1, date: 1 });

export default mongoose.model("Attendance", attendanceSchema);
