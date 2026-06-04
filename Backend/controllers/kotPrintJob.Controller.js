import KotPrintJob from "../models/KotPrintJob.model.js";

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

export {
  verifyPrintAgent,
  getPendingKotPrintJobs,
  markKotPrintJobPrinted,
  markKotPrintJobFailed,
};
