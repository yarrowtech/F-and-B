import ContactMessage from "../models/ContactMessage.model.js";
import { successResponse, errorResponse } from "../utils/apiResponse.js";

export const submitContactForm = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return errorResponse(res, "Name, email, subject, and message are required", 400);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errorResponse(res, "Invalid email address", 400);
    }

    const contact = await ContactMessage.create({ name, email, phone, subject, message });

    return successResponse(res, "Message received. We will get back to you soon.", { id: contact._id }, 201);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

export const getContactMessages = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = status ? { status } : {};
    const skip = (Number(page) - 1) * Number(limit);

    const [messages, total] = await Promise.all([
      ContactMessage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      ContactMessage.countDocuments(filter),
    ]);

    return successResponse(res, "Contact messages fetched", {
      messages,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
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
