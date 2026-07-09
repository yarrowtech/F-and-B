import crypto from "crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Restaurant from "../models/Restaurant.model.js";
import Vendor from "../models/Vendor.model.js";
import VendorOrder from "../models/VendorOrder.model.js";

const toObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value)
    ? new mongoose.Types.ObjectId(value)
    : null;

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();
const normalizeVendorId = (vendorId = "") => String(vendorId).trim().toUpperCase();
const normalizeGovernmentIdType = (value = "") => String(value).trim().toUpperCase();
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
      .populate("primaryRestaurant", "name restaurantCode")
      .populate("accessibleRestaurants", "name restaurantCode");

    if (!vendor || !vendor.password) {
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

export const createLocalVendor = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const password = String(req.body.password || "");
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

    if (!name || !password || (!restaurantId && requestedRestaurantIds.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "Name, password, and at least one restaurant are required",
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

    const vendor = await Vendor.create({
      vendorId,
      name,
      email: email || undefined,
      phone,
      address,
      governmentId,
      governmentIdType,
      category,
      password,
      vendorType: "local",
      createdByRole: "admin",
      createdByAdmin: req.user.id,
      primaryRestaurant: restaurants[0]._id,
      accessibleRestaurants: restaurants.map((restaurant) => restaurant._id),
      allRestaurantsAccess: false,
    });

    res.status(201).json({
      success: true,
      message: "Local vendor created successfully",
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

export const createGlobalVendor = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const password = String(req.body.password || "");
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

    if (!name || !password) {
      return res.status(400).json({
        success: false,
        message: "Name and password are required",
      });
    }

    if (!allRestaurantsAccess && accessibleRestaurantIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Select at least one restaurant when global access is limited",
      });
    }

    const vendorId = requestedVendorId || (await generateVendorId("global"));

    const vendor = await Vendor.create({
      vendorId,
      name,
      email: email || undefined,
      phone,
      address,
      governmentId,
      governmentIdType,
      category,
      password,
      vendorType: "global",
      createdByRole: "super_admin",
      createdBySuperAdmin: req.user.id,
      connectedAdmins: [],
      primaryRestaurant: firstRestaurantId,
      accessibleRestaurants: accessibleRestaurantIds,
      allRestaurantsAccess,
    });

    res.status(201).json({
      success: true,
      message: "Global vendor created successfully",
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

    let restaurants = vendor.accessibleRestaurants || [];

    if (vendor.vendorType === "global" && vendor.allRestaurantsAccess) {
      restaurants = await Restaurant.find({})
        .select("name restaurantCode admin")
        .populate("admin", "businessName adminId");
    }

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
