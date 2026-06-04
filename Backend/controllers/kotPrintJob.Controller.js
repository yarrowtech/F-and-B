import KotPrintJob from "../models/KotPrintJob.model.js";
import Employee from "../models/Employee.model.js";

const sendSuccess = (res, data, status = 200) =>
  res.status(status).json({ success: true, data });

const sendError = (res, message, status = 400) =>
  res.status(status).json({ success: false, message });

const verifyPrintAgent = (req, res, next) => {
  const expectedToken = process.env.PRINT_AGENT_TOKEN;
  const receivedToken = req.header("X-Print-Agent-Token");

  if (!expectedToken) {
    return sendError(res, "PRINT_AGENT_TOKEN is not configured", 503);
  }

  if (receivedToken !== expectedToken) {
    return sendError(res, "Invalid print agent token", 401);
  }

  return next();
};

const getPendingKotPrintJobs = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 25), 100);
    const jobs = await KotPrintJob.find({
      status: "PENDING",
    })
      .sort({ createdAt: 1 })
      .limit(limit);

    return sendSuccess(res, jobs);
  } catch (err) {
    return sendError(res, err.message);
  }
};

const markKotPrintJobPrinted = async (req, res) => {
  try {
    const job = await KotPrintJob.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: "PRINTED",
          printedAt: new Date(),
          lastError: "",
        },
        $inc: { attempts: 1 },
      },
      { new: true }
    );

    if (!job) return sendError(res, "Print job not found", 404);

    return sendSuccess(res, job);
  } catch (err) {
    return sendError(res, err.message);
  }
};

const markKotPrintJobFailed = async (req, res) => {
  try {
    const job = await KotPrintJob.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: "FAILED",
          lastError: String(req.body?.error || "Print failed").slice(0, 500),
        },
        $inc: { attempts: 1 },
      },
      { new: true }
    );

    if (!job) return sendError(res, "Print job not found", 404);

    return sendSuccess(res, job);
  } catch (err) {
    return sendError(res, err.message);
  }
};

const normalizeCuisine = (value) => String(value || "").trim().toLowerCase();
const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getRoleCuisineFilter = async (req) => {
  if (req.user.role !== "chef") return {};

  const chef = await Employee.findOne({
    _id: req.user.id,
    restaurant: req.user.restaurant,
    role: "CHEF",
    isActive: true,
  }).select("cuisineTypes");

  const cuisines = (chef?.cuisineTypes || [])
    .map(normalizeCuisine)
    .filter(Boolean);

  if (cuisines.length === 0) return {};

  return {
    cuisine: {
      $in: cuisines.map((cuisine) => new RegExp(`^${escapeRegex(cuisine)}$`, "i")),
    },
  };
};

const getMyPendingKotPrintJobs = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 25), 100);
    const cuisineFilter = await getRoleCuisineFilter(req);
    const jobs = await KotPrintJob.find({
      restaurant: req.user.restaurant,
      status: "PENDING",
      ...cuisineFilter,
    })
      .sort({ createdAt: 1 })
      .limit(limit);

    return sendSuccess(res, jobs);
  } catch (err) {
    return sendError(res, err.message);
  }
};

const markMyKotPrintJobPrinted = async (req, res) => {
  try {
    const cuisineFilter = await getRoleCuisineFilter(req);
    const job = await KotPrintJob.findOneAndUpdate(
      {
        _id: req.params.id,
        restaurant: req.user.restaurant,
        ...cuisineFilter,
      },
      {
        $set: {
          status: "PRINTED",
          printedAt: new Date(),
          lastError: "",
        },
        $inc: { attempts: 1 },
      },
      { new: true }
    );

    if (!job) return sendError(res, "Print job not found", 404);

    return sendSuccess(res, job);
  } catch (err) {
    return sendError(res, err.message);
  }
};

const markMyKotPrintJobFailed = async (req, res) => {
  try {
    const cuisineFilter = await getRoleCuisineFilter(req);
    const job = await KotPrintJob.findOneAndUpdate(
      {
        _id: req.params.id,
        restaurant: req.user.restaurant,
        ...cuisineFilter,
      },
      {
        $set: {
          status: "FAILED",
          lastError: String(req.body?.error || "Print failed").slice(0, 500),
        },
        $inc: { attempts: 1 },
      },
      { new: true }
    );

    if (!job) return sendError(res, "Print job not found", 404);

    return sendSuccess(res, job);
  } catch (err) {
    return sendError(res, err.message);
  }
};

export {
  verifyPrintAgent,
  getPendingKotPrintJobs,
  markKotPrintJobPrinted,
  markKotPrintJobFailed,
  getMyPendingKotPrintJobs,
  markMyKotPrintJobPrinted,
  markMyKotPrintJobFailed,
};
