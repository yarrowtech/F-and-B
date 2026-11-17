import express from "express";
import mongoose from "mongoose";
import auth from "../middlewares/auth.middleware.js";
import PrintJob from "../models/PrintJob.model.js";

const router = express.Router();

const userRestaurantId = (user) => String(user?.restaurant?._id || user?.restaurant || "");

// Printer PC agent: shared secret + restaurant id (no user login needed).
const agentAuth = (req, res, next) => {
  const key = String(process.env.PRINT_AGENT_KEY || "");
  const restaurantId = String(req.headers["x-restaurant-id"] || "");
  if (!key || req.headers["x-agent-key"] !== key || !mongoose.isValidObjectId(restaurantId)) {
    return res.status(401).json({ success: false, message: "Invalid print agent key" });
  }
  req.agentRestaurantId = restaurantId;
  next();
};

// Any logged-in device queues jobs for the restaurant's printer PC.
router.post("/", auth, async (req, res) => {
  try {
    const restaurant = userRestaurantId(req.user);
    if (!mongoose.isValidObjectId(restaurant)) {
      return res.status(400).json({ success: false, message: "No restaurant for this user" });
    }
    const jobs = (Array.isArray(req.body?.jobs) ? req.body.jobs : [])
      .filter((job) => String(job?.receiptText || "").trim())
      .map((job) => ({
        restaurant,
        receiptText: String(job.receiptText),
        printerName: String(job.printerName || ""),
        jobName: String(job.jobName || "print").slice(0, 60),
        createdBy: req.user.id,
      }));
    if (!jobs.length) return res.status(400).json({ success: false, message: "Nothing to print" });
    await PrintJob.insertMany(jobs);
    res.status(201).json({ success: true, queued: jobs.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Agent: claim the next pending job atomically (oldest first).
router.post("/claim", agentAuth, async (req, res) => {
  try {
    // Re-queue jobs stuck in PRINTING for over 2 minutes (agent crashed).
    await PrintJob.updateMany(
      { restaurant: req.agentRestaurantId, status: "PRINTING", createdAt: { $lt: new Date(Date.now() - 120000) } },
      { status: "PENDING" }
    );
    const job = await PrintJob.findOneAndUpdate(
      { restaurant: req.agentRestaurantId, status: "PENDING" },
      { status: "PRINTING" },
      { sort: { createdAt: 1 }, new: true }
    );
    res.json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post("/:id/done", agentAuth, async (req, res) => {
  try {
    const error = String(req.body?.error || "");
    await PrintJob.updateOne(
      { _id: req.params.id, restaurant: req.agentRestaurantId },
      { status: error ? "FAILED" : "DONE", error }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
