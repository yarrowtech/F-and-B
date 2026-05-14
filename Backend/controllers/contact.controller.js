import ContactMessage from "../models/ContactMessage.model.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

export const submitContactForm = async (req, res) => {
  try {
    const {
      name = "",
      email = "",
      phone = "",
      company = "",
      businessName = "",
      subject = "",
      message = "",
    } = req.body || {};

    const contactData = {
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      phone: String(phone).trim(),
      company: String(company || businessName).trim(),
      subject: String(subject || company || businessName || "General Inquiry").trim(),
      message: String(message).trim(),
    };

    if (!contactData.name || !contactData.email || !contactData.message) {
      return errorResponse(res, "Name, email, and message are required", 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactData.email)) {
      return errorResponse(res, "Invalid email address", 400);
    }

    const contact = await ContactMessage.create(contactData);

    return successResponse(res, "Message received. We will get back to you soon.", { id: contact._id }, 201);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

export const getContactMessages = async (req, res) => {
  try {
    const { status, search = "", page = 1, limit = 20 } = req.query;

    const allowedStatuses = ["new", "read", "replied"];
    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (pageNumber - 1) * limitNumber;
    const normalizedSearch = String(search).trim();

    if (status && !allowedStatuses.includes(status)) {
      return errorResponse(res, "Invalid status", 400);
    }

    const filter = {};
    if (status) filter.status = status;

    if (normalizedSearch) {
      const searchRegex = new RegExp(normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { company: searchRegex },
        { subject: searchRegex },
        { message: searchRegex },
      ];
    }

    const [messages, total, statusCounts] = await Promise.all([
      ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNumber).lean(),
      ContactMessage.countDocuments(filter),
      ContactMessage.aggregate([
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
        acc[item._id] = item.count;
        acc.total += item.count;
        return acc;
      },
      { total: 0, new: 0, read: 0, replied: 0 }
    );

    return successResponse(res, "Contact messages fetched", {
      messages,
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

export const updateContactStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["new", "read", "replied"];
    if (!allowed.includes(status)) {
      return errorResponse(res, "Invalid status", 400);
    }

    const contact = await ContactMessage.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!contact) return errorResponse(res, "Message not found", 404);

    return successResponse(res, "Status updated", { contact });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};
