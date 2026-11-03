import mongoose from "mongoose";
import Bill from "../models/Bill.model.js";
import Menu from "../models/Menu.model.js";
import Order from "../models/Order.model.js";
import CeoAgentResult from "../models/CeoAgentResult.model.js";

/* =========================================================
   DATA API FOR THE CEO AGENT
   Every call is limited to the restaurants of the admin the API
   key belongs to. Lists are paginated: ?page=1&limit=100 (max 500).
   Optional ?restaurantId= narrows a call to one restaurant.
========================================================= */

const CURRENCY = String(process.env.CEO_AGENT_CURRENCY || "INR").trim() || "INR";
const EMAIL_KEY_PREFIX = "email:";
const MAX_LIMIT = 500;

const paging = (req) => {
  const page = Math.max(1, Math.floor(Number(req.query.page)) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Math.floor(Number(req.query.limit)) || 100));
  return { page, limit, skip: (page - 1) * limit };
};

const sinceDate = (req, names) => {
  for (const name of names) {
    const raw = req.query[name];
    if (!raw) continue;
    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) {
      throw Object.assign(new Error(`Invalid ${name}`), { status: 400 });
    }
    return date;
  }
  return null;
};

// All of the admin's restaurants, or just one if ?restaurantId= is given.
const scopedRestaurants = (req, restaurantId) => {
  const wanted = restaurantId || req.query.restaurantId;
  if (!wanted) return req.ceoAgent.restaurantIds;

  const match = req.ceoAgent.restaurantIds.find((id) => String(id) === String(wanted));
  if (!match) {
    throw Object.assign(new Error("Restaurant not found"), { status: 404 });
  }
  return [match];
};

const envelope = (data, { page, limit }, total) => ({
  success: true,
  data,
  page,
  limit,
  total,
  hasMore: page * limit < total,
});

// Customers are identified by phone, or by email when there is no phone.
const customerKey = (restaurantId, phone, email) => {
  const key = phone || (email ? `${EMAIL_KEY_PREFIX}${email}` : "");
  return key ? `${restaurantId}:${key}` : null;
};

const handle = (fn) => async (req, res, next) => {
  try {
    await fn(req, res);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ success: false, message: err.message });
    next(err);
  }
};

/* ===============================
   GET /customers
=============================== */
export const listCustomers = handle(async (req, res) => {
  const pg = paging(req);
  const restaurants = scopedRestaurants(req);
  const since = sinceDate(req, ["updated_since", "since"]);

  const hasPhone = { $and: [{ $ne: ["$customerPhone", null] }, { $ne: ["$customerPhone", ""] }] };

  const [result] = await Bill.aggregate([
    {
      $match: {
        restaurant: { $in: restaurants },
        $or: [{ customerPhone: { $nin: [null, ""] } }, { customerEmail: { $nin: [null, ""] } }],
      },
    },
    {
      $addFields: {
        customerKey: {
          $cond: [hasPhone, "$customerPhone", { $concat: [EMAIL_KEY_PREFIX, "$customerEmail"] }],
        },
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: { restaurant: "$restaurant", key: "$customerKey" },
        email: { $first: "$customerEmail" },
        phone: { $first: "$customerPhone" },
        lastOrder: { $first: "$order" },
        totalVisits: { $sum: 1 },
        totalSpend: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "PAID"] }, "$totalAmount", 0] },
        },
        createdAt: { $min: "$createdAt" },
        updatedAt: { $max: "$updatedAt" },
      },
    },
    ...(since ? [{ $match: { updatedAt: { $gte: since } } }] : []),
    { $sort: { updatedAt: 1, "_id.key": 1 } },
    {
      $facet: {
        rows: [{ $skip: pg.skip }, { $limit: pg.limit }],
        total: [{ $count: "n" }],
      },
    },
  ]);

  const rows = result?.rows || [];
  const total = result?.total?.[0]?.n || 0;

  // Bills carry no customer name; take it from the customer's latest order.
  const orders = await Order.find({ _id: { $in: rows.map((r) => r.lastOrder) } })
    .select("customerName")
    .lean();
  const nameByOrder = new Map(orders.map((o) => [String(o._id), o.customerName || ""]));

  const data = rows.map((row) => ({
    id: `${row._id.restaurant}:${row._id.key}`,
    restaurantId: String(row._id.restaurant),
    name: nameByOrder.get(String(row.lastOrder)) || "",
    email: row.email || "",
    phone: row.phone || "",
    totalVisits: row.totalVisits,
    totalSpend: row.totalSpend,
    segment: row.totalVisits >= 2 ? "repeat" : "new",
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));

  res.json(envelope(data, pg, total));
});

/* ===============================
   GET /orders   (billed sales)
=============================== */
const SALE_STATUS = { PAID: "paid", PENDING: "placed", VOID: "cancelled" };

export const listOrders = handle(async (req, res) => {
  const pg = paging(req);
  const restaurants = scopedRestaurants(req);
  const since = sinceDate(req, ["since", "updated_since"]);

  const filter = { restaurant: { $in: restaurants } };
  if (since) filter.updatedAt = { $gte: since };

  const [bills, total] = await Promise.all([
    Bill.find(filter)
      .sort({ updatedAt: 1, _id: 1 })
      .skip(pg.skip)
      .limit(pg.limit)
      .populate("order", "items orderNo orderType")
      .lean(),
    Bill.countDocuments(filter),
  ]);

  const data = bills.map((bill) => ({
    id: String(bill._id),
    restaurantId: String(bill.restaurant),
    billNo: bill.billNo,
    orderNo: bill.order?.orderNo || "",
    orderType: bill.order?.orderType || "",
    customerId: customerKey(bill.restaurant, bill.customerPhone, bill.customerEmail),
    amount: bill.totalAmount,
    currency: CURRENCY,
    status: SALE_STATUS[bill.paymentStatus] || "placed",
    paymentMethod: bill.paymentMethod || "",
    createdAt: bill.createdAt,
    updatedAt: bill.updatedAt,
    items: (bill.order?.items || [])
      .filter((item) => item.status !== "CANCELLED")
      .map((item) => ({
        productId: String(item.menuItem),
        qty: item.quantity,
        price: item.price,
      })),
  }));

  res.json(envelope(data, pg, total));
});

/* ===============================
   GET /products   (menu items)
   Menu items are made to order, so there is no stock count: stockLevel
   is null and isAvailable says whether the item can be ordered.
=============================== */
export const listProducts = handle(async (req, res) => {
  const pg = paging(req);
  const restaurants = scopedRestaurants(req);
  const since = sinceDate(req, ["updated_since", "since"]);

  const filter = { restaurant: { $in: restaurants } };
  if (since) filter.updatedAt = { $gte: since };

  const [items, total] = await Promise.all([
    Menu.find(filter)
      .sort({ updatedAt: 1, _id: 1 })
      .skip(pg.skip)
      .limit(pg.limit)
      .populate("cuisine", "name")
      .select("restaurant name price menuCode cuisine courseType description isAvailable updatedAt")
      .lean(),
    Menu.countDocuments(filter),
  ]);

  const data = items.map((item) => ({
    id: String(item._id),
    restaurantId: String(item.restaurant),
    sku: item.menuCode || "",
    name: item.name,
    price: item.price,
    category: item.cuisine?.name || "",
    courseType: item.courseType || "",
    description: item.description || "",
    isAvailable: item.isAvailable !== false,
    stockLevel: null,
    updatedAt: item.updatedAt,
  }));

  res.json(envelope(data, pg, total));
});

/* ===============================
   POST /marketing-results
=============================== */
const cleanMetrics = (metrics) => {
  if (!metrics || typeof metrics !== "object" || Array.isArray(metrics)) return null;
  const entries = Object.entries(metrics);
  if (entries.length === 0 || entries.length > 20) return null;

  const clean = {};
  for (const [name, value] of entries) {
    const number = Number(value);
    if (!/^[A-Za-z][A-Za-z0-9_]{0,39}$/.test(name) || !Number.isFinite(number) || number < 0) {
      return null;
    }
    clean[name] = number;
  }
  return clean;
};

export const saveMarketingResult = handle(async (req, res) => {
  const { campaignId, channel, sentAt, targetCustomerIds, metrics, restaurantId } = req.body || {};

  const metricValues = cleanMetrics(metrics);
  const bad = (message) => res.status(400).json({ success: false, message });

  if (!campaignId || typeof campaignId !== "string") return bad("campaignId is required");
  if (!channel || typeof channel !== "string") return bad("channel is required");
  if (!metricValues) return bad("metrics must be an object of up to 20 non-negative numbers");

  let sent = null;
  if (sentAt) {
    sent = new Date(sentAt);
    if (Number.isNaN(sent.getTime())) return bad("Invalid sentAt");
  }

  if (
    targetCustomerIds !== undefined &&
    (!Array.isArray(targetCustomerIds) ||
      targetCustomerIds.length > 5000 ||
      targetCustomerIds.some((id) => typeof id !== "string"))
  ) {
    return bad("targetCustomerIds must be a list of up to 5000 ids");
  }

  let restaurant = null;
  if (restaurantId) {
    if (!mongoose.isValidObjectId(restaurantId)) return bad("Invalid restaurantId");
    [restaurant] = scopedRestaurants(req, restaurantId);
  }

  const saved = await CeoAgentResult.findOneAndUpdate(
    {
      admin: req.ceoAgent.adminId,
      campaignId: campaignId.trim(),
      channel: channel.trim().toLowerCase(),
    },
    {
      $set: {
        restaurant,
        sentAt: sent,
        targetCustomerIds: targetCustomerIds || [],
        metrics: metricValues,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true, projection: { _id: 1 } }
  );

  res.status(201).json({ success: true, data: { id: String(saved._id) } });
});
