import crypto from "crypto";
import mongoose from "mongoose";
import Feedback from "../models/Feedback.model.js";
import Restaurant from "../models/Restaurant.model.js";
import StampSettings from "../models/StampSettings.model.js";
import StampCard from "../models/StampCard.model.js";
import logger from "../utils/pinoLogger.js";

const DEFAULT_SETTINGS = {
  enabled: true,
  stampsRequired: 5,
  rewardTitle: "Free dessert",
  rewardDescription: "",
  rewardValidityDays: 30,
  cooldownHours: 24,
  welcomeMessage: "Review us and collect a stamp!",
};

const getSettings = async (restaurantId) => {
  const settings = await StampSettings.findOne({ restaurant: restaurantId }).lean();
  return { ...DEFAULT_SETTINGS, ...(settings || {}) };
};

const normalizePhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
};

const makeRewardCode = () => crypto.randomBytes(3).toString("hex").toUpperCase();

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const publicCardView = (card, settings) => ({
  stamps: card.stamps,
  totalStamps: card.totalStamps,
  stampsRequired: settings.stampsRequired,
  rewards: (card.rewards || [])
    .filter((r) => !r.redeemed && (!r.expiresAt || r.expiresAt > new Date()))
    .map((r) => ({
      code: r.code,
      title: r.title,
      description: r.description,
      expiresAt: r.expiresAt,
    })),
});

/* ===============================
   PUBLIC · STAMP FORM CONTEXT
=============================== */
const getPublicStampContext = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    if (!isValidId(restaurantId)) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }
    const restaurant = await Restaurant.findById(restaurantId).select("name isActive").lean();
    if (!restaurant || restaurant.isActive === false) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }
    const settings = await getSettings(restaurantId);
    res.json({
      success: true,
      data: {
        restaurantName: restaurant.name,
        enabled: settings.enabled,
        stampsRequired: settings.stampsRequired,
        rewardTitle: settings.rewardTitle,
        rewardDescription: settings.rewardDescription,
        welcomeMessage: settings.welcomeMessage,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ===============================
   PUBLIC · SUBMIT REVIEW -> EARN STAMP
=============================== */
const submitPublicStampReview = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    if (!isValidId(restaurantId)) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }

    const name = String(req.body.name || "").trim().slice(0, 80);
    const phone = normalizePhone(req.body.phone);
    const rating = Number(req.body.rating);
    const comment = String(req.body.comment || "").trim().slice(0, 1000);

    if (!name) return res.status(400).json({ success: false, message: "Please enter your name" });
    if (phone.length !== 10) {
      return res.status(400).json({ success: false, message: "Please enter a valid 10-digit phone number" });
    }
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Please give a rating between 1 and 5" });
    }

    const restaurant = await Restaurant.findById(restaurantId).select("name isActive").lean();
    if (!restaurant || restaurant.isActive === false) {
      return res.status(404).json({ success: false, message: "Restaurant not found" });
    }
    const settings = await getSettings(restaurantId);
    if (!settings.enabled) {
      return res.status(403).json({ success: false, message: "Stamp rewards are not active right now" });
    }

    const now = new Date();
    const cutoff = new Date(now.getTime() - settings.cooldownHours * 3600 * 1000);
    const tooSoon = {
      success: false,
      message: `You already collected a stamp recently. Please come back after ${settings.cooldownHours} hours.`,
    };

    // Atomic: only matches a new card, or one whose last stamp is outside the cooldown.
    let card;
    try {
      card = await StampCard.findOneAndUpdate(
        {
          restaurant: restaurantId,
          customerPhone: phone,
          $or: [{ lastStampAt: null }, { lastStampAt: { $lte: cutoff } }],
        },
        {
          $inc: { stamps: 1, totalStamps: 1 },
          $set: { lastStampAt: now, customerName: name },
          $setOnInsert: { restaurant: restaurantId, customerPhone: phone },
        },
        { new: true, upsert: true }
      );
    } catch (err) {
      // Card exists but is inside the cooldown window, so the upsert hit the unique index.
      if (err.code === 11000) return res.status(429).json(tooSoon);
      throw err;
    }

    // Reward reached: atomically convert the required stamps into a reward.
    let newReward = null;
    if (card.stamps >= settings.stampsRequired) {
      const reward = {
        code: makeRewardCode(),
        title: settings.rewardTitle,
        description: settings.rewardDescription,
        earnedAt: now,
        expiresAt: new Date(now.getTime() + settings.rewardValidityDays * 86400 * 1000),
      };
      const updated = await StampCard.findOneAndUpdate(
        { _id: card._id, stamps: { $gte: settings.stampsRequired } },
        { $inc: { stamps: -settings.stampsRequired }, $push: { rewards: reward } },
        { new: true }
      );
      if (updated) {
        card = updated;
        newReward = reward;
      }
    }

    try {
      await Feedback.create({
        restaurant: restaurantId,
        source: "stamp",
        customerName: name,
        customerPhone: phone,
        rating,
        comment,
        submittedVia: "direct",
      });
    } catch (err) {
      logger.error({ err }, "Stamp granted but feedback record failed");
    }

    res.status(201).json({
      success: true,
      message: newReward ? "Reward unlocked!" : "Stamp collected!",
      data: {
        restaurantName: restaurant.name,
        rewardUnlocked: Boolean(newReward),
        newReward: newReward
          ? { code: newReward.code, title: newReward.title, expiresAt: newReward.expiresAt }
          : null,
        card: publicCardView(card, settings),
      },
    });
  } catch (err) {
    logger.error({ err }, "Failed to submit stamp review");
    res.status(500).json({ success: false, message: err.message });
  }
};

/* ===============================
   ADMIN / MANAGER
=============================== */
const ensureRestaurantAccess = async (req, restaurantId) => {
  if (!isValidId(restaurantId)) return null;
  if (req.user.role === "admin") {
    return Restaurant.findOne({ _id: restaurantId, admin: req.user.id });
  }
  if (req.user.role === "manager") {
    if (String(req.user.restaurant) !== String(restaurantId)) return null;
    return Restaurant.findById(restaurantId);
  }
  return null;
};

const getStampOverview = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const restaurant = await ensureRestaurantAccess(req, restaurantId);
    if (!restaurant) return res.status(403).json({ success: false, message: "Access denied" });

    const settings = await getSettings(restaurantId);
    const [cards, reviews] = await Promise.all([
      StampCard.find({ restaurant: restaurantId }).sort({ lastStampAt: -1 }).limit(300).lean(),
      Feedback.find({ restaurant: restaurantId, source: "stamp" })
        .sort({ createdAt: -1 })
        .limit(300)
        .select("customerName customerPhone rating comment createdAt")
        .lean(),
    ]);

    const now = new Date();
    let rewardsEarned = 0;
    let rewardsRedeemed = 0;
    let totalStamps = 0;
    cards.forEach((c) => {
      totalStamps += c.totalStamps || 0;
      (c.rewards || []).forEach((r) => {
        rewardsEarned += 1;
        if (r.redeemed) rewardsRedeemed += 1;
      });
    });

    const ratingSum = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);

    res.json({
      success: true,
      data: {
        restaurant: { _id: restaurant._id, name: restaurant.name },
        settings,
        stats: {
          customers: cards.length,
          totalStamps,
          reviews: reviews.length,
          averageRating: reviews.length ? Number((ratingSum / reviews.length).toFixed(2)) : 0,
          rewardsEarned,
          rewardsRedeemed,
        },
        cards: cards.map((c) => ({
          _id: c._id,
          customerName: c.customerName,
          customerPhone: c.customerPhone,
          stamps: c.stamps,
          totalStamps: c.totalStamps,
          lastStampAt: c.lastStampAt,
          rewards: (c.rewards || []).map((r) => ({
            _id: r._id,
            code: r.code,
            title: r.title,
            description: r.description,
            earnedAt: r.earnedAt,
            expiresAt: r.expiresAt,
            redeemed: r.redeemed,
            redeemedAt: r.redeemedAt,
            expired: !r.redeemed && r.expiresAt ? r.expiresAt <= now : false,
          })),
        })),
        reviews,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const updateStampSettings = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    if (req.user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Only admins can change reward settings" });
    }
    const restaurant = await ensureRestaurantAccess(req, restaurantId);
    if (!restaurant) return res.status(403).json({ success: false, message: "Access denied" });

    const body = req.body || {};
    const updates = {};
    const clampInt = (value, min, max) => {
      const n = Math.round(Number(value));
      return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : undefined;
    };

    if (typeof body.enabled === "boolean") updates.enabled = body.enabled;

    if (body.stampsRequired !== undefined) {
      const n = clampInt(body.stampsRequired, 1, 50);
      if (n === undefined) return res.status(400).json({ success: false, message: "Invalid stamps required" });
      updates.stampsRequired = n;
    }
    if (body.rewardValidityDays !== undefined) {
      const n = clampInt(body.rewardValidityDays, 1, 365);
      if (n === undefined) return res.status(400).json({ success: false, message: "Invalid validity days" });
      updates.rewardValidityDays = n;
    }
    if (body.cooldownHours !== undefined) {
      const n = clampInt(body.cooldownHours, 0, 720);
      if (n === undefined) return res.status(400).json({ success: false, message: "Invalid cooldown" });
      updates.cooldownHours = n;
    }
    if (typeof body.rewardTitle === "string") {
      const title = body.rewardTitle.trim().slice(0, 80);
      if (!title) return res.status(400).json({ success: false, message: "Reward name is required" });
      updates.rewardTitle = title;
    }
    if (typeof body.rewardDescription === "string") {
      updates.rewardDescription = body.rewardDescription.trim().slice(0, 300);
    }
    if (typeof body.welcomeMessage === "string") {
      updates.welcomeMessage =
        body.welcomeMessage.trim().slice(0, 200) || DEFAULT_SETTINGS.welcomeMessage;
    }

    const settings = await StampSettings.findOneAndUpdate(
      { restaurant: restaurantId },
      { $set: updates, $setOnInsert: { restaurant: restaurantId } },
      { new: true, upsert: true }
    ).lean();

    res.json({ success: true, message: "Reward settings saved", data: { ...DEFAULT_SETTINGS, ...settings } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const redeemStampReward = async (req, res) => {
  try {
    const { restaurantId, cardId, rewardId } = req.params;
    const restaurant = await ensureRestaurantAccess(req, restaurantId);
    if (!restaurant) return res.status(403).json({ success: false, message: "Access denied" });
    if (!isValidId(cardId) || !isValidId(rewardId)) {
      return res.status(404).json({ success: false, message: "Reward not found" });
    }

    const now = new Date();
    const card = await StampCard.findOneAndUpdate(
      {
        _id: cardId,
        restaurant: restaurantId,
        rewards: {
          $elemMatch: {
            _id: new mongoose.Types.ObjectId(rewardId),
            redeemed: false,
            $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }],
          },
        },
      },
      {
        $set: {
          "rewards.$.redeemed": true,
          "rewards.$.redeemedAt": now,
          "rewards.$.redeemedBy": req.user.id,
        },
      },
      { new: true }
    ).lean();

    if (!card) {
      return res
        .status(409)
        .json({ success: false, message: "Reward is already redeemed, expired or not found" });
    }
    res.json({ success: true, message: "Reward marked as redeemed" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export default {
  getPublicStampContext,
  submitPublicStampReview,
  getStampOverview,
  updateStampSettings,
  redeemStampReward,
};
