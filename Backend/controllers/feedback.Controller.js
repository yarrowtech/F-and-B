import Feedback from "../models/Feedback.model.js";
import FeedbackSettings from "../models/FeedbackSettings.model.js";
import Bill from "../models/Bill.model.js";
import Restaurant from "../models/Restaurant.model.js";
import { verifyFeedbackToken } from "../utils/feedbackToken.js";
import logger from "../utils/pinoLogger.js";

const DEFAULT_SETTINGS = {
  collectService: true,
  collectAmbiance: true,
  collectItemRatings: true,
  collectComment: true,
  collectCustomerName: true,
  welcomeMessage: "How was your visit?",
  thankYouMessage: "Your feedback has been recorded.",
};

const getSettingsForRestaurant = async (restaurantId) => {
  const settings = await FeedbackSettings.findOne({ restaurant: restaurantId }).lean();
  return settings ? { ...DEFAULT_SETTINGS, ...settings } : DEFAULT_SETTINGS;
};

/* ===============================
   PUBLIC · GET BILL CONTEXT FOR FEEDBACK FORM
=============================== */
const getPublicFeedbackContext = async (req, res) => {
  try {
    const { billId } = req.params;
    const { token } = req.query;

    if (!verifyFeedbackToken(billId, token)) {
      return res.status(401).json({ success: false, message: "Invalid or expired feedback link" });
    }

    const bill = await Bill.findById(billId)
      .populate("restaurant", "name")
      .populate({
        path: "order",
        select: "items",
        populate: { path: "items.menuItem", select: "name" },
      })
      .select("billNo totalAmount restaurant customerName order")
      .lean();

    if (!bill) {
      return res.status(404).json({ success: false, message: "Bill not found" });
    }

    const existing = await Feedback.findOne({ bill: billId }).select("_id").lean();
    const settings = await getSettingsForRestaurant(bill.restaurant?._id);

    const items = (bill.order?.items || [])
      .filter((item) => item.status !== "CANCELLED" && item.menuItem)
      .map((item) => ({
        menuItemId: item.menuItem._id,
        name: item.menuItem.name || "Item",
        quantity: item.quantity,
      }));

    // De-dupe items ordered more than once (same menu item added twice)
    const dedupedItems = Array.from(
      items.reduce((map, item) => {
        const key = String(item.menuItemId);
        if (!map.has(key)) map.set(key, item);
        return map;
      }, new Map()).values()
    );

    res.json({
      success: true,
      data: {
        billNo: bill.billNo,
        totalAmount: bill.totalAmount,
        restaurantName: bill.restaurant?.name || "Restaurant",
        alreadySubmitted: Boolean(existing),
        items: dedupedItems,
        settings,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ===============================
   PUBLIC · SUBMIT FEEDBACK
=============================== */
const parseOptionalRating = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  if (!num || num < 1 || num > 5) return undefined; // invalid marker
  return num;
};

const submitPublicFeedback = async (req, res) => {
  try {
    const { billId } = req.params;
    const {
      token,
      rating,
      comment,
      customerName,
      serviceRating,
      ambianceRating,
      itemRatings,
    } = req.body;

    if (!verifyFeedbackToken(billId, token)) {
      return res.status(401).json({ success: false, message: "Invalid or expired feedback link" });
    }

    const ratingNum = Number(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ success: false, message: "Overall rating must be between 1 and 5" });
    }

    const bill = await Bill.findById(billId)
      .select("restaurant order customerEmail customerPhone customerName")
      .populate({
        path: "order",
        select: "items",
        populate: { path: "items.menuItem", select: "name" },
      });

    if (!bill) {
      return res.status(404).json({ success: false, message: "Bill not found" });
    }

    const settings = await getSettingsForRestaurant(bill.restaurant);

    const parsedServiceRating = parseOptionalRating(serviceRating);
    if (settings.collectService && parsedServiceRating === undefined) {
      return res.status(400).json({ success: false, message: "Service rating must be between 1 and 5" });
    }

    const parsedAmbianceRating = parseOptionalRating(ambianceRating);
    if (settings.collectAmbiance && parsedAmbianceRating === undefined) {
      return res.status(400).json({ success: false, message: "Ambiance rating must be between 1 and 5" });
    }

    const existing = await Feedback.findOne({ bill: billId });
    if (existing) {
      return res.status(409).json({ success: false, message: "Feedback already submitted for this bill" });
    }

    // Only accept ratings for items that were actually on this bill's order.
    const orderedMenuItemIds = new Set(
      (bill.order?.items || [])
        .filter((item) => item.status !== "CANCELLED" && item.menuItem)
        .map((item) => String(item.menuItem._id))
    );
    const menuItemNameById = new Map(
      (bill.order?.items || [])
        .filter((item) => item.menuItem)
        .map((item) => [String(item.menuItem._id), item.menuItem.name || "Item"])
    );

    const cleanItemRatings =
      settings.collectItemRatings && Array.isArray(itemRatings)
        ? itemRatings
            .filter((entry) => entry && orderedMenuItemIds.has(String(entry.menuItemId)))
            .map((entry) => {
              const itemRatingNum = Number(entry.rating);
              return {
                menuItem: entry.menuItemId,
                name: menuItemNameById.get(String(entry.menuItemId)) || "Item",
                rating: itemRatingNum,
              };
            })
            .filter((entry) => entry.rating >= 1 && entry.rating <= 5)
        : [];

    const feedback = await Feedback.create({
      restaurant: bill.restaurant,
      bill: bill._id,
      order: bill.order?._id || null,
      customerName: settings.collectCustomerName
        ? String(customerName || bill.customerName || "").trim()
        : "",
      customerPhone: bill.customerPhone || "",
      customerEmail: bill.customerEmail || "",
      rating: ratingNum,
      serviceRating: settings.collectService ? parsedServiceRating ?? null : null,
      ambianceRating: settings.collectAmbiance ? parsedAmbianceRating ?? null : null,
      itemRatings: cleanItemRatings,
      comment: settings.collectComment ? String(comment || "").trim() : "",
      submittedVia: req.body.via === "email" ? "email" : req.body.via === "whatsapp" ? "whatsapp" : "direct",
    });

    res.status(201).json({ success: true, message: "Thank you for your feedback!", data: feedback });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: "Feedback already submitted for this bill" });
    }
    logger.error({ err }, "Failed to submit public feedback");
    res.status(500).json({ success: false, message: err.message });
  }
};

const ensureRestaurantAccess = async (req, restaurantId) => {
  if (req.user.role === "admin") {
    return Restaurant.findOne({ _id: restaurantId, admin: req.user.id });
  }
  if (req.user.role === "manager") {
    if (String(req.user.restaurant) !== String(restaurantId)) return null;
    return Restaurant.findById(restaurantId);
  }
  return null;
};

/* ===============================
   ADMIN / MANAGER · GET FEEDBACK FOR A RESTAURANT
=============================== */
const getRestaurantFeedback = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const restaurant = await ensureRestaurantAccess(req, restaurantId);
    if (!restaurant) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const feedback = await Feedback.find({ restaurant: restaurantId })
      .sort({ createdAt: -1 })
      .populate("bill", "billNo totalAmount")
      .lean();

    const summary = feedback.reduce(
      (acc, f) => {
        acc.total += 1;
        acc.ratingSum += f.rating;
        if (f.serviceRating) {
          acc.serviceSum += f.serviceRating;
          acc.serviceCount += 1;
        }
        if (f.ambianceRating) {
          acc.ambianceSum += f.ambianceRating;
          acc.ambianceCount += 1;
        }
        return acc;
      },
      { total: 0, ratingSum: 0, serviceSum: 0, serviceCount: 0, ambianceSum: 0, ambianceCount: 0 }
    );

    res.json({
      success: true,
      data: feedback,
      summary: {
        total: summary.total,
        averageRating: summary.total ? Number((summary.ratingSum / summary.total).toFixed(2)) : 0,
        averageServiceRating: summary.serviceCount
          ? Number((summary.serviceSum / summary.serviceCount).toFixed(2))
          : 0,
        averageAmbianceRating: summary.ambianceCount
          ? Number((summary.ambianceSum / summary.ambianceCount).toFixed(2))
          : 0,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.mes