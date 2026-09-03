import mongoose from "mongoose";
import Admin from "../models/Admin.model.js";
import Restaurant from "../models/restaurant.model.js";
import SupportTicket from "../models/SupportTicket.model.js";
import { errorResponse, successResponse } from "../utils/apiResponse.js";

const ALLOWED_CATEGORIES = ["bug", "billing", "inventory", "report", "login", "other"];
const ALLOWED_PRIORITIES = ["low", "medium", "high", "urgent"];
const ALLOWED_STATUSES = ["open", "in_progress", "resolved", "closed"];

const escapeRegExp = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildTicketNumber = async () => {
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const dailyCount = await SupportTicket.countDocuments({
    createdAt: { $gte: startOfDay, $lt: endOfDay },
  });

  return `SUP-${datePart}-${String(dailyCount + 1).padStart(4, "0")}`;
};

export const createSupportTicket = async (req, res) => {
  try {
    const adminId = req.user?.id;
    const {
      restaurantId = "",
      subject = "",
      category = "other",
      priority = "medium",
      description = "",
    } = req.body || {};

    if (!adminId) {
      return errorResponse(res, "Admin not found", 401);
    }

    if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
      return errorResponse(res, "Valid restaurant is required", 400);
    }

    const normalizedSubject = String(subject).trim();
    const normalizedDescription = String(description).trim();
    const normalizedCategory = String(category).trim().toLowerCase();
    const normalizedPriority = String(priority).trim().toLowerCase();

    if (!normalizedSubject) {
      return errorResponse(res, "Subject is required", 400);
    }

    if (!normalizedDescription) {
      return errorResponse(res, "Issue details are required", 400);
    }

    if (!ALLOWED_CATEGORIES.includes(normalizedCategory)) {
      return errorResponse(res, "Invalid category", 400);
    }

    if (!ALLOWED_PRIORITIES.includes(normalizedPriority)) {
      return errorResponse(res, "Invalid priority", 400);
    }

    const [admin, restaurant] = await Promise.all([
      Admin.findById(adminId).select("businessName email"),
      Restaurant.findOne({
        _id: restaurantId,
        admin: adminId,
      }).select("name restaurantCode"),
    ]);

    if (!admin) {
      return errorResponse(res, "Admin not found", 404);
    }

    if (!restaurant) {
      return errorResponse(res, "Restaurant not found for this admin", 404);
    }

    const ticket = await SupportTicket.create({
      ticketNumber: await buildTicketNumber(),
      admin: admin._id,
      restaurant: restaurant._id,
      adminName: admin.businessName || "",
      adminEmail: admin.email || "",
      restaurantName: restaurant.name || "",
      restaurantCode: restaurant.restaurantCode || "",
      subject: normalizedSubject,
      category: normalizedCategory,
      priority: normalizedPriority,
      description: normalizedDescription,
    });

    return successResponse(
      res,
      "Support ticket created successfully",
      { ticket },
      201
    );
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

export const getMySupportTickets = async (req, res) => {
  try {
    const adminId = req.user?.id;
    const { status = "", restaurantId = "", search = "", page = 1, limit = 10 } = req.query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 50);
    const skip = (pageNumber - 1) * limitNumber;

    const filter = { admin: adminId };

    if (status) {
      const normalizedStatus = String(status).trim().toLowerCase();
      if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
        return errorResponse(res, "Invalid status", 400);
      }
      filter.status = normalizedStatus;
    }

    if (restaurantId) {
      if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
        return errorResponse(res, "Invalid restaurant", 400);
      }
      filter.restaurant = restaurantId;
    }

    const normalizedSearch = String(search).trim();
    if (normalizedSearch) {
      const searchRegex = new RegExp(escapeRegExp(normalizedSearch), "i");
      filter.$or = [
        { ticketNumber: searchRegex },
        { subject: searchRegex },
        { description: searchRegex },
        { restaurantName: searchRegex },
        { restaurantCode: searchRegex },
      ];
    }

    const [tickets, total, statusCounts] = await Promise.all([
      SupportTicket.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),
      SupportTicket.countDocuments(filter),
      SupportTicket.aggregate([
        { $match: { admin: new mongoose.Types.ObjectId(adminId) } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const stats = statusCounts.reduce(
      (acc, item) => {
        if (item?._id) acc[item._id] = item.count;
        acc.total += item.count;
        return acc;
      },
      { total: 0, open: 0, in_progress: 0, resolved: 0, closed: 0 }
    );

    return successResponse(res, "Support tickets fetched", {
      tickets,
      total,
      page: pageNumber,
      limit: limitNumber,
      pages: Math.max(Math.ceil(total / limitNumber), 1),
      stats,
    });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

export const getAllSupportTickets = async (req, res) => {
  try {
    const {
      status = "",
      category = "",
      priority = "",
      adminId = "",
      restaurantId = "",
      search = "",
      page = 1,
      limit = 15,
    } = req.query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 15, 1), 100);
    const skip = (pageNumber - 1) * limitNumber;
    const filter = {};

    if (status) {
      const normalizedStatus = String(status).trim().toLowerCase();
      if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
        return errorResponse(res, "Invalid status", 400);
      }
      filter.status = normalizedStatus;
    }

    if (category) {
      const normalizedCategory = String(category).trim().toLowerCase();
      if (!ALLOWED_CATEGORIES.includes(normalizedCategory)) {
        return errorResponse(res, "Invalid category", 400);
      }
      filter.category = normalizedCategory;
    }

    if (priority) {
      const normalizedPriority = String(priority).trim().toLowerCase();
      if (!ALLOWED_PRIORITIES.includes(normalizedPriority)) {
        return errorResponse(res, "Invalid priority", 400);
      }
      filter.priority = normalizedPriority;
    }

    if (adminId) {
      if (!mongoose.Types.ObjectId.isValid(adminId)) {
        return errorResponse(res, "Invalid admin", 400);
      }
      filter.admin = adminId;
    }

    if (restaurantId) {
      if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
        return errorResponse(res, "Invalid restaurant", 400);
      }
      filter.restaurant = restaurantId;
    }

    const normalizedSearch = String(search).trim();
    if (normalizedSearch) {
      const searchRegex = new RegExp(escapeRegExp(normalizedSearch), "i");
      filter.$or = [
        { ticketNumber: searchRegex },
        { subject: searchRegex },
        { description: searchRegex },
        { adminName: searchRegex },
        { adminEmail: searchRegex },
        { restaurantName: searchRegex },
        { restaurantCode: searchRegex },
      ];
    }

    const [tickets, total, statusCounts] = await Promise.all([
      SupportTicket.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),
      SupportTicket.countDocuments(filter),
      SupportTicket.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const stats = statusCounts.reduce(
      (acc, item) => {
        if (item?._id) acc[item._id] = item.count;
        acc.total += item.count;
        return acc;
      },
      { total: 0, open: 0, in_progress: 0, resolved: 0, closed: 0 }
    );

    return successResponse(res, "Support tickets fetched", {
      tickets,
      total,
      page: pageNumber,
      limit: limitNumber,
      pages: Math.max(Math.ceil(total / limitNumber), 1),
      stats,
    });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

export const updateSupportTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status = "", note = "" } = req.body || {};

    const normalizedStatus = String(status).trim().toLowerCase();
    const normalizedNote = String(note).trim();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, "Invalid ticket", 400);
    }

    if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
      return errorResponse(res, "Invalid status", 400);
    }

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return errorResponse(res, "Support ticket not found", 404);
    }

    ticket.status = normalizedStatus;
    ticket.latestNote = normalizedNote;
    ticket.updates.push({
      status: normalizedStatus,
      note: normalizedNote,
      changedBy: req.user.id,
      changedByEmail: req.user.email || "",
      changedAt: new Date(),
    });

    await ticket.save();

    return successResponse(res, "Support ticket updated", { ticket });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};
