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
import Bill from "../models/Bill.model.js";
import Order from "../models/Order.model.js";
import KotDailyCounter from "../models/KotDailyCounter.model.js";
import { invalidateTestModeCache } from "../utils/testMode.js";
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
  invoiceBadgeText: "",
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
  billCopyCount: 1,
  printSettlementSlip: true,
};
const maxLogoDataLength = 1000000;
const defaultPaymentMethods = ["CASH", "CARD", "UPI"];
const defaultVendorInventoryIntegration = {
  enabled: false,
};
const defaultRestaurantType = "HYBRID";

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

const sanitizeRestaurantType = (value, fallback = defaultRestaurantType) => {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();

  return ["MANUAL_ONLY", "HYBRID", "ACCOUNTANT_BILLING"].includes(normalized)
    ? normalized
    : fallback;
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
    invoiceBadgeText: text(payload.invoiceBadgeText, 40),
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
    billCopyCount: sanitizeKotCopyCount(
      payload.billCopyCount,
      defaultBillingTemplate.billCopyCount
    ),
    printSettlementSlip: payload.printSettlementSlip !== false,
  };
};

const sanitizeVendorInventoryIntegration = (payload = {}) => ({
  enabled:
    payload?.enabled === undefined
      ? defaultVendorInventoryIntegration.enabled
      : Boolean(payload.enabled),
});

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

    const {
      name,
      address,
      phone,
      gstNo,
      billingStartNumber,
      restaurantType,
    } = req.body;

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
      restaurantType: sanitizeRestaurantType(restaurantType),
      billingStartNumber: normalizeBillingNumber(billingStartNumber, 1),
      nextBillNumber: normalizeBillingNumber(billingStartNumber, 1),
      vendorInventoryIntegration: sanitizeVendorInventoryIntegration(
        req.body.vendorInventoryIntegration
      ),
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
    const restaurant = await Restaurant.findOne({
      _id: restaurantId,
      admin: req.user.id
    });

    if (!restaurant) {
      return res.status(404).json({
        message: "Restaurant not found"
      });
    }

    const textFields = ["name", "address", "phone", "gstNo"];
    textFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        restaurant[field] = String(req.body[field] || "").trim();
      }
    });

    if (req.body.isActive !== undefined) {
      restaurant.isActive = Boolean(req.body.isActive);
    }

    if (req.body.restaurantType !== undefined) {
      restaurant.restaurantType = sanitizeRestaurantType(
        req.body.restaurantType,
        restaurant.restaurantType || defaultRestaurantType
      );
    }

    if (req.body.billingStartNumber !== undefined) {
      restaurant.billingStartNumber = normalizeBillingNumber(
        req.body.billingStartNumber,
        restaurant.billingStartNumber
      );
    }

    if (req.body.vendorInventoryIntegration !== undefined) {
      restaurant.vendorInventoryIntegration = sanitizeVendorInventoryIntegration(
        req.body.vendorInventoryIntegration
      );
    }

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
   TEST (TRAINING) MODE
===================================================== */

// Matches every document (null also matches a missing field), and because the
// filter names isTest the automatic test/live scoping is skipped.
const ANY_TEST_FLAG = { $in: [true, false, null] };

const findOwnedRestaurant = (restaurantId, adminId) =>
  Restaurant.findOne({ _id: restaurantId, admin: adminId });

export const updateTestMode = async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const enabled = req.body?.enabled === true;

    const restaurant = await findOwnedRestaurant(restaurantId, req.user.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    if (Boolean(restaurant.testMode) === enabled) {
      return res.json({ success: true, restaurant });
    }

    // Switching while a table is running would leave a half-test, half-live bill.
    const [runningBills, openOrders] = await Promise.all([
      Bill.countDocuments({
        restaurant: restaurant._id,
        paymentStatus: "PENDING",
        isTest: ANY_TEST_FLAG,
      }),
      // A table can be left marked "occupied" after its order was paid, so
      // look at unfinished orders instead of the table flag.
      Order.countDocuments({
        restaurant: restaurant._id,
        table: { $ne: null },
        status: {
          $in: ["PENDING_ACCEPT", "PENDING", "ACCEPTED", "PREPARING", "READY", "SERVED"],
        },
        isTest: ANY_TEST_FLAG,
      }),
    ]);

    if (runningBills > 0 || openOrders > 0) {
      return res.status(409).json({
        success: false,
        message: `Cannot switch test mode yet: ${runningBills} running bill(s) and ${openOrders} open table order(s). Settle or void them first.`,
      });
    }

    restaurant.testMode = enabled;
    await restaurant.save();

    invalidateTestModeCache(restaurant._id);
    invalidateRestaurantCaches({ adminId: req.user.id, restaurantId });

    res.json({ success: true, restaurant });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const clearTestData = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    const restaurant = await findOwnedRestaurant(restaurantId, req.user.id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    const [bills, orders] = await Promise.all([
      Bill.deleteMany({ restaurant: restaurant._id, isTest: true }),
      Order.deleteMany({ restaurant: restaurant._id, isTest: true }),
    ]);

    // Restart the T- series and the test KOT counters.
    restaurant.nextTestBillNumber = 0;
    await restaurant.save();
    await KotDailyCounter.deleteMany({
      restaurant: restaurant._id,
      dateKey: /^TEST-/,
    });

    invalidateRestaurantCaches({ adminId: req.user.id, restaurantId });

    res.json({
      success: true,
      deletedBills: bills.deletedCount || 0,
      deletedOrders: orders.deletedCount || 0,
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
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
