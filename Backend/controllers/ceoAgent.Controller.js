import crypto from "crypto";
import Admin from "../models/Admin.model.js";
import CeoAgentResult from "../models/CeoAgentResult.model.js";
import { generateApiKey, hashApiKey } from "../utils/ceoAgentKey.js";

// How long a sign-in link stays valid. It only has to survive one redirect.
const TOKEN_LIFETIME_MS = 60 * 1000;

const toBase64Url = (value) => Buffer.from(value).toString("base64url");

const readConfig = () => {
  const secret = String(process.env.ERP_SSO_SECRET || "").trim();
  const baseUrl = String(process.env.CEO_AGENT_URL || "").trim();

  if (!secret || !baseUrl) return null;

  let parsed;
  try {
    parsed = new URL(baseUrl);
  } catch {
    return null;
  }

  // The token travels in the link, so never send it over plain http in production.
  if (process.env.NODE_ENV === "production" && parsed.protocol !== "https:") {
    return null;
  }

  return { secret, baseUrl: parsed };
};

/* =========================================================
   POST /api/crm/ceo-agent/sso   (admin)
   Returns a short-lived signed link that signs the admin in to the
   CEO Agent. The secret stays on the server; the browser only
   receives the finished link.

   Each admin account is one company (tenant) on the CEO Agent side: the
   admin's id is the permanent company id, so every restaurant of that
   admin shares one CEO Agent workspace.
========================================================= */
export const createCeoAgentSsoLink = async (req, res) => {
  try {
    const config = readConfig();
    if (!config) {
      return res.status(503).json({
        success: false,
        message: "CEO Agent is not configured yet. Please contact support.",
      });
    }

    const admin = await Admin.findById(req.user.id)
      .select("email businessName")
      .lean();
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    const payload = toBase64Url(
      JSON.stringify({
        // Permanent company id. Never use something that can change.
        erpOrgId: String(admin._id),
        erpUserId: String(admin._id),
        email: admin.email,
        name: admin.businessName || admin.email,
        orgName: admin.businessName || admin.email,
        exp: Date.now() + TOKEN_LIFETIME_MS,
      })
    );
    const signature = crypto
      .createHmac("sha256", config.secret)
      .update(payload)
      .digest("base64url");

    const url = new URL("/sso/erp", config.baseUrl);
    url.searchParams.set("token", `${payload}.${signature}`);

    res.json({ success: true, data: { url: url.toString() } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not open the CEO Agent" });
  }
};

/* =========================================================
   API KEY (admin)
   The CEO Agent uses this key to read the admin's data. Only a hash is
   stored; the key is shown once. Creating a new key cancels the old one.
========================================================= */
export const getCeoAgentApiKeyStatus = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select("ceoAgentApiKeyCreatedAt").lean();
    res.json({
      success: true,
      data: {
        hasKey: Boolean(admin?.ceoAgentApiKeyCreatedAt),
        createdAt: admin?.ceoAgentApiKeyCreatedAt || null,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: "Could not load API key status" });
  }
};

export const createCeoAgentApiKey = async (req, res) => {
  try {
    const key = generateApiKey(req.user.id);
    const updated = await Admin.findByIdAndUpdate(
      req.user.id,
      { $set: { ceoAgentApiKeyHash: hashApiKey(key), ceoAgentApiKeyCreatedAt: new Date() } },
      { projection: { _id: 1 } }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    res.json({
      success: true,
      data: { apiKey: key },
      message: "Copy this key now. It will not be shown again.",
    });
  } catch {
    res.status(500).json({ success: false, message: "Could not create API key" });
  }
};

/* =========================================================
   MARKETING RESULTS (admin)
   What the CEO Agent sent back, newest first.
========================================================= */
export const listCeoAgentResults = async (req, res) => {
  try {
    const results = await CeoAgentResult.find({ admin: req.user.id })
      .sort({ updatedAt: -1 })
      .limit(100)
      .populate("restaurant", "name")
      .select("-targetCustomerIds")
      .lean();

    res.json({
      success: true,
      data: results.map((r) => ({
        id: String(r._id),
        campaignId: r.campaignId,
        channel: r.channel,
        restaurantName: r.restaurant?.name || "",
        sentAt: r.sentAt,
        updatedAt: r.updatedAt,
        metrics: r.metrics instanceof Map ? Object.fromEntries(r.metrics) : r.metrics || {},
      })),
    });
  } catch {
    res.status(500).json({ success: false, message: "Could not load marketing results" });
  }
};
