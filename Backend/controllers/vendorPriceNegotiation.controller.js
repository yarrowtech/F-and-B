import mongoose from "mongoose";
import Restaurant from "../models/Restaurant.model.js";
import Vendor from "../models/Vendor.model.js";
import VendorProduct from "../models/VendorProduct.model.js";
import VendorPriceNegotiation from "../models/VendorPriceNegotiation.model.js";

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
const asText = (value) => String(value || "").trim();
const asPrice = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Number(parsed.toFixed(2)) : null;
};

const serialize = (negotiation) => ({
  id: negotiation._id,
  vendor: negotiation.vendor,
  admin: negotiation.admin,
  restaurant: negotiation.restaurant,
  product: negotiation.product,
  status: negotiation.status,
  agreedPrice: negotiation.agreedPrice,
  messages: negotiation.messages,
  updatedAt: negotiation.updatedAt,
  createdAt: negotiation.createdAt,
});

const canAdminUseRestaurant = async (adminId, restaurantId) =>
  Boolean(await Restaurant.exists({ _id: restaurantId, admin: adminId }));

export const getNegotiations = async (req, res) => {
  try {
    const vendorId = req.params.id;
    if (!isObjectId(vendorId)) return res.status(400).json({ success: false, message: "Invalid vendor" });

    const query = { vendor: vendorId };
    if (req.user.role === "vendor") {
      if (String(req.user.id) !== String(vendorId)) {
        return res.status(403).json({ success: false, message: "Access denied" });
      }
    } else if (req.user.role === "admin") {
      query.admin = req.user.id;
    } else {
      return res.status(403).json({ success: false, message: "Access denied" });
    }
    if (isObjectId(req.query.productId)) query.product = req.query.productId;
    if (isObjectId(req.query.restaurantId)) query.restaurant = req.query.restaurantId;

    const negotiations = await VendorPriceNegotiation.find(query)
      .populate("admin", "name businessName email")
      .populate("restaurant", "name")
      .populate("product", "name price unit")
      .sort({ updatedAt: -1 });
    return res.json({ success: true, negotiations: negotiations.map(serialize) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createOffer = async (req, res) => {
  try {
    const vendorId = req.params.id;
    const productId = req.params.productId;
    const restaurantId = req.body.restaurantId;
    let offeredPrice = asPrice(req.body.offeredPrice);
    const text = asText(req.body.text);
    if (![vendorId, productId, restaurantId].every(isObjectId) || offeredPrice === null) {
      return res.status(400).json({ success: false, message: "Restaurant, product, and offer price are required" });
    }
    if (!(await canAdminUseRestaurant(req.user.id, restaurantId))) {
      return res.status(403).json({ success: false, message: "Restaurant access denied" });
    }
    const product = await VendorProduct.findOne({ _id: productId, vendor: vendorId, isActive: true });
    if (!product?.isPriceNegotiable) {
      return res.status(400).json({ success: false, message: "This product is not negotiable" });
    }
    const negotiation = await VendorPriceNegotiation.findOneAndUpdate(
      { vendor: vendorId, admin: req.user.id, restaurant: restaurantId, product: productId },
      {
        $set: { status: "open", agreedPrice: null },
        $push: { messages: { senderRole: "admin", sender: req.user.id, text, offeredPrice } },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return res.status(201).json({ success: true, negotiation: serialize(negotiation) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const replyToNegotiation = async (req, res) => {
  try {
    const negotiationId = req.params.negotiationId;
    if (!isObjectId(negotiationId)) return res.status(400).json({ success: false, message: "Invalid negotiation" });
    const negotiation = await VendorPriceNegotiation.findById(negotiationId);
    if (!negotiation) return res.status(404).json({ success: false, message: "Negotiation not found" });
    const isVendor = req.user.role === "vendor" && String(req.user.id) === String(negotiation.vendor);
    const isAdmin = req.user.role === "admin" && String(req.user.id) === String(negotiation.admin);
    if (!isVendor && !isAdmin) return res.status(403).json({ success: false, message: "Access denied" });

    const action = asText(req.body.action).toLowerCase();
    let offeredPrice = asPrice(req.body.offeredPrice);
    const text = asText(req.body.text);
    if (action === "accept") {
      if (!isVendor) {
        return res.status(403).json({ success: false, message: "Only vendor can accept an offer" });
      }
      if (offeredPrice === null) {
        const latestOffer = [...negotiation.messages]
          .reverse()
          .find((entry) => entry.offeredPrice !== null && entry.offeredPrice !== undefined);
        offeredPrice = latestOffer ? asPrice(latestOffer.offeredPrice) : null;
      }
      if (offeredPrice === null) {
        return res.status(400).json({ success: false, message: "Ask the admin to send an offer price first" });
      }
      negotiation.status = "accepted";
      negotiation.agreedPrice = offeredPrice;
    } else if (action === "reject") {
      if (!isVendor) return res.status(403).json({ success: false, message: "Only vendor can reject an offer" });
      negotiation.status = "rejected";
      negotiation.agreedPrice = null;
    } else if (offeredPrice === null && !text) {
      return res.status(400).json({ success: false, message: "Add a message or offer price" });
    } else {
      negotiation.status = "open";
      negotiation.agreedPrice = null;
    }
    negotiation.messages.push({ senderRole: isVendor ? "vendor" : "admin", sender: req.user.id, text, offeredPrice });
    await negotiation.save();
    return res.json({ success: true, negotiation: serialize(negotiation) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default { getNegotiations, createOffer, replyToNegotiation };
