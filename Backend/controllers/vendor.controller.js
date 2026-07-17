import crypto from "crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Restaurant from "../models/Restaurant.model.js";
import Vendor from "../models/Vendor.model.js";
import VendorOrder from "../models/VendorOrder.model.js";
import {
  isMailerConfigured,
  sendVendorInvitationEmail,
} from "../utils/mailer.js";

const toObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value)
    ? new mongoose.Types.ObjectId(value)
    : null;

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();
const normalizeVendorId = (vendorId = "") => String(vendorId).trim().toUpperCase();
const normalizeGovernmentIdType = (value = "") => String(value).trim().toUpperCase();
const INVITATION_EXPIRY_HOURS = 72;
const normalizeAddress = (address = {}) => {
  if (typeof address === "string") {
    return {
      line1: address.trim(),
      line2: "",
      landmark: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
    };
  }

  return {
    line1: String(address?.line1 || "").trim(),
    line2: String(address?.line2 || "").trim(),
    landmark: String(address?.landmark || "").trim(),
    city: String(address?.city || "").trim(),
    state: String(address?.state || "").trim(),
    pincode: String(address?.pincode || "").trim(),
    country: String(address?.country || "India").trim(),
  };
};

const sanitizeRestaurantIds = (restaurantIds = []) => [
  ...new Set(
    (Array.isArray(restaurantIds) ? restaurantIds : [])
      .map((id) => toObjectId(id))
      .filter(Boolean)
      .map((id) => id.toString())
  ),
];

const getVendorRestaurantIds = (vendor) =>
  sanitizeRestaurantIds(
    vendor?.accessibleRestaurants?.length
      ? vendor.accessibleRestaurants.map((restaurant) =>
          restaurant?._id ? restaurant._id.toString() : restaurant?.toString?.() || restaurant
        )
      : [vendor?.primaryRestaurant?._id || vendor?.primaryRestaurant].filter(Boolean)
  );

const buildVendorResponse = (vendor, lastOrder = null) => ({
  id: vendor._id,
  _id: vendor._id,
  vendorId: vendor.vendorId,
  name: vendor.name,
  email: vendor.email,
  phone: vendor.phone,
  address: vendor.address,
  governmentId: vendor.governmentId,
  governmentIdType: vendor.governmentIdType,
  category: vendor.category,
  role: "vendor",
  vendorType: vendor.vendorType,
  createdByRole: vendor.createdByRole,
  createdByAdmin: vendor.createdByAdmin,
  createdBySuperAdmin: vendor.createdBySuperAdmin,
  connectedAdmins: vendor.connectedAdmins || [],
  primaryRestaurant: vendor.primaryRestaurant,
  accessibleRestaurants: vendor.accessibleRestaurants || [],
  allRestaurantsAccess: Boolean(vendor.allRestaurantsAccess),
  upgradeRequestStatus: vendor.upgradeRequestStatus,
  upgradedFromVendor: vendor.upgradedFromVendor,
  upgradedToGlobalVendor: vendor.upgradedToGlobalVendor,
  isActive: vendor.isActive,
  invitationStatus: vendor.invitationStatus || "none",
  invitationSentAt: vendor.invitationSentAt,
  invitationExpiresAt: vendor.invitationExpiresAt,
  invitationAcceptedAt: vendor.invitationAcceptedAt,
  createdAt: vendor.createdAt,
  lastOrder: lastOrder
    ? {
        status: lastOrder.status,
        totalAmount: lastOrder.totalAmount,
        createdAt: lastOrder.createdAt,
        completedAt: lastOrder.completedAt,
      }
    : null,
});

const getLatestOrdersByVendor = async (vendorIds) => {
  if (!vendorIds.length) return new Map();

  const latestOrders = await VendorOrder.aggregate([
    { $match: { vendor: { $in: vendorIds } } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: "$vendor", latest: { $first: "$$ROOT" } } },
  ]);

  return new Map(latestOrders.map((entry) => [String(entry._id), entry.latest]));
};

const ensureRestaurantOwnedByAdmin = async (restaurantId, adminId) => {
  if (!restaurantId) return null;

  return Restaurant.findOne({
    _id: restaurantId,
    admin: adminId,
  });
};

const ensureRestaurantsOwnedByAdmin = async (restaurantIds = [], adminId) => {
  const sanitizedIds = sanitizeRestaurantIds(restaurantIds);
  if (sanitizedIds.length === 0) return [];

  const restaurants = await Restaurant.find({
    _id: { $in: sanitizedIds },
    admin: adminId,
  });

  if (restaurants.length !== sanitizedIds.length) {
    return null;
  }

  return restaurants;
};

const getAdminRestaurantIds = async (adminId) => {
  if (!adminId) return [];

  const restaurantIds = await Restaurant.find({ admin: adminId }).distinct("_id");
  return restaurantIds.map((id) => id.toString());
};

const generateVendorId = async (vendorType) => {
  const prefix = vendorType === "global" ? "GV" : "LV";
  const count = await Vendor.countDocuments({ vendorType });
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
};

const generateVendorPassword = (length = 12) => {
  const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$%";
  const bytes = crypto.randomBytes(length);
  let password = "";

  for (let index = 0; index < length; index += 1) {
    password += charset[bytes[index] % charset.length];
  }

  return password;
};

const buildPublicBaseUrl = (req) => {
  const configured = String(
    process.env.FRONTEND_URL || process.env.CLIENT_URL || ""
  ).trim();
  if (configured) return configured.replace(/\/$/, "");

  const forwardedProto = String(req.headers["x-forwarded-proto"] || "").trim();
  const forwardedHost = String(req.headers["x-forwarded-host"] || "").trim();
  const protocol = forwardedProto || req.protocol || "http";
  const host = forwardedHost || req.get("host") || "localhost:5173";

  if (host.includes("localhost:5000")) {
    return `${protocol}://localhost:5173`;
  }

  return `${protocol}://${host}`;
};

const generateInvitationToken = () => crypto.randomBytes(24).toString("hex");
const hashInvitationToken = (token) =>
  crypto.createHash("sha256").update(String(token || "")).digest("hex");

const buildInvitationLink = (req, token) =>
  `${buildPublicBaseUrl(req)}/vendor-invite/${token}`;

const applyVendorInvitation = (vendor, token) => {
  vendor.password = null;
  vendor.isActive = true;
  vendor.invitationStatus = "pending";
  vendor.invitationTokenHash = hashInvitationToken(token);
  vendor.invitationSentAt = new Date();
  vendor.invitationExpiresAt = new Date(
    Date.now() + INVITATION_EXPIRY_HOURS * 60 * 60 * 1000
  );
  vendor.invitationAcceptedAt = null;
};

const isInvitationExpired = (vendor) =>
  !vendor?.invitationExpiresAt ||
  new Date(vendor.invitationExpiresAt).getTime() < Date.now();

const findVendorByInvitationToken = (token) =>
  Vendor.findOne({
    invitationTokenHash: hashInvitationToken(token),
    invitationStatus: "pending",
  })
    .select("+invitationTokenHash +password")
    .populate("primaryRestaurant", "name restaurantCode vendorInventoryIntegration")
    .populate("accessibleRestaurants", "name restaurantCode vendorInventoryIntegration");

const sendInvitationIfPossible = async ({ vendor, req, invitationToken }) => {
  const invitationLink = buildInvitationLink(req, invitationToken);

  if (!isMailerConfigured()) {
    return {
      invitationLink,
      invitationEmailSent: false,
      invitationEmailMessage:
        "SMTP is not fully configured yet. Share the invitation link manually.",
    };
  }

  try {
    await sendVendorInvitationEmail({
      to: vendor.email,
      vendorName: vendor.name,
      vendorId: vendor.vendorId,
      invitationLink,
      expiresAt: vendor.invitationExpiresAt,
    });

    return {
      invitationLink,
      invitationEmailSent: true,
      invitationEmailMessage: `Invitation email sent to ${vendor.email}`,
    };
  } catch (error) {
    console.error("VENDOR INVITATION EMAIL ERROR:", error);
    return {
      invitationLink,
      invitationEmailSent: false,
      invitationEmailMessage:
        error?.message || "Invitation email could not be sent. Share the link manually.",
    };
  }
};

const createToken = (vendor) =>
  jwt.sign(
    {
      id: vendor._id.toString(),
      role: "vendor",
      vendorType: vendor.vendorType,
      restaurantId: vendor.primaryRestaurant?._id || vendor.primaryRestaurant || null,
    },
    process.env.JWT_SECRET,
    { expiresIn: "4d" }
  );

const getScopedVendorQuery = async (user) => {
  if (user.role === "super_admin") {
    return {};
  }

  if (user.role === "admin") {
    const adminRestaurantIds = await getAdminRestaurantIds(user.id);
    const linkedVendorIds = await Vendor.find({
      $or: [
        { createdByAdmin: user.id },
        { primaryRestaurant: { $in: adminRestaurantIds } },
        { accessibleRestaurants: { $in: adminRestaurantIds } },
      ],
    }).distinct("_id");

    return {
      $or: [
        { createdByAdmin: user.id },
        { connectedAdmins: user.id },
        { upgradedFromVendor: { $in: linkedVendorIds } },
        { primaryRestaurant: { $in: adminRestaurantIds } },
        { accessibleRestaurants: { $in: adminRestaurantIds } },
      ],
    };
  }

  if (user.role === "vendor") {
    return { _id: user.id };
  }

  return null;
};

const isAdminLockedFromVendorManagement = (vendor, user) =>
  user?.role === "admin" &&
  String(vendor?.createdByAdmin || "") === String(user?.id || "") &&
  Boolean(vendor?.upgradedToGlobalVendor);

const canAdminAccessVendor = async (adminId, vendorId) => {
  const vendor = await Vendor.findById(vendorId).select(
    "createdByAdmin connectedAdmins upgradedFromVendor vendorType primaryRestaurant accessibleRestaurants"
  );

  if (!vendor) return false;

  if (String(vendor.createdByAdmin || "") === String(adminId || "")) {
    return true;
  }

  if (vendor.connectedAdmins?.some((connectedAdminId) => String(connectedAdminId) === String(adminId))) {
    return true;
  }

  if (!vendor.upgradedFromVendor) {
    const adminRestaurantIds = await getAdminRestaurantIds(adminId);
    const vendorRestaurantIds = getVendorRestaurantIds(vendor);
    return vendorRestaurantIds.some((restaurantId) => adminRestaurantIds.includes(restaurantId));
  }

  const sourceVendor = await Vendor.findById(vendor.upgradedFromVendor).select(
    "createdByAdmin primaryRestaurant accessibleRestaurants"
  );

  if (String(sourceVendor?.createdByAdmin || "") === String(adminId || "")) {
    return true;
  }

  const adminRestaurantIds = await getAdminRestaurantIds(adminId);
  const sourceRestaurantIds = getVendorRestaurantIds(sourceVendor);
  return sourceRestaurantIds.some((restaurantId) => adminRestaurantIds.includes(restaurantId));
};

export const loginVendor = async (req, res) => {
  try {
    const vendorId = normalizeVendorId(req.body.vendorId || req.body.loginId);
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if ((!vendorId && !email) || !password) {
      return res.status(400).json({
        success: false,
        message: "Vendor ID or email and password are required",
      });
    }

    const vendor = await Vendor.findOne(
      vendorId ? { vendorId } : { email }
    )
      .select("+password")
      .populate("primaryRestaurant", "name restaurantCode vendorInventoryIntegration")
      .populate("accessibleRestaurants", "name restaurantCode vendorInventoryIntegration");

    if (!vendor || !vendor.password) {
      const setupPending =
        vendor &&
        vendor.invitationStatus === "pending" &&
        vendor.email &&
        (vendorId
          ? String(vendor.vendorId || "") === vendorId
          : String(vendor.email || "") === email);

      if (setupPending) {
        return res.status(403).json({
          success: false,
          message: "Vendor account setup is pending. Please complete the invitation link first.",
        });
      }

      return res.status(401).json({
        success: false,
        message: "Invalid vendor credentials",
      });
    }

    if (!vendor.isActive) {
      return res.status(403).json({
        success: false,
        message: "Vendor account is inactive",
      });
    }

    const isMatch = await vendor.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid vendor credentials",
      });
    }

    const token = createToken(vendor);

    res.json({
      success: true,
      token,
      user: buildVendorResponse(vendor),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getVendorInvitation = async (req, res) => {
  try {
    const token = String(req.params.token || "").trim();
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Invitation token is required",
      });
    }

    const vendor = await findVendorByInvitationToken(token);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Invitation link is invalid or no longer available",
      });
    }

    if (isInvitationExpired(vendor)) {
      vendor.invitationStatus = "expired";
      await vendor.save();
      return res.status(410).json({
        success: false,
        message: "Invitation link has expired. Ask admin to send a new one.",
      });
    }

    return res.json({
      success: true,
      invitation: {
        vendorId: vendor.vendorId,
        name: vendor.name,
        email: vendor.email,
        vendorType: vendor.vendorType,
        expiresAt: vendor.invitationExpiresAt,
        primaryRestaurant: vendor.primaryRestaurant,
        accessibleRestaurants: vendor.accessibleRestaurants || [],
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const acceptVendorInvitation = async (req, res) => {
  try {
    const token = String(req.params.token || "").trim();
    const password = String(req.body.password || "");

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: "Invitation token and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const vendor = await findVendorByInvitationToken(token);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Invitation link is invalid or no longer available",
      });
    }

    if (isInvitationExpired(vendor)) {
      vendor.invitationStatus = "expired";
      await vendor.save();
      return res.status(410).json({
        success: false,
        message: "Invitation link has expired. Ask admin to send a new one.",
      });
    }

    vendor.password = password;
    vendor.invitationStatus = "accepted";
    vendor.invitationAcceptedAt = new Date();
    vendor.invitationTokenHash = null;
    vendor.invitationExpiresAt = null;
    await vendor.save();

    const tokenValue = createToken(vendor);

    return res.json({
      success: true,
      message: "Vendor account setup completed successfully",
      token: tokenValue,
      user: buildVendorResponse(vendor),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createLocalVendor = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = normalizeEmail(req.body.email);
    const phone = String(req.body.phone || "").trim();
    const address = normalizeAddress(req.body.address);
    const governmentId = String(req.body.governmentId || "").trim().toUpperCase();
    const governmentIdType = normalizeGovernmentIdType(req.body.governmentIdType);
    const category = String(req.body.category || "").trim();
    const requestedVendorId = normalizeVendorId(req.body.vendorId);
    const restaurantId = req.body.restaurantId;
    const requestedRestaurantIds = sanitizeRestaurantIds(
      req.body.accessibleRestaurantIds || req.body.restaurantIds
    );

    if (!name || !email || (!restaurantId && requestedRestaurantIds.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and at least one restaurant are required",
      });
    }

    let restaurants = [];

    if (requestedRestaurantIds.length > 0) {
      const ownedRestaurants = await ensureRestaurantsOwnedByAdmin(
        requestedRestaurantIds,
        req.user.id
      );

      if (!ownedRestaurants) {
        return res.status(404).json({
          success: false,
          message: "One or more restaurants are not available for this admin",
        });
      }

      restaurants = ownedRestaurants;
    } else {
      const restaurant = await ensureRestaurantOwnedByAdmin(restaurantId, req.user.id);
      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: "Restaurant not found for this admin",
        });
      }
      restaurants = [restaurant];
    }

    if (restaurants.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found for this admin",
      });
    }

    const vendorId = requestedVendorId || (await generateVendorId("local"));
    const invitationToken = generateInvitationToken();

    const vendor = new Vendor({
      vendorId,
      name,
      email,
      phone,
      address,
      governmentId,
      governmentIdType,
      category,
      vendorType: "local",
      createdByRole: "admin",
      createdByAdmin: req.user.id,
      primaryRestaurant: restaurants[0]._id,
      accessibleRestaurants: restaurants.map((restaurant) => restaurant._id),
      allRestaurantsAccess: false,
    });
    applyVendorInvitation(vendor, invitationToken);
    await vendor.save();
    const invitationDelivery = await sendInvitationIfPossible({
      vendor,
      req,
      invitationToken,
    });

    res.status(201).json({
      success: true,
      message: invitationDelivery.invitationEmailSent
        ? "Local vendor created and invitation email sent successfully"
        : "Local vendor created and invitation link generated successfully",
      vendor: buildVendorResponse(vendor),
      invitationLink: invitationDelivery.invitationLink,
      invitationEmailSent: invitationDelivery.invitationEmailSent,
      invitationEmailMessage: invitationDelivery.invitationEmailMessage,
    });
  } catch (error) {
    const status = error?.code === 11000 ? 409 : 500;
    res.status(status).json({
      success: false,
      message:
        error?.code === 11000
          ? "Vendor ID or email already exists"
          : error.message,
    });
  }
};

export const createGlobalVendor = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = normalizeEmail(req.body.email);
    const phone = String(req.body.phone || "").trim();
    const address = normalizeAddress(req.body.address);
    const governmentId = String(req.body.governmentId || "").trim().toUpperCase();
    const governmentIdType = normalizeGovernmentIdType(req.body.governmentIdType);
    const category = String(req.body.category || "").trim();
    const requestedVendorId = normalizeVendorId(req.body.vendorId);
    const allRestaurantsAccess = req.body.allRestaurantsAccess !== false;
    const accessibleRestaurantIds = sanitizeRestaurantIds(req.body.accessibleRestaurantIds);
    const firstRestaurantId = accessibleRestaurantIds[0] || null;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required",
      });
    }

    if (!allRestaurantsAccess && accessibleRestaurantIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Select at least one restaurant when global access is limited",
      });
    }

    const vendorId = requestedVendorId || (await generateVendorId("global"));
    const invitationToken = generateInvitationToken();

    const vendor = new Vendor({
      vendorId,
      name,
      email,
      phone,
      address,
      governmentId,
      governmentIdType,
      category,
      vendorType: "global",
      createdByRole: "super_admin",
      createdBySuperAdmin: req.user.id,
      connectedAdmins: [],
      primaryRestaurant: firstRestaurantId,
      accessibleRestaurants: accessibleRestaurantIds,
      allRestaurantsAccess,
    });
    applyVendorInvitation(vendor, invitationToken);
    await vendor.save();
    const invitationDelivery = await sendInvitationIfPossible({
      vendor,
      req,
      invitationToken,
    });

    res.status(201).json({
      success: true,
      message: invitationDelivery.invitationEmailSent
        ? "Global vendor created and invitation email sent successfully"
        : "Global vendor created and invitation link generated successfully",
      vendor: buildVendorResponse(vendor),
      invitationLink: invitationDelivery.invitationLink,
      invitationEmailSent: invitationDelivery.invitationEmailSent,
      invitationEmailMessage: invitationDelivery.invitationEmailMessage,
    });
  } catch (error) {
    const status = error?.code === 11000 ? 409 : 500;
    res.status(status).json({
      success: false,
      message:
        error?.code === 11000
          ? "Vendor ID or email already exists"
          : error.message,
    });
  }
};

export const getVendors = async (req, res) => {
  try {
      const query = await getScopedVendorQuery(req.user);
    if (!query) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const vendors = await Vendor.find(query)
      .populate("createdByAdmin", "businessName email adminId")
      .populate("createdBySuperAdmin", "email")
      .populate("primaryRestaurant", "name restaurantCode")
      .populate("accessibleRestaurants", "name restaurantCode")
      .sort({ createdAt: -1 });

    const lastOrderByVendor = await getLatestOrdersByVendor(vendors.map((vendor) => vendor._id));

    res.json({
      success: true,
      vendors: vendors.map((vendor) =>
        buildVendorResponse(vendor, lastOrderByVendor.get(String(vendor._id)) || null)
      ),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const exploreGlobalVendors = async (req, res) => {
  try {
    const query = { vendorType: "global", isActive: true };

    if (req.user.role === "admin") {
      const scopedQuery = await getScopedVendorQuery(req.user);
      const connectedVendorIds = scopedQuery
        ? await Vendor.find(scopedQuery).distinct("_id")
        : [];

      query._id = { $nin: connectedVendorIds };
    }

    const vendors = await Vendor.find(query)
      .populate("primaryRestaurant", "name restaurantCode address")
      .populate("accessibleRestaurants", "name restaurantCode address")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      vendors: vendors.map(buildVendorResponse),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getVendorById = async (req, res) => {
  try {
      const query = await getScopedVendorQuery(req.user);
    if (!query) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const vendor = await Vendor.findOne({
      ...query,
      _id: req.params.id,
    })
      .populate("createdByAdmin", "businessName email adminId")
      .populate("createdBySuperAdmin", "email")
      .populate("primaryRestaurant", "name restaurantCode")
      .populate("accessibleRestaurants", "name restaurantCode");

    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }

    res.json({ success: true, vendor: buildVendorResponse(vendor) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyVendorProfile = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.user.id)
      .populate("primaryRestaurant", "name restaurantCode")
      .populate("accessibleRestaurants", "name restaurantCode");

    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }

    res.json({ success: true, vendor: buildVendorResponse(vendor) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }

    if (req.user.role === "admin" && String(vendor.createdByAdmin) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (req.user.role === "vendor" && String(vendor._id) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (isAdminLockedFromVendorManagement(vendor, req.user)) {
      return res.status(403).json({
        success: false,
        message: "Admin cannot edit this vendor after global upgrade",
      });
    }

    const allowedFields = [
      "name",
      "phone",
      "address",
      "email",
      "governmentId",
      "governmentIdType",
      "category",
    ];

    if (req.user.role === "admin") {
      allowedFields.push("isActive");
    }

    if (req.user.role === "super_admin") {
      allowedFields.push("isActive", "allRestaurantsAccess", "vendorType");
    }

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === "email") {
          vendor[field] = normalizeEmail(req.body[field]);
        } else if (field === "address") {
          vendor[field] = normalizeAddress(req.body[field]);
        } else if (field === "governmentId") {
          vendor[field] = String(req.body[field] || "").trim().toUpperCase();
        } else if (field === "governmentIdType") {
          vendor[field] = normalizeGovernmentIdType(req.body[field]);
        } else if (field === "category") {
          vendor[field] = String(req.body[field] || "").trim();
        } else {
          vendor[field] = req.body[field];
        }
      }
    }

    if (req.user.role === "admin" && Array.isArray(req.body.accessibleRestaurantIds)) {
      const ownedRestaurants = await ensureRestaurantsOwnedByAdmin(
        req.body.accessibleRestaurantIds,
        req.user.id
      );

      if (!ownedRestaurants || ownedRestaurants.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Select valid restaurants for this vendor",
        });
      }

      vendor.accessibleRestaurants = ownedRestaurants.map((restaurant) => restaurant._id);
      vendor.primaryRestaurant = ownedRestaurants[0]._id;
    }

    if (
      req.user.role === "super_admin" &&
      Array.isArray(req.body.accessibleRestaurantIds)
    ) {
      vendor.accessibleRestaurants = sanitizeRestaurantIds(req.body.accessibleRestaurantIds);
      vendor.primaryRestaurant = vendor.accessibleRestaurants[0] || null;
    }

    await vendor.save();

    res.json({
      success: true,
      message: "Vendor updated successfully",
      vendor: buildVendorResponse(vendor),
    });
  } catch (error) {
    const status = error?.code === 11000 ? 409 : 500;
    res.status(status).json({
      success: false,
      message:
        error?.code === 11000
          ? "Vendor ID or email already exists"
          : error.message,
    });
  }
};

export const resetVendorPassword = async (req, res) => {
  try {
    const newPassword = String(req.body.newPassword || "");

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const vendor = await Vendor.findById(req.params.id).select("+password");
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }

    if (req.user.role === "admin" && String(vendor.createdByAdmin) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (isAdminLockedFromVendorManagement(vendor, req.user)) {
      return res.status(403).json({
        success: false,
        message: "Admin cannot reset password after vendor global upgrade",
      });
    }

    vendor.password = newPassword;
    await vendor.save();

    res.json({ success: true, message: "Vendor password reset successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }

    if (req.user.role === "admin" && String(vendor.createdByAdmin) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (req.user.role !== "admin" && req.user.role !== "super_admin") {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    if (isAdminLockedFromVendorManagement(vendor, req.user)) {
      return res.status(403).json({
        success: false,
        message: "Admin cannot delete this vendor after global upgrade",
      });
    }

    await vendor.deleteOne();

    res.json({ success: true, message: "Vendor deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const requestGlobalUpgrade = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.user.id);

    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }

    if (vendor.vendorType !== "local") {
      return res.status(400).json({
        success: false,
        message: "Only local vendors can request global upgrade",
      });
    }

    if (vendor.upgradeRequestStatus === "pending") {
      return res.status(400).json({
        success: false,
        message: "Upgrade request is already pending",
      });
    }

    vendor.upgradeRequestStatus = "pending";
    vendor.upgradeRequestedAt = new Date();
    vendor.upgradeReviewedAt = null;
    await vendor.save();

    res.json({
      success: true,
      message: "Upgrade request submitted to super admin",
      vendor: buildVendorResponse(vendor),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUpgradeRequests = async (_req, res) => {
  try {
    const vendors = await Vendor.find({ upgradeRequestStatus: "pending", vendorType: "local" })
      .populate("createdByAdmin", "businessName email adminId")
      .populate("createdBySuperAdmin", "email")
      .populate("primaryRestaurant", "name restaurantCode")
      .sort({ upgradeRequestedAt: -1 });

    res.json({
      success: true,
      requests: vendors.map(buildVendorResponse),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reviewUpgradeRequest = async (req, res) => {
  try {
    const action = String(req.body.action || "").trim().toLowerCase();
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }

    if (vendor.vendorType !== "local" || vendor.upgradeRequestStatus !== "pending") {
      return res.status(400).json({
        success: false,
        message: "This vendor does not have a pending upgrade request",
      });
    }

    if (action === "reject") {
      vendor.upgradeRequestStatus = "rejected";
      vendor.upgradeReviewedAt = new Date();
      await vendor.save();

      return res.json({
        success: true,
        message: "Upgrade request rejected",
        vendor: buildVendorResponse(vendor),
      });
    }

      if (action !== "approve") {
        return res.status(400).json({
          success: false,
          message: "Action must be approve or reject",
        });
    }

      const allRestaurantsAccess = req.body.allRestaurantsAccess !== false;
      const accessibleRestaurantIds = sanitizeRestaurantIds(req.body.accessibleRestaurantIds);
      const inheritedRestaurantIds = getVendorRestaurantIds(vendor);
      const globalAccessibleRestaurantIds = allRestaurantsAccess
        ? inheritedRestaurantIds
        : sanitizeRestaurantIds([...inheritedRestaurantIds, ...accessibleRestaurantIds]);
      const globalVendorId = await generateVendorId("global");
      const generatedPassword = generateVendorPassword();
      const originalEmail = vendor.email;

      // Release unique email from the inactive local account before creating
      // the replacement global vendor in the same collection.
      if (originalEmail) {
        vendor.email = undefined;
        await vendor.save();
      }

      const globalVendor = await Vendor.create({
        vendorId: globalVendorId,
        name: vendor.name,
        email: originalEmail || undefined,
        phone: vendor.phone,
        address: vendor.address,
        governmentId: vendor.governmentId,
        governmentIdType: vendor.governmentIdType,
        category: vendor.category,
        password: generatedPassword,
        vendorType: "global",
        createdByRole: "super_admin",
        createdByAdmin: vendor.createdByAdmin,
        createdBySuperAdmin: req.user.id,
        connectedAdmins: vendor.createdByAdmin ? [vendor.createdByAdmin] : [],
        primaryRestaurant:
          vendor.primaryRestaurant ||
          globalAccessibleRestaurantIds[0] ||
          null,
        accessibleRestaurants: globalAccessibleRestaurantIds,
        allRestaurantsAccess,
        upgradedFromVendor: vendor._id,
      });

      vendor.upgradeRequestStatus = "approved";
      vendor.upgradeReviewedAt = new Date();
      vendor.upgradedToGlobalVendor = globalVendor._id;
      // Keep the local vendor attached to the original admin so historical
      // orders and business relationships remain visible in admin workflows.
      vendor.isActive = false;
      await vendor.save();

      res.json({
        success: true,
        message: "Vendor upgraded to global successfully",
        localVendor: buildVendorResponse(vendor),
        globalVendor: buildVendorResponse(globalVendor),
        credentials: {
          vendorId: globalVendorId,
          password: generatedPassword,
        },
      });
    } catch (error) {
      const status = error?.code === 11000 ? 409 : 500;
      res.status(status).json({
        success: false,
        message:
          error?.code === 11000
            ? "Could not create global vendor because a vendor ID or email already exists"
            : error.message,
      });
    }
  };

export const connectGlobalVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);

    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }

    if (vendor.vendorType !== "global" || vendor.isActive === false) {
      return res.status(400).json({
        success: false,
        message: "Only active global vendors can be connected",
      });
    }

    const adminRestaurantIds = await getAdminRestaurantIds(req.user.id);
    if (adminRestaurantIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Create at least one restaurant before connecting a global vendor",
      });
    }

    const nextConnectedAdmins = new Set(
      (vendor.connectedAdmins || []).map((adminId) => String(adminId))
    );
    nextConnectedAdmins.add(String(req.user.id));
    vendor.connectedAdmins = Array.from(nextConnectedAdmins);

    if (!vendor.allRestaurantsAccess) {
      vendor.accessibleRestaurants = sanitizeRestaurantIds([
        ...getVendorRestaurantIds(vendor),
        ...adminRestaurantIds,
      ]);
    }

    if (!vendor.primaryRestaurant) {
      vendor.primaryRestaurant = adminRestaurantIds[0];
    }

    await vendor.save();
    await vendor.populate("primaryRestaurant", "name restaurantCode");
    await vendor.populate("accessibleRestaurants", "name restaurantCode");

    res.json({
      success: true,
      message: "Global vendor connected successfully",
      vendor: buildVendorResponse(vendor),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getVendorDashboardScope = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.user.id)
      .populate("primaryRestaurant", "name restaurantCode")
      .populate("accessibleRestaurants", "name restaurantCode");

    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }

    const restaurants = vendor.accessibleRestaurants || [];

    res.json({
      success: true,
      scope: {
        vendorType: vendor.vendorType,
        allRestaurantsAccess: vendor.allRestaurantsAccess,
        primaryRestaurant: vendor.primaryRestaurant,
        restaurants,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  loginVendor,
  getVendorInvitation,
  acceptVendorInvitation,
  createLocalVendor,
  createGlobalVendor,
  getVendors,
  exploreGlobalVendors,
  connectGlobalVendor,
  getVendorById,
  getMyVendorProfile,
  updateVendor,
  resetVendorPassword,
  deleteVendor,
  requestGlobalUpgrade,
  getUpgradeRequests,
  reviewUpgradeRequest,
  getVendorDashboardScope,
};
