import Admin from "../models/Admin.model.js";
import AdminSubscription from "../models/AdminSubscription.model.js";
import PendingAdminSignup from "../models/PendingAdminSignup.model.js";
import PendingSubscriptionOrder from "../models/PendingSubscriptionOrder.model.js";
import SubscriptionPlan from "../models/SubscriptionPlan.model.js";
import generateAdminId from "../utils/generateAdminId.js";
import {
  assignSubscriptionToAdmin,
  createRazorpayOrder,
  ensureDefaultSubscriptionPlans,
  fetchRazorpayPayment,
  formatSubscriptionForResponse,
  getPlanPricing,
  getPlanAmount,
  verifyRazorpaySignature,
} from "../utils/subscription.service.js";
import {
  isMailerConfigured,
  sendAdminAccountCredentialsEmail,
} from "../utils/mailer.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_POLICY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();

const normalizeAddress = (address) => ({
  line1: String(address?.line1 || "").trim(),
  line2: String(address?.line2 || "").trim(),
  landmark: String(address?.landmark || "").trim(),
  city: String(address?.city || "").trim(),
  state: String(address?.state || "").trim(),
  pincode: String(address?.pincode || "").trim(),
  country: String(address?.country || "India").trim() || "India",
});

const hasRequiredAddress = (address) =>
  Boolean(address.line1 && address.city && address.state && address.pincode);

const formatPlanResponse = (plan) => ({
  ...(function () {
    const pricing = getPlanPricing(plan);
    return {
  id: plan._id,
  code: plan.code,
  name: plan.name,
  description: plan.description,
  monthlyPrice: pricing.monthlyPrice,
  yearlyPrice: pricing.yearlyPrice,
  yearlyDiscountPercent: pricing.yearlyOffer.discountPercent || plan.yearlyDiscountPercent,
  offers: {
    monthly: pricing.monthlyOffer,
    yearly: pricing.yearlyOffer,
  },
  maxRestaurants: plan.maxRestaurants,
  maxStaff: plan.maxStaff,
  extraRestaurantMonthlyPrice: plan.extraRestaurantMonthlyPrice,
  trialDays: plan.trialDays,
  features: plan.features,
  displayFeatures: plan.displayFeatures,
  isPopular: plan.isPopular,
  isActive: plan.isActive,
  sortOrder: plan.sortOrder,
    };
  })(),
});

const validateStrongPassword = (password = "") =>
  PASSWORD_POLICY_REGEX.test(String(password));

const validatePlanPayload = (body = {}) => {
  const code = String(body.code || "").trim().toUpperCase();
  const name = String(body.name || "").trim();
  const description = String(body.description || "").trim();
  const monthlyPrice = Number(body.monthlyPrice);
  const yearlyPrice = Number(body.yearlyPrice);
  const yearlyDiscountPercent = Number(body.yearlyDiscountPercent || 0);
  const maxRestaurants = Number(body.maxRestaurants);
  const maxStaff = Number(body.maxStaff);
  const extraRestaurantMonthlyPrice = Number(body.extraRestaurantMonthlyPrice || 0);
  const trialDays = Number(body.trialDays || 0);
  const features = body.features || {};
  const displayFeatures = Array.isArray(body.displayFeatures)
    ? body.displayFeatures.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const isPopular = Boolean(body.isPopular);
  const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;
  const sortOrder = Number(body.sortOrder || 0);
  const monthlyOffer = body.offers?.monthly || {};
  const yearlyOffer = body.offers?.yearly || {};

  if (!code || !name) {
    return { error: "Plan code and name are required" };
  }

  if ([monthlyPrice, yearlyPrice, maxRestaurants, maxStaff].some((value) => Number.isNaN(value))) {
    return { error: "Price and plan limits must be valid numbers" };
  }

  return {
    value: {
      code,
      name,
      description,
      monthlyPrice,
      yearlyPrice,
      yearlyDiscountPercent,
      maxRestaurants,
      maxStaff,
      extraRestaurantMonthlyPrice,
      trialDays,
      features,
      displayFeatures,
      isPopular,
      isActive,
      sortOrder,
      offers: {
        monthly: {
          enabled: Boolean(monthlyOffer.enabled),
          label: String(monthlyOffer.label || "").trim(),
          discountedPrice: Number(monthlyOffer.discountedPrice || 0),
          discountPercent: Number(monthlyOffer.discountPercent || 0),
          durationMonths: Number(monthlyOffer.durationMonths || 1),
        },
        yearly: {
          enabled: Boolean(yearlyOffer.enabled),
          label: String(yearlyOffer.label || "").trim(),
          discountedPrice: Number(yearlyOffer.discountedPrice || 0),
          discountPercent: Number(yearlyOffer.discountPercent || 0),
          durationMonths: Number(yearlyOffer.durationMonths || 12),
        },
      },
    },
  };
};

export const getPublicPlans = async (_req, res) => {
  try {
    const plans = await ensureDefaultSubscriptionPlans();
    return res.json({
      success: true,
      plans: plans.map(formatPlanResponse),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createAdminSelfSignup = async (req, res) => {
  try {
    const businessName = String(req.body.businessName || "").trim();
    const email = normalizeEmail(req.body.email);
    const mobile = String(req.body.mobile || "").trim();
    const address = normalizeAddress(req.body.address || {});
    const panNumber = String(req.body.panNumber || "").trim().toUpperCase();
    const gstNumber = String(req.body.gstNumber || "").trim().toUpperCase();
    const password = String(req.body.password || "");

    if (!businessName || !email || !mobile || !panNumber || !gstNumber || !password) {
      return res.status(400).json({
        success: false,
        message: "Business, contact, GST, PAN, and password fields are required",
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ success: false, message: "Enter a valid email address" });
    }

    if (!hasRequiredAddress(address)) {
      return res.status(400).json({
        success: false,
        message: "Address line 1, city, state, and PIN code are required",
      });
    }

    if (!validateStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
      });
    }

    if (!GST_REGEX.test(gstNumber)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid GST number",
      });
    }

    const existingAdmin = await Admin.findOne({ email }).select("_id");
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: "Admin already exists with this email",
      });
    }

    const adminId = await generateAdminId(businessName);
    const admin = await Admin.create({
      adminId,
      businessName,
      email,
      mobile,
      address,
      panNumber,
      gstNumber,
      password,
      isActive: true,
      createdBySource: "self_signup",
    });

    let credentialsEmailSent = false;
    let credentialsEmailMessage = "";

    if (isMailerConfigured()) {
      try {
        await sendAdminAccountCredentialsEmail({
          to: admin.email,
          businessName: admin.businessName,
          adminId: admin.adminId,
          password,
          planName: "No plan selected yet",
        });
        credentialsEmailSent = true;
        credentialsEmailMessage = `Credentials email sent to ${admin.email}`;
      } catch (mailError) {
        credentialsEmailMessage =
          mailError?.message || "Account created, but credentials email could not be sent";
      }
    } else {
      credentialsEmailMessage =
        "Account created, but SMTP is not configured so credentials email was not sent";
    }

    return res.status(201).json({
      success: true,
      message: "Admin account created successfully. Login first, then choose a subscription plan from the dashboard.",
      admin: {
        id: admin._id,
        adminId: admin.adminId,
        businessName: admin.businessName,
        email: admin.email,
      },
      credentialsEmailSent,
      credentialsEmailMessage,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createAdminSignupOrder = async (req, res) => {
  try {
    const businessName = String(req.body.businessName || "").trim();
    const email = normalizeEmail(req.body.email);
    const mobile = String(req.body.mobile || "").trim();
    const address = normalizeAddress(req.body.address || {});
    const panNumber = String(req.body.panNumber || "").trim().toUpperCase();
    const gstNumber = String(req.body.gstNumber || "").trim().toUpperCase();
    const password = String(req.body.password || "");
    const planCode = String(req.body.planCode || "").trim().toUpperCase();
    const billingCycle = String(req.body.billingCycle || "monthly").trim().toLowerCase();

    if (!businessName || !email || !mobile || !panNumber || !gstNumber || !password || !planCode) {
      return res.status(400).json({
        success: false,
        message: "Business, contact, plan, and password fields are required",
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ success: false, message: "Enter a valid email address" });
    }

    if (!hasRequiredAddress(address)) {
      return res.status(400).json({
        success: false,
        message: "Address line 1, city, state, and PIN code are required",
      });
    }

    if (!validateStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and include uppercase, lowercase, number, and special character",
      });
    }

    if (!GST_REGEX.test(gstNumber)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid GST number",
      });
    }

    if (!["monthly", "yearly"].includes(billingCycle)) {
      return res.status(400).json({ success: false, message: "Invalid billing cycle" });
    }

    const [plan, existingAdmin] = await Promise.all([
      SubscriptionPlan.findOne({ code: planCode, isActive: true }),
      Admin.findOne({ email }).select("_id"),
    ]);

    if (!plan) {
      return res.status(404).json({ success: false, message: "Selected plan not found" });
    }

    if (existingAdmin) {
      return res.status(409).json({ success: false, message: "Admin already exists with this email" });
    }

    const amount = getPlanAmount(plan, billingCycle);
    const receipt = `admin-signup-${Date.now()}`;
    const order = await createRazorpayOrder({
      amount,
      receipt,
      notes: {
        planCode,
        billingCycle,
        email,
      },
    });

    await PendingAdminSignup.findOneAndUpdate(
      { razorpayOrderId: order.id },
      {
        $set: {
          businessName,
          email,
          mobile,
          address,
          panNumber,
          gstNumber,
          password,
          planCode,
          billingCycle,
          amount,
          currency: "INR",
          razorpayOrderId: order.id,
          status: "created",
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(201).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      keyId: process.env.RAZORPAY_KEY_ID || "",
      plan: formatPlanResponse(plan),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyAdminSignupPayment = async (req, res) => {
  try {
    const razorpayOrderId = String(req.body.razorpay_order_id || "").trim();
    const razorpayPaymentId = String(req.body.razorpay_payment_id || "").trim();
    const razorpaySignature = String(req.body.razorpay_signature || "").trim();

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification details are required",
      });
    }

    const pendingSignup = await PendingAdminSignup.findOne({
      razorpayOrderId,
      status: "created",
    });

    if (!pendingSignup) {
      return res.status(404).json({
        success: false,
        message: "Pending signup request not found or already processed",
      });
    }

    const signatureValid = verifyRazorpaySignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!signatureValid) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    const [existingAdmin, plan, payment] = await Promise.all([
      Admin.findOne({ email: pendingSignup.email }).select("_id"),
      SubscriptionPlan.findOne({ code: pendingSignup.planCode, isActive: true }),
      fetchRazorpayPayment(razorpayPaymentId),
    ]);

    if (existingAdmin) {
      return res.status(409).json({ success: false, message: "Admin already exists with this email" });
    }

    if (!plan) {
      return res.status(404).json({ success: false, message: "Plan not found during verification" });
    }

    if (payment.status !== "captured" && payment.status !== "authorized") {
      return res.status(400).json({
        success: false,
        message: `Payment is not completed. Current status: ${payment.status}`,
      });
    }

    const adminId = await generateAdminId(pendingSignup.businessName);
    const plainPassword = pendingSignup.password;
    const admin = await Admin.create({
      adminId,
      businessName: pendingSignup.businessName,
      email: pendingSignup.email,
      mobile: pendingSignup.mobile,
      address: pendingSignup.address,
      panNumber: pendingSignup.panNumber,
      gstNumber: pendingSignup.gstNumber,
      password: pendingSignup.password,
      isActive: true,
      createdBySource: "self_signup",
    });

    const subscription = await assignSubscriptionToAdmin({
      adminId: admin._id,
      plan,
      billingCycle: pendingSignup.billingCycle,
      amountPaid: pendingSignup.amount,
      paymentProvider: "razorpay",
      paymentStatus: "paid",
      providerOrderId: razorpayOrderId,
      providerPaymentId: razorpayPaymentId,
      assignedByRole: "self_signup",
      notes: "Admin self-signup via Razorpay",
    });

    pendingSignup.status = "verified";
    await pendingSignup.save();

    let credentialsEmailSent = false;
    let credentialsEmailMessage = "";

    if (isMailerConfigured()) {
      try {
        await sendAdminAccountCredentialsEmail({
          to: admin.email,
          businessName: admin.businessName,
          adminId: admin.adminId,
          password: plainPassword,
          planName: plan.name,
        });
        credentialsEmailSent = true;
        credentialsEmailMessage = `Credentials email sent to ${admin.email}`;
      } catch (mailError) {
        credentialsEmailMessage =
          mailError?.message || "Account created, but credentials email could not be sent";
      }
    } else {
      credentialsEmailMessage =
        "Account created, but SMTP is not configured so credentials email was not sent";
    }

    return res.status(201).json({
      success: true,
      message: "Admin account created successfully",
      admin: {
        id: admin._id,
        adminId: admin.adminId,
        businessName: admin.businessName,
        email: admin.email,
      },
      subscription: formatSubscriptionForResponse(subscription),
      payment: {
        paymentId: razorpayPaymentId,
        orderId: razorpayOrderId,
        status: payment.status,
      },
      credentialsEmailSent,
      credentialsEmailMessage,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMySubscription = async (req, res) => {
  try {
    const [subscription, plans] = await Promise.all([
      AdminSubscription.findOne({ admin: req.user.id }).populate("plan"),
      SubscriptionPlan.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 }),
    ]);
    return res.json({
      success: true,
      subscription: formatSubscriptionForResponse(subscription),
      plans: plans.map(formatPlanResponse),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createAdminUpgradeOrder = async (req, res) => {
  try {
    const planCode = String(req.body.planCode || "").trim().toUpperCase();
    const billingCycle = String(req.body.billingCycle || "monthly").trim().toLowerCase();

    if (!planCode) {
      return res.status(400).json({ success: false, message: "Plan code is required" });
    }

    if (!["monthly", "yearly"].includes(billingCycle)) {
      return res.status(400).json({ success: false, message: "Invalid billing cycle" });
    }

    const [admin, currentSubscription, plan] = await Promise.all([
      Admin.findById(req.user.id).select("_id businessName email adminId"),
      AdminSubscription.findOne({ admin: req.user.id }).populate("plan"),
      SubscriptionPlan.findOne({ code: planCode, isActive: true }),
    ]);

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    if (!plan) {
      return res.status(404).json({ success: false, message: "Selected plan not found" });
    }

    if (
      currentSubscription?.planCode === planCode &&
      currentSubscription?.billingCycle === billingCycle
    ) {
      return res.status(400).json({
        success: false,
        message: "You are already on this plan and billing cycle",
      });
    }

    const amount = getPlanAmount(plan, billingCycle);
    const receipt = `admin-upgrade-${admin.adminId}-${Date.now()}`;
    const order = await createRazorpayOrder({
      amount,
      receipt,
      notes: {
        adminId: admin.adminId,
        planCode,
        billingCycle,
        purpose: "upgrade",
      },
    });

    await PendingSubscriptionOrder.findOneAndUpdate(
      { razorpayOrderId: order.id },
      {
        $set: {
          admin: admin._id,
          currentSubscription: currentSubscription?._id || null,
          planCode,
          billingCycle,
          amount,
          currency: "INR",
          razorpayOrderId: order.id,
          purpose: "upgrade",
          status: "created",
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(201).json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      keyId: process.env.RAZORPAY_KEY_ID || "",
      plan: formatPlanResponse(plan),
      currentSubscription: formatSubscriptionForResponse(currentSubscription),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyAdminUpgradePayment = async (req, res) => {
  try {
    const razorpayOrderId = String(req.body.razorpay_order_id || "").trim();
    const razorpayPaymentId = String(req.body.razorpay_payment_id || "").trim();
    const razorpaySignature = String(req.body.razorpay_signature || "").trim();

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification details are required",
      });
    }

    const pendingOrder = await PendingSubscriptionOrder.findOne({
      razorpayOrderId,
      admin: req.user.id,
      status: "created",
    });

    if (!pendingOrder) {
      return res.status(404).json({
        success: false,
        message: "Pending upgrade request not found or already processed",
      });
    }

    const signatureValid = verifyRazorpaySignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!signatureValid) {
      return res.status(400).json({ success: false, message: "Invalid payment signature" });
    }

    const [plan, payment] = await Promise.all([
      SubscriptionPlan.findOne({ code: pendingOrder.planCode, isActive: true }),
      fetchRazorpayPayment(razorpayPaymentId),
    ]);

    if (!plan) {
      return res.status(404).json({ success: false, message: "Plan not found during verification" });
    }

    if (payment.status !== "captured" && payment.status !== "authorized") {
      return res.status(400).json({
        success: false,
        message: `Payment is not completed. Current status: ${payment.status}`,
      });
    }

    const subscription = await assignSubscriptionToAdmin({
      adminId: req.user.id,
      plan,
      billingCycle: pendingOrder.billingCycle,
      amountPaid: pendingOrder.amount,
      paymentProvider: "razorpay",
      paymentStatus: "paid",
      providerOrderId: razorpayOrderId,
      providerPaymentId: razorpayPaymentId,
      assignedByRole: "self_signup",
      assignedByUserId: req.user?.id || null,
      notes: "Admin upgraded subscription via Razorpay",
    });

    pendingOrder.status = "verified";
    await pendingOrder.save();

    return res.json({
      success: true,
      message: "Subscription upgraded successfully",
      subscription: formatSubscriptionForResponse(subscription),
      payment: {
        paymentId: razorpayPaymentId,
        orderId: razorpayOrderId,
        status: payment.status,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getSubscriptionAdminOverview = async (_req, res) => {
  try {
    await ensureDefaultSubscriptionPlans();
    const admins = await Admin.find({})
      .select("adminId businessName email mobile isActive createdAt createdBySource")
      .sort({ createdAt: -1 })
      .lean();

    const subscriptions = await AdminSubscription.find({
      admin: { $in: admins.map((admin) => admin._id) },
    }).populate("plan");

    const subscriptionMap = new Map(
      subscriptions.map((subscription) => [String(subscription.admin), subscription])
    );

    return res.json({
      success: true,
      admins: admins.map((admin) => ({
        id: admin._id,
        adminId: admin.adminId,
        businessName: admin.businessName,
        email: admin.email,
        mobile: admin.mobile,
        isActive: admin.isActive,
        createdAt: admin.createdAt,
        createdBySource: admin.createdBySource,
        subscription: formatSubscriptionForResponse(subscriptionMap.get(String(admin._id)) || null),
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createSubscriptionPlan = async (req, res) => {
  try {
    const { error, value } = validatePlanPayload(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const existing = await SubscriptionPlan.findOne({ code: value.code }).select("_id");
    if (existing) {
      return res.status(409).json({ success: false, message: "Plan code already exists" });
    }

    const plan = await SubscriptionPlan.create(value);
    return res.status(201).json({ success: true, plan: formatPlanResponse(plan) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSubscriptionPlan = async (req, res) => {
  try {
    const { error, value } = validatePlanPayload({
      ...req.body,
      code: req.body.code || req.params.code,
    });
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const plan = await SubscriptionPlan.findOneAndUpdate(
      { code: String(req.params.code || "").trim().toUpperCase() },
      { $set: value },
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    return res.json({ success: true, plan: formatPlanResponse(plan) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const assignPlanToAdminBySuperAdmin = async (req, res) => {
  try {
    const planCode = String(req.body.planCode || "").trim().toUpperCase();
    const billingCycle = String(req.body.billingCycle || "monthly").trim().toLowerCase();
    const notes = String(req.body.notes || "").trim();

    if (!planCode) {
      return res.status(400).json({ success: false, message: "Plan code is required" });
    }

    if (!["monthly", "yearly"].includes(billingCycle)) {
      return res.status(400).json({ success: false, message: "Invalid billing cycle" });
    }

    const [admin, plan] = await Promise.all([
      Admin.findById(req.params.adminId).select("_id businessName email adminId"),
      SubscriptionPlan.findOne({ code: planCode, isActive: true }),
    ]);

    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    if (!plan) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    const amountPaid = getPlanAmount(plan, billingCycle);
    const subscription = await assignSubscriptionToAdmin({
      adminId: admin._id,
      plan,
      billingCycle,
      amountPaid,
      paymentProvider: "manual",
      paymentStatus: "manual",
      assignedByRole: "super_admin",
      assignedByUserId: req.user?.id || null,
      notes: notes || "Plan assigned by super admin",
    });

    return res.json({
      success: true,
      message: "Subscription assigned successfully",
      admin: {
        id: admin._id,
        adminId: admin.adminId,
        businessName: admin.businessName,
        email: admin.email,
      },
      subscription: formatSubscriptionForResponse(subscription),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
