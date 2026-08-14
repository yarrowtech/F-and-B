import mongoose from "mongoose";

const projectPageViewSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
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
    path: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    title: {
      type: String,
      default: "",
      trim: true,
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
    viewedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

projectPageViewSchema.index({ viewedAt: -1, path: 1 });

const ProjectPageView =
  mongoose.models.ProjectPageView ||
  mongoose.model("ProjectPageView", projectPageViewSchema);

export default ProjectPageView;
