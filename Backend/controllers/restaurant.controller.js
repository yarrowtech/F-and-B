// import Restaurant from "../models/Restaurant.model.js";
// import Employee from "../models/Employee.model.js";

// /* =====================================================
//    CREATE RESTAURANT (ADMIN ONLY)
// ===================================================== */
// export const createRestaurant = async (req, res) => {
//   try {
//     if (req.user.role !== "admin") {
//       return res.status(403).json({ message: "Access denied" });
//     }

//     const { name, address, phone, gstNo } = req.body;

//     const restaurant = await Restaurant.create({
//       name,
//       address,
//       phone,
//       gstNo,
//       admin: req.user.id,
//     });

//     res.json(restaurant);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };

// /* =====================================================
//    GET ALL RESTAURANTS (ADMIN)
// ===================================================== */
// export const getRestaurants = async (req, res) => {
//   try {
//     if (req.user.role !== "admin") {
//       return res.status(403).json({ message: "Access denied" });
//     }

//     const restaurants = await Restaurant.find({
//       admin: req.user.id,
//     }).sort({ createdAt: -1 });

//     res.json(restaurants);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };

// /* =====================================================
//    GET SINGLE RESTAURANT BY ID (🔥 FIXED)
// ===================================================== */
// export const getRestaurantById = async (req, res) => {
//   try {
//     if (req.user.role !== "admin") {
//       return res.status(403).json({ message: "Access denied" });
//     }

//     const { restaurantId } = req.params;

//     const restaurant = await Restaurant.findOne({
//       _id: restaurantId,
//       admin: req.user.id, // security check
//     });

//     if (!restaurant) {
//       return res.status(404).json({
//         message: "Restaurant not found",
//       });
//     }

//     res.json(restaurant);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };

// /* =====================================================
//    ASSIGN EMPLOYEES TO RESTAURANT
// ===================================================== */
// export const assignEmployeesToRestaurant = async (req, res) => {
//   try {
//     if (req.user.role !== "admin") {
//       return res.status(403).json({ message: "Access denied" });
//     }

//     const { restaurantId } = req.params;
//     const { employeeIds } = req.body;

//     if (!Array.isArray(employeeIds)) {
//       return res
//         .status(400)
//         .json({ message: "employeeIds must be an array" });
//     }

//     await Employee.updateMany(
//       { _id: { $in: employeeIds } },
//       { restaurant: restaurantId }
//     );

//     res.json({
//       success: true,
//       message: "Employees assigned successfully",
//     });
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };

// /* =====================================================
//    GET EMPLOYEES BY RESTAURANT
// ===================================================== */
// export const getRestaurantEmployees = async (req, res) => {
//   try {
//     if (req.user.role !== "admin") {
//       return res.status(403).json({ message: "Access denied" });
//     }

//     const { restaurantId } = req.params;

//     const employees = await Employee.find({
//       restaurant: restaurantId,
//     }).select("-password");

//     res.json(employees);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };











import Restaurant from "../models/Restaurant.model.js";
import Employee from "../models/Employee.model.js";
import { invalidateCacheNamespaces } from "../utils/cacheStore.js";

const invalidateRestaurantCaches = ({ adminId, restaurantId }) => {
  invalidateCacheNamespaces([
    adminId ? `restaurants:${adminId}` : "",
    restaurantId ? `restaurant:${restaurantId}` : "",
    restaurantId ? `restaurant-employees:${restaurantId}` : "",
    restaurantId ? `public-menu:${restaurantId}` : "",
    "dashboard",
  ].filter(Boolean));
};

const defaultBillingTemplate = {
  headerTitle: "",
  subtitle: "",
  logoUrl: "",
  primaryColor: "#183153",
  accentColor: "#f5f8f2",
  footerMessage: "Thank you for dining with us.",
  terms: "This invoice includes all selected taxes, service charges, and discounts.",
  showGstNo: true,
  showRestaurantCode: false,
  showCustomerContact: true,
  showTaxBreakup: true,
  showServiceCharge: true,
  cgstRate: 2.5,
  sgstRate: 2.5,
  paymentMethods: ["CASH", "CARD", "UPI"],
  kotCopyCount: 1,
};
const maxLogoDataLength = 1000000;
const defaultPaymentMethods = ["CASH", "CARD", "UPI"];

const normalizePaymentMethod = (value) =>
  String(value || "")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .toUpperCase()
    .slice(0, 32);

const sanitizePaymentMethods = (value) => {
  const source = Array.isArray(value) ? value : defaultPaymentMethods;
  const methods = Array.from(
    new Set(source.map(normalizePaymentMethod).filter(Boolean))
  ).slice(0, 12);

  return methods.length > 0 ? methods : defaultPaymentMethods;
};

const sanitizeRate = (value, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, 0), 100);
};

const normalizeBillingNumber = (value, fallback = 1) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;

  const normalized = Math.floor(parsed);
  return normalized > 0 ? normalized : fallback;
};

const sanitizeKotCopyCount = (value, fallback = 1) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;

  const normalized = Math.floor(parsed);
  return Math.min(Math.max(normalized, 1), 10);
};

const sanitizeBillingTemplate = (payload = {}) => {
  const text = (value, max) => String(value || "").trim().slice(0, max);
  const color = (value, fallback) => {
    const normalized = String(value || "").trim();
    return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized : fallback;
  };

  return {
    headerTitle: text(payload.headerTitle, 80),
    subtitle: text(payload.subtitle, 120),
    logoUrl: text(payload.logoUrl, maxLogoDataLength),
    primaryColor: color(payload.primaryColor, defaultBillingTemplate.primaryColor),
    accentColor: color(payload.accentColor, defaultBillingTemplate.accentColor),
    footerMessage:
      text(payload.footerMessage, 180) || defaultBillingTemplate.footerMessage,
    terms: text(payload.terms, 300) || defaultBillingTemplate.terms,
    showGstNo: Boolean(payload.showGstNo),
    showRestaurantCode: Boolean(payload.showRestaurantCode),
    showCustomerContact: payload.showCustomerContact !== false,
    showTaxBreakup: payload.showTaxBreakup !== false,
    showServiceCharge: payload.showServiceCharge !== false,
    cgstRate: sanitizeRate(payload.cgstRate, defaultBillingTemplate.cgstRate),
    sgstRate: sanitizeRate(payload.sgstRate, defaultBillingTemplate.sgstRate),
    paymentMethods: sanitizePaymentMethods(payload.paymentMethods),
    kotCopyCount: sanitizeKotCopyCount(
      payload.kotCopyCount,
      defaultBillingTemplate.kotCopyCount
    ),
  };
};

const applyBillingSequenceSettings = async (restaurant, payload = {}) => {
  const requestedStartNumber = normalizeBillingNumber(
    payload.billingStartNumber,
    normalizeBillingNumber(restaurant.billingStartNumber, 1)
  );

  restaurant.billingStartNumber = requestedStartNumber;

  const existingBill = await Restaurant.db
    .model("Bill")
    .exists({ restaurant: restaurant._id });

  const currentNextBillNumber = normalizeBillingNumber(
    restaurant.nextBillNumber,
    requestedStartNumber
  );

  restaurant.nextBillNumber = existingBill
    ? Math.max(currentNextBillNumber, requestedStartNumber)
    : requestedStartNumber;
};

/* =====================================================
   GENERATE RESTAURANT CODE
===================================================== */

const generateRestaurantCode = async (name) => {

  const baseCode = name
    .replace(/[^A-Za-z]/g, "")
    .substring(0, 3)
    .toUpperCase();

  let code = baseCode;
  let counter = 1;

  while (await Restaurant.findOne({ restaurantCode: code })) {
    code = `${baseCode}${counter}`;
    counter++;
  }

  return code;
};


/* =====================================================
   CREATE RESTAURANT (ADMIN ONLY)
===================================================== */

export const createRestaurant = async (req, res) => {
  try {

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied"
      });
    }

    const { name, address, phone, gstNo, billingStartNumber } = req.body;

    if (!name) {
      return res.status(400).json({
        message: "Restaurant name is required"
      });
    }

    const restaurantCode = await generateRestaurantCode(name);

    const restaurant = await Restaurant.create({
      name,
      restaurantCode,
      address,
      phone,
      gstNo,
      billingStartNumber: normalizeBillingNumber(billingStartNumber, 1),
      nextBillNumber: normalizeBillingNumber(billingStartNumber, 1),
      admin: req.user.id,
    });

    invalidateRestaurantCaches({
      adminId: req.user.id,
      restaurantId: restaurant._id,
    });

    res.status(201).json({
      success: true,
      restaurant
    });

  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};


/* =====================================================
   GET ALL RESTAURANTS (ADMIN)
===================================================== */

export const getRestaurants = async (req, res) => {
  try {

    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Access denied"
      });
    }

    const restaurants = await Restaurant.find({
      admin: req.user.id
    }).sort({ createdAt: -1 });

    res.json(restaurants);

  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};


/* =====================================================
   GET SINGLE RESTAURANT
===================================================== */

export const getRestaurantById = async (req, res) => {
  try {

    const { restaurantId } = req.params;

    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      admin: req.user.id
    });

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found"
      });
    }

    res.json(restaurant);

  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};


/* =====================================================
   UPDATE RESTAURANT
===================================================== */

export const updateRestaurant = async (req, res) => {
  try {

    const { restaurantId } = req.params;

    const restaurant = await Restaurant.findOneAndUpdate(
      {
        _id: restaurantId,
        admin: req.user.id
      },
      req.body,
      { new: true }
    );

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found"
      });
    }

    invalidateRestaurantCaches({ adminId: req.user.id, restaurantId });

    res.json({
      success: true,
      restaurant
    });

  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};


/* =====================================================
   UPDATE BILLING TEMPLATE
===================================================== */

export const updateBillingTemplate = async (req, res) => {
  try {

    const { restaurantId } = req.params;

    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      admin: req.user.id
    });

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found"
      });
    }

    restaurant.billingTemplate = sanitizeBillingTemplate(req.body);
    await applyBillingSequenceSettings(restaurant, req.body);
    await restaurant.save();
    invalidateRestaurantCaches({ adminId: req.user.id, restaurantId });

    res.json({
      success: true,
      restaurant
    });

  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};


/* =====================================================
   DELETE RESTAURANT
===================================================== */

export const deleteRestaurant = async (req, res) => {
  try {

    const { restaurantId } = req.params;

    const restaurant = await Restaurant.findOneAndDelete({
      _id: restaurantId,
      admin: req.user.id
    });

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found"
      });
    }

    /* Remove restaurant from employees */

    await Employee.updateMany(
      { restaurant: restaurantId },
      { $unset: { restaurant: "" } }
    );

    invalidateRestaurantCaches({ adminId: req.user.id, restaurantId });

    res.json({
      success: true,
      message: "Restaurant deleted successfully"
    });

  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};


/* =====================================================
   ASSIGN EMPLOYEES TO RESTAURANT
===================================================== */

export const assignEmployeesToRestaurant = async (req, res) => {
  try {

    const { restaurantId } = req.params;
    const { employeeIds } = req.body;

    if (!Array.isArray(employeeIds)) {
      return res.status(400).json({
        message: "employeeIds must be an array"
      });
    }

    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      admin: req.user.id
    });

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found"
      });
    }

    await Employee.updateMany(
      {
        _id: { $in: employeeIds },
        createdBy: req.user.id
      },
      { restaurant: restaurantId }
    );

    invalidateRestaurantCaches({ adminId: req.user.id, restaurantId });

    res.json({
      success: true,
      message: "Employees assigned successfully"
    });

  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};


/* =====================================================
   GET EMPLOYEES BY RESTAURANT
===================================================== */

export const getRestaurantEmployees = async (req, res) => {
  try {

    const { restaurantId } = req.params;

    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      admin: req.user.id
    });

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found"
      });
    }

    const employees = await Employee.find({
      restaurant: restaurantId
    })
    .select("-password")
    .sort({ createdAt: -1 });

    res.json(employees);

  } catch (err) {
    res.status(400).json({
      message: err.message
    });
  }
};
