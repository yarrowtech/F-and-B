import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import BillPrintJob from "../models/BillPrintJob.model.js";
import PrintAgent from "../models/PrintAgent.model.js";
import Restaurant from "../models/Restaurant.model.js";

const sendSuccess = (res, data, status = 200) =>
  res.status(status).json({ success: true, data });

const sendError = (res, message, status = 400) =>
  res.status(status).json({ success: false, message });

const signAgentToken = (agent) =>
  jwt.sign(
    {
      id: agent._id.toString(),
      role: "print_agent",
      restaurant: agent.restaurant.toString(),
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.PRINT_AGENT_JWT_EXPIRES_IN || "30d" }
  );

const getAuthorizedRestaurantId = async (req, requestedRestaurantId) => {
  if (req.user.role === "admin") {
    const restaurant = await Restaurant.findOne({
      _id: requestedRestaurantId,
      admin: req.user.id,
    }).select("_id");

    return restaurant?._id || null;
  }

  if (req.user.restaurant) return req.user.restaurant;

  return null;
};

const createPrintAgent = async (req, res) => {
  try {
    const {
      restaurantId = req.user.restaurant,
      name,
      username,
      password,
      billPrinterName,
    } = req.body;

    if (!name || !username || !password || !billPrinterName) {
      return sendError(res, "Name, username, password, and bill printer are required");
    }

    if (String(password).length < 8) {
      return sendError(res, "Printer account password must be at least 8 characters");
    }

    const authorizedRestaurantId = await getAuthorizedRestaurantId(req, restaurantId);
    if (!authorizedRestaurantId) {
      return sendError(res, "Restaurant access denied", 403);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const agent = await PrintAgent.create({
      restaurant: authorizedRestaurantId,
      name: String(name).trim(),
      username: String(username).trim().toLowerCase(),
      password: hashedPassword,
      billPrinterName: String(billPrinterName).trim(),
      createdBy: req.user.id,
      createdByModel: req.user.role === "admin" ? "Admin" : "Employee",
    });

    return sendSuccess(
      res,
      {
        _id: agent._id,
        restaurant: agent.restaurant,
        name: agent.name,
        username: agent.username,
        billPrinterName: agent.billPrinterName,
        isActive: agent.isActive,
      },
      201
    );
  } catch (err) {
    if (err.code === 11000) {
      return sendError(res, "Printer account username already exists");
    }

    return sendError(res, err.message);
  }
};

const loginPrintAgent = async (req, res) => {
  try {
    const { username, password } = req.body;

    const agent = await PrintAgent.findOne({
      username: String(username || "").trim().toLowerCase(),
      isActive: true,
    }).select("+password");

    if (!agent) return sendError(res, "Invalid printer account login", 401);

    const isMatch = await bcrypt.compare(String(password || ""), agent.password);
    if (!isMatch) return sendError(res, "Invalid printer account login", 401);

    agent.lastLoginAt = new Date();
    agent.lastSeenAt = new Date();
    await agent.save();

    return sendSuccess(res, {
      token: signAgentToken(agent),
      agent: {
        _id: agent._id,
        restaurant: agent.restaurant,
        name: agent.name,
        username: agent.username,
        billPrinterName: agent.billPrinterName,
      },
    });
  } catch (err) {
    return sendError(res, err.message);
  }
};

const authPrintAgent = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : "";

    if (!token) return sendError(res, "Printer agent token required", 401);

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "print_agent") {
      return sendError(res, "Invalid printer agent token", 401);
    }

    const agent = await PrintAgent.findOne({
      _id: decoded.id,
      restaurant: decoded.restaurant,
      isActive: true,
    });

    if (!agent) return sendError(res, "Printer agent not active", 401);

    agent.lastSeenAt = new Date();
    await agent.save();

    req.printAgent = agent;
    return next();
  } catch (err) {
    return sendError(res, "Printer agent token invalid or expired", 401);
  }
};

const getPendingBillPrintJobs = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 25), 100);
    const jobs = await BillPrintJob.find({
      restaurant: req.printAgent.restaurant,
      status: "PENDING",
    })
      .sort({ createdAt: 1 })
      .limit(limit);

    return sendSuccess(res, jobs);
  } catch (err) {
    return sendError(res, err.message);
  }
};

const markBillPrintJobPrinted = async (req, res) => {
  try {
    const job = await BillPrintJob.findOneAndUpdate(
      {
        _id: req.params.id,
        restaurant: req.printAgent.restaurant,
      },
      {
        $set: {
          status: "PRINTED",
          printedByAgent: req.printAgent._id,
          printedAt: new Date(),
          lastError: "",
        },
        $inc: { attempts: 1 },
      },
      { new: true }
    );

    if (!job) return sendError(res, "Bill print job not found", 404);

    return sendSuccess(res, job);
  } catch (err) {
    return sendError(res, err.message);
  }
};

const markBillPrintJobFailed = async (req, res) => {
  try {
    const job = await BillPrintJob.findOneAndUpdate(
      {
        _id: req.params.id,
        restaurant: req.printAgent.restaurant,
      },
      {
        $set: {
          status: "FAILED",
          printedByAgent: req.printAgent._id,
          lastError: String(req.body?.error || "Print failed").slice(0, 500),
        },
        $inc: { attempts: 1 },
      },
      { new: true }
    );

    if (!job) return sendError(res, "Bill print job not found", 404);

    return sendSuccess(res, job);
  } catch (err) {
    return sendError(res, err.message);
  }
};

export {
  createPrintAgent,
  loginPrintAgent,
  authPrintAgent,
  getPendingBillPrintJobs,
  markBillPrintJobPrinted,
  markBillPrintJobFailed,
};
