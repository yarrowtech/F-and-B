import mongoose from "mongoose";

const projectActivityEventSchema = new mongoose.Schema(
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
    eventType: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    featureKey: {
      type: String,
      default: "",
      index: true,
      trim: true,
    },
    featureLabel: {
      type: String,
      default: "",
      trim: true,
    },
    path: {
      type: String,
      default: "/",
      index: true,
      trim: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    occurredAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

projectActivityEventSchema.index({ occurredAt: -1, eventType: 1, role: 1 });

const ProjectActivityEvent =
  mongoose.models.ProjectActivityEvent ||
  mongoose.model("ProjectActivityEvent", projectActivityEventSchema);

export default ProjectActivityEvent;
