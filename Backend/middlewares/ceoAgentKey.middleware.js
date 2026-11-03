import Admin from "../models/Admin.model.js";
import Restaurant from "../models/Restaurant.model.js";
import { apiKeyMatches, parseApiKey } from "../utils/ceoAgentKey.js";

// Lets the CEO Agent call the data API with "Authorization: Bearer <key>".
// A key belongs to one admin, so it can only ever see that admin's restaurants.
const ceoAgentKey = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const key = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    const parsed = parseApiKey(key);

    // Same answer for every failure, so nothing is revealed about which keys exist.
    const denied = () =>
      res.status(401).json({ success: false, message: "Invalid API key" });

    if (!parsed) return denied();

    const admin = await Admin.findById(parsed.adminId)
      .select("+ceoAgentApiKeyHash isActive")
      .lean();
    if (!admin || admin.isActive === false) return denied();
    if (!apiKeyMatches(key, admin.ceoAgentApiKeyHash)) return denied();

    const restaurants = await Restaurant.find({ admin: admin._id }).select("_id").lean();
    req.ceoAgent = {
      adminId: String(admin._id),
      restaurantIds: restaurants.map((r) => r._id),
    };

    next();
  } catch (err) {
    next(err);
  }
};

export default ceoAgentKey;
