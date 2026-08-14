import Vendor from "../models/Vendor.model.js";
import VendorSubscription from "../models/VendorSubscription.model.js";
import VendorSubscriptionPlan from "../models/VendorSubscriptionPlan.model.js";
import PendingVendorSubscriptionOrder from "../models/PendingVendorSubscriptionOrder.model.js";
import {
  assignVendorSubscription,
  ensureDefaultVendorSubscriptionPlans,
  formatVendorPlanResponse,
  formatVendorSubscriptionResponse,
  resolveVendorSubscriptionState,
  scheduleVendorSubscriptionChange,
} from "../utils/vendorSubscription.service.js";
import {
  createRazorpayOrder,
  fetchRazorpayPayment,
  verifyRazorpaySignature,
} from "../utils/subscription.service.js";

const ACTIVE_VENDOR_SUBSCRIPTION_STATUSES = new Set(["active", "trial"]);

const canScheduleVendorPlanChange = (subscription, nextPlanCode) => {
  if (!subscription) return false;
  const currentStatus = String(subscription.status || "").toLowerCase();
  const hasRunningPlan =
    ACTIVE_VENDOR_SUBSCRIPTION_STATUSES.has(currentStatus) &&
    subscription.expiryDate &&
    new Date(subscription.expiryDate) > new Date();

  return hasRunningPlan && String(subscription.planCode || "") !== String(nextPlanCode || "");
};

const normalizeStringArray = (value) =>
  (Array.isArray(value) ? value : [])
    .map((item) => String(item || "").trim())
    .filter(Boolean);

const validateVendorPlanPayload = (body = {}) => {
  const code = String(body.code || "").trim().toUpperCase();
  const name = String(body.name || "").trim();
  const tagline = String(body.tagline || "").trim();
  const description = String(body.description || "").trim();
  const tier = String(body.tier || "").trim().toLowerCase();
  const badgeLabel = String(body.badgeLabel || "").trim();
  const restaurantLimitLabel = String(body.restaurantLimitLabel || "").trim();
  const monthlyPrice = Number(body.monthlyPrice);
  const restaurantLimit = Number(body.restaurantLimit);
  const sortOrder = Number(body.sortOrder || 0);

  if (!code || !name || !tagline || !description || !badgeLabel || !restaurantLimitLabel) {
    return { error: "Code, name, tagline, description, badge label, and restaurant label are required" };
  }

  if (!["basic", "pro", "business"].includes(tier)) {
    return { error: "Tier must be basic, pro, or business" };
  }

  if (Number.isNaN(monthlyPrice) || monthlyPrice < 0) {
    return { error: "Monthly price must be a valid number" };
  }

  if (Number.isNaN(restaurantLimit) || restaurantLimit < 0) {
    return { error: "Restaurant limit must be a valid number" };
  }

  return {
    value: {
      code,
      name,
      tagline,
      description,
      tier,
      monthlyPrice,
      priceDisplay: `₹${monthlyPrice.toLocaleString("en-IN")} / month`,
      badgeLabel,
      restaurantLimit,
      restaurantLimitLabel,
      featureSummary: normalizeStringArray(body.featureSummary),
      includedFeatures: normalizeStringArray(body.includedFeatures),
      excludedFeatures: normalizeStringArray(body.excludedFeatures),
      lockedTriggers: normalizeStringArray(body.lockedTriggers),
      pageAccess: normalizeStringArray(body.pageAccess),
      isPopular: Boolean(body.isPopular),
      isActive: body.isActive !== false,
      sortOrder: Number.isNaN(sortOrder) ? 0 : sortOrder,
    },
  };
};

const promoteVendorToGlobalIfNeeded = async (vendorId) => {
  const vendor = await Vendor.findById(vendorId);
  if (!vendor) return null;

  if (vendor.vendorType !== "global") {
    const nextConnectedAdmins = new Set(
      (vendor.connectedAdmins || []).map((adminId) => String(adminId))
    );

    if (vendor.createdByAdmin) {
      nextConnectedAdmins.add(String(vendor.createdByAdmin));
    }

    vendor.vendorType = "global";
    vendor.connectedAdmins = Array.from(nextConnectedAdmins);
    vendor.allRestaurantsAccess = true;
    vendor.upgradeRequestStatus = "none";
    vendor.upgradeRequestedAt = null;
    vendor.upgradeReviewedAt = new Date();
    await vendor.save();
  }

  return vendor;
};

export const getPublicVendorPlans = async (_req, res) => {
  try {
    const plans = await ensureDefaultVendorSubscriptionPlans();

    return res.json({
      success: true,
      plans: plans.map(formatVendorPlanResponse),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getVendorSubscriptionOverview = async (req, res) => {
  try {
    const vendorId = req.user?.id;
    const [rawSubscription, plans] = await Promise.all([
      VendorSubscription.findOne({ vendor: vendorId }).populate(["plan", "scheduledPlan"]),
      ensureDefaultVendorSubscriptionPlans(),
    ]);
    const subscription = await resolveVendorSubscriptionState(rawSubscription);

    const effectiveStatus = subscription?.status || "blocked_due_to_plan";

    return res.json({
      success: true,
      subscription: formatVendorSubscriptionResponse(subscription),
      status: effectiveStatus,
      hasActiveSubscription: ACTIVE_VENDOR_SUBSCRIPTION_STATUSES.has(effectiveStatus),
      plans: plans.map(formatVendorPlanResponse),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const activateVendorSubscription = async (req, res) => {
  try {
    const vendorId = req.user?.id;
    const planCode = String(req.body.planCode || "").trim().toUpperCase();
    const notes = String(req.body.notes || "").trim();

    if (!planCode) {
      return res.status(400).json({ success: false, message: "Plan code is required" });
    }

    const [vendor, plan] = await Promise.all([
      Vendor.findById(vendorId).select("_id name vendorType isActive"),
      VendorSubscriptionPlan.findOne({ code: planCode, isActive: true }),
    ]);

    if (!vendor || vendor.isActive === false) {
      return res.status(404).json({ success: false, message: "Vendor account not found" });
    }

    if (!plan) {
      return res.status(404).json({ success: false, message: "Selected vendor plan not found" });
    }

    const currentSubscription = await resolveVendorSubscriptionState(
      await VendorSubscription.findOne({ vendor: vendorId }).populate(["plan", "scheduledPlan"])
    );
    const shouldSchedule = canScheduleVendorPlanChange(currentSubscription, plan.code);

    const subscription = shouldSchedule
      ? await scheduleVendorSubscriptionChange({
          subscription: currentSubscription,
          plan,
          assignedByRole: "vendor",
          assignedByUserId: vendor._id,
          paymentMode: plan.monthlyPrice > 0 ? "manual" : "free",
          amountPaid: Number(plan.monthlyPrice || 0),
          notes: notes || `Vendor scheduled ${plan.name} as the next plan`,
        })
      : await assignVendorSubscription({
          vendorId,
          plan,
          assignedByRole: "vendor",
          assignedByUserId: vendor._id,
          paymentMode: plan.monthlyPrice > 0 ? "manual" : "free",
          amountPaid: Number(plan.monthlyPrice || 0),
          notes: notes || `Vendor selected ${plan.name}`,
        });
    const updatedVendor = await promoteVendorToGlobalIfNeeded(vendorId);

    return res.json({
      success: true,
      message:
        shouldSchedule
          ? `${plan.name} is scheduled and will activate after the current plan ends`
          : vendor.vendorType === "local"
          ? `${plan.name} activated successfully and vendor upgraded to global`
          : `${plan.name} activated successfully`,
      subscription: formatVendorSubscriptionResponse(subscription),
      vendor: updatedVendor
        ? {
            id: updatedVendor._id,
            vendorId: updatedVendor.vendorId,
            vendorType: updatedVendor.vendorType,
          }
        : null,
      hasActiveSubscription: true,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getVendorPlanStatus = async (req, res) => {
  try {
    const vendorId = req.user?.id;
    const subscription = await resolveVendorSubscriptionState(
      await VendorSubscription.findOne({ vendor: vendorId }).populate(["plan", "scheduledPlan"])
    );
    const effectiveStatus = subscription?.status || "blocked_due_to_plan";

    return res.json({
      success: true,
      status: effectiveStatus,
      hasActiveSubscription: ACTIVE_VENDOR_SUBSCRIPTION_STATUSES.has(effectiveStatus),
      subscription: formatVendorSubscriptionResponse(subscription),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createVendorSubscriptionOrder = async (req, res) => {
  try {
    const vendorId = req.user?.id;
    const planCode = String(req.body.planCode || "").trim().toUpperCase();

    if (!planCode) {
      return res.status(400).json({ success: false, message: "Plan code is required" });
    }

    const [vendor, currentSubscriptionRaw, plan] = await Promise.all([
      Vendor.findById(vendorId).select("_id name email vendorId isActive"),
      VendorSubscription.findOne({ vendor: vendorId }),
      VendorSubscriptionPlan.findOne({ code: planCode, isActive: true }),
    ]);
    const currentSubscription = await resolveVendorSubscriptionState(currentSubscriptionRaw);

    if (!vendor || vendor.isActive === false) {
      return res.status(404).json({ success: false, message: "Vendor account not found" });
    }

    if (!plan) {
      return res.status(404).json({ success: false, message: "Selected vendor plan not found" });
    }

    if (
      currentSubscription?.planCode === planCode &&
      ACTIVE_VENDOR_SUBSCRIPTION_STATUSES.has(String(currentSubscription?.status || "").toLowerCase())
    ) {
      return res.status(400).json({
        success: false,
        message: "This vendor plan is already active",
      });
    }

    if (currentSubscription?.scheduledPlanCode === planCode) {
      return res.status(400).json({
        success: false,
        message: "This vendor plan is already scheduled as the next plan",
      });
    }

    const amount = Number(plan.monthlyPrice || 0);
    if (amount <= 0) {
      const shouldSchedule = canScheduleVendorPlanChange(currentSubscription, plan.code);
      const subscription = shouldSchedule
        ? await scheduleVendorSubscriptionChange({
            subscription: currentSubscription,
            plan,
            assignedByRole: "vendor",
            assignedByUserId: vendor._id,
            paymentMode: "free",
            amountPaid: 0,
            notes: `Vendor scheduled free plan ${plan.name}`,
          })
        : await assignVendorSubscription({
            vendorId,
            plan,
            assignedByRole: "vendor",
            assignedByUserId: vendor._id,
            paymentMode: "free",
            amountPaid: 0,
            notes: `Vendor activated free plan ${plan.name}`,
          });
      const updatedVendor = await promoteVendorToGlobalIfNeeded(vendorId);

      return res.status(201).json({
        success: true,
        freeActivation: true,
        message:
          shouldSchedule
            ? `${plan.name} is scheduled and will activate after the current plan ends`
            : vendor.vendorType === "local"
            ? `${plan.name} activated successfully and vendor upgraded to global`
            : `${plan.name} activated successfully`,
        subscription: formatVendorSubscriptionResponse(subscription),
        vendor: updatedVendor
          ? {
              id: updatedVendor._id,
              vendorId: updatedVendor.vendorId,
              vendorType: updatedVendor.vendorType,
            }
          : null,
      });
    }

    const receipt = `vendor-plan-${vendor.vendorId}-${Date.now()}`;
    const order = await createRazorpayOrder({
      amount,
      receipt,
      notes: {
        vendorId: vendor.vendorId,
        planCode,
        purpose: "activation",
      },
    });

    await PendingVendorSubscriptionOrder.findOneAndUpdate(
      { razorpayOrderId: order.id },
      {
        $set: {
          vendor: vendor._id,
          currentSubscription: currentSubscription?._id || null,
          planCode,
          amount,
          currency: "INR",
          razorpayOrderId: order.id,
          purpose: "activation",
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
      plan: formatVendorPlanResponse(plan),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyVendorSubscriptionPayment = async (req, res) => {
  try {
    const vendorId = req.user?.id;
    const razorpayOrderId = String(req.body.razorpay_order_id || "").trim();
    const razorpayPaymentId = String(req.body.razorpay_payment_id || "").trim();
    const razorpaySignature = String(req.body.razorpay_signature || "").trim();

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification details are required",
      });
    }

    const pendingOrder = await PendingVendorSubscriptionOrder.findOne({
      razorpayOrderId,
      vendor: vendorId,
      status: "created",
    });

    if (!pendingOrder) {
      return res.status(404).json({
        success: false,
        message: "Pending vendor payment not found or already processed",
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
      VendorSubscriptionPlan.findOne({ code: pendingOrder.planCode, isActive: true }),
      fetchRazorpayPayment(razorpayPaymentId),
    ]);

    if (!plan) {
      return res.status(404).json({ success: false, message: "Vendor plan not found during verification" });
    }

    if (payment.status !== "captured" && payment.status !== "authorized") {
      return res.status(400).json({
        success: false,
        message: `Payment is not completed. Current status: ${payment.status}`,
      });
    }

    const currentSubscription = await resolveVendorSubscriptionState(
      await VendorSubscription.findOne({ vendor: vendorId }).populate(["plan", "scheduledPlan"])
    );
    const shouldSchedule = canScheduleVendorPlanChange(currentSubscription, plan.code);

    const subscription = shouldSchedule
      ? await scheduleVendorSubscriptionChange({
          subscription: currentSubscription,
          plan,
          assignedByRole: "vendor",
          assignedByUserId: req.user?.id || null,
          paymentMode: "razorpay",
          amountPaid: pendingOrder.amount,
          providerOrderId: razorpayOrderId,
          providerPaymentId: razorpayPaymentId,
          notes: "Vendor plan scheduled via Razorpay",
        })
      : await assignVendorSubscription({
          vendorId,
          plan,
          assignedByRole: "vendor",
          assignedByUserId: req.user?.id || null,
          paymentMode: "razorpay",
          amountPaid: pendingOrder.amount,
          providerOrderId: razorpayOrderId,
          providerPaymentId: razorpayPaymentId,
          notes: "Vendor plan activated via Razorpay",
        });
    const updatedVendor = await promoteVendorToGlobalIfNeeded(vendorId);

    pendingOrder.status = "verified";
    await pendingOrder.save();

    return res.json({
      success: true,
      message:
        shouldSchedule
          ? "Vendor subscription scheduled successfully. It will activate after the current plan ends"
          : updatedVendor?.vendorType === "global"
          ? "Vendor subscription activated successfully and account upgraded to global vendor"
          : "Vendor subscription activated successfully",
      subscription: formatVendorSubscriptionResponse(subscription),
      vendor: updatedVendor
        ? {
            id: updatedVendor._id,
            vendorId: updatedVendor.vendorId,
            vendorType: updatedVendor.vendorType,
          }
        : null,
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

export const getVendorSubscriptionSuperAdminOverview = async (_req, res) => {
  try {
    const [plans, vendors] = await Promise.all([
      ensureDefaultVendorSubscriptionPlans(),
      Vendor.find({})
        .select("vendorId name email phone vendorType createdByRole isActive createdAt")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const subscriptions = await VendorSubscription.find({
      vendor: { $in: vendors.map((vendor) => vendor._id) },
    }).populate(["plan", "scheduledPlan"]);

    const subscriptionMap = new Map(
      subscriptions.map((subscription) => [String(subscription.vendor), subscription])
    );

    return res.json({
      success: true,
      plans: plans.map(formatVendorPlanResponse),
      vendors: vendors.map((vendor) => ({
        id: vendor._id,
        vendorId: vendor.vendorId,
        name: vendor.name,
        email: vendor.email,
        phone: vendor.phone,
        vendorType: vendor.vendorType,
        createdByRole: vendor.createdByRole,
        isActive: vendor.isActive,
        createdAt: vendor.createdAt,
        subscription: formatVendorSubscriptionResponse(
          subscriptionMap.get(String(vendor._id)) || null
        ),
      })),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createVendorSubscriptionPlan = async (req, res) => {
  try {
    const { error, value } = validateVendorPlanPayload(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const existing = await VendorSubscriptionPlan.findOne({ code: value.code }).select("_id");
    if (existing) {
      return res.status(409).json({ success: false, message: "Vendor plan code already exists" });
    }

    const plan = await VendorSubscriptionPlan.create(value);
    return res.status(201).json({ success: true, plan: formatVendorPlanResponse(plan) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateVendorSubscriptionPlan = async (req, res) => {
  try {
    const { error, value } = validateVendorPlanPayload({
      ...req.body,
      code: req.body.code || req.params.code,
    });
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const plan = await VendorSubscriptionPlan.findOneAndUpdate(
      { code: String(req.params.code || "").trim().toUpperCase() },
      { $set: value },
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({ success: false, message: "Vendor plan not found" });
    }

    return res.json({ success: true, plan: formatVendorPlanResponse(plan) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const assignPlanToVendorBySuperAdmin = async (req, res) => {
  try {
    const planCode = String(req.body.planCode || "").trim().toUpperCase();
    const notes = String(req.body.notes || "").trim();

    if (!planCode) {
      return res.status(400).json({ success: false, message: "Plan code is required" });
    }

    const [vendor, plan] = await Promise.all([
      Vendor.findById(req.params.vendorId).select("_id name email vendorId vendorType isActive"),
      VendorSubscriptionPlan.findOne({ code: planCode, isActive: true }),
    ]);

    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found" });
    }

    if (!plan) {
      return res.status(404).json({ success: false, message: "Vendor plan not found" });
    }

    const currentSubscription = await resolveVendorSubscriptionState(
      await VendorSubscription.findOne({ vendor: vendor._id }).populate(["plan", "scheduledPlan"])
    );
    const shouldSchedule = canScheduleVendorPlanChange(currentSubscription, plan.code);

    const subscription = shouldSchedule
      ? await scheduleVendorSubscriptionChange({
          subscription: currentSubscription,
          plan,
          assignedByRole: "super_admin",
          assignedByUserId: req.user?.id || null,
          paymentMode: "manual",
          amountPaid: Number(plan.monthlyPrice || 0),
          notes: notes || "Vendor next plan scheduled by super admin",
        })
      : await assignVendorSubscription({
          vendorId: vendor._id,
          plan,
          assignedByRole: "super_admin",
          assignedByUserId: req.user?.id || null,
          paymentMode: "manual",
          amountPaid: Number(plan.monthlyPrice || 0),
          notes: notes || "Vendor plan assigned by super admin",
        });
    const updatedVendor = await promoteVendorToGlobalIfNeeded(vendor._id);

    return res.json({
      success: true,
      message: shouldSchedule
        ? "Vendor next plan scheduled successfully"
        : "Vendor subscription assigned successfully",
      vendor: updatedVendor
        ? {
            id: updatedVendor._id,
            vendorId: updatedVendor.vendorId,
            name: updatedVendor.name,
            email: updatedVendor.email,
            vendorType: updatedVendor.vendorType,
          }
        : null,
      subscription: formatVendorSubscriptionResponse(subscription),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getPublicVendorPlans,
  getVendorSubscriptionOverview,
  activateVendorSubscription,
  createVendorSubscriptionOrder,
  verifyVendorSubscriptionPayment,
  getVendorPlanStatus,
  getVendorSubscriptionSuperAdminOverview,
  createVendorSubscriptionPlan,
  updateVendorSubscriptionPlan,
  assignPlanToVendorBySuperAdmin,
};
