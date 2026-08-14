import mongoose from "mongoose";

const projectAnalyticsSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    userId: {
      type: String,
      default: null,
      index: true,
    },
    role: {
      type: String,
      default: "guest",
      index: true,
    },
    isAuthenticated: {
      type: Boolean,
      default: false,
    },
    deviceType: {
      type: String,
      default: "desktop",
      index: true,
    },
    browser: {
      type: String,
      default: "Unknown",
    },
    os: {
      type: String,
      default: "Unknown",
    },
    entryPath: {
      type: String,
      default: "/",
      index: true,
    },
    lastPath: {
      type: String,
      default: "/",
    },
    pageViewCount: {
      type: Number,
      default: 0,
    },
    screenWidth: {
      type: Number,
      default: null,
    },
    screenHeight: {
      type: Number,
      default: null,
    },
    timezone: {
      type: String,
      default: "",
    },
    referrer: {
      type: String,
      default: "",
    },
    ipAddress: {
      type: String,
      default: "",
    },
    startedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    loginAt: {
      type: Date,
      default: null,
      index: true,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
    logoutAt: {
      type: Date,
      default: null,
      index: true,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

projectAnalyticsSessionSchema.index({ startedAt: -1, role: 1 });

const ProjectAnalyticsSession =
  mongoose.models.ProjectAnalyticsSession ||
  mongoose.model("ProjectAnalyticsSession", projectAnalyticsSessionSchema);

export default ProjectAnalyticsSession;
