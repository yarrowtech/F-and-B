import crypto from "crypto";

import AdminSubscription from "../models/AdminSubscription.model.js";
import SubscriptionPayment from "../models/SubscriptionPayment.model.js";
import SubscriptionPlan from "../models/SubscriptionPlan.model.js";
import { DEFAULT_ADMIN_SUBSCRIPTION_PLANS } from "./subscriptionDefaults.js";

const RAZORPAY_API_BASE = "https://api.razorpay.com/v1";

const addDuration = (startDate, billingCycle) => {
  const next = new Date(startDate);
  if (billingCycle === "yearly") {
    next.setFullYear(next.getFullYear() + 1);
  } else {
    next.setMonth(next.getMonth() + 1);
  }
  return next;
};

export const ensureDefaultSubscriptionPlans = async () => {
  const operations = DEFAULT_ADMIN_SUBSCRIPTION_PLANS.map((plan) => ({
    updateOne: {
      filter: { code: plan.code },
      update: { $setOnInsert: plan },
      upsert: true,
    },
  }));

  if (operations.length) {
    await SubscriptionPlan.bulkWrite(operations, { ordered: false });
  }

  return SubscriptionPlan.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 });
};

const normalizeOffer = (offer = {}, regularPrice = 0, defaultDurationMonths = 1) => {
  const basePrice = Number(regularPrice || 0);
  const discountPercent = Math.max(0, Math.min(100, Number(offer.discountPercent || 0)));
  const discountedPrice = Math.max(0, Number(offer.discountedPrice || 0));
  const inferredDiscountPercent =
    basePrice > 0 && discountedPrice >= 0 && discountedPrice < basePrice
      ? Math.round(((basePrice - discountedPrice) / basePrice) * 100)
      : 0;

  return {
    enabled: Boolean(offer.enabled) && basePrice > 0 && discountedPrice < basePrice,
    label: String(offer.label || "").trim(),
    discountedPrice,
    discountPercent: discountPercent || inferredDiscountPercent,
    durationMonths: Math.max(1, Number(offer.durationMonths || defaultDurationMonths)),
    savingsAmount: Math.max(0, basePrice - discountedPrice),
  };
};

export const getPlanPricing = (plan) => {
  const monthlyPrice = Number(plan?.monthlyPrice || 0);
  const rawYearlyPrice = Number(plan?.yearlyPrice || 0);
  const inferredLegacyYearlyBasePrice = monthlyPrice > 0 ? monthlyPrice * 12 : rawYearlyPrice;
  const hasLegacyYearlyOffer =
    rawYearlyPrice > 0 &&
    inferredLegacyYearlyBasePrice > rawYearlyPrice &&
    Number(plan?.yearlyDiscountPercent || 0) > 0;
  const yearlyBasePrice = hasLegacyYearlyOffer
    ? inferredLegacyYearlyBasePrice
    : rawYearlyPrice;
  const monthlyOffer = normalizeOffer(plan?.offers?.monthly, monthlyPrice, 1);
  const explicitYearlyOffer = normalizeOffer(
    plan?.offers?.yearly,
    yearlyBasePrice,
    12
  );
  const yearlyOffer = explicitYearlyOffer.enabled
    ? explicitYearlyOffer
    : hasLegacyYearlyOffer
      ? normalizeOffer(
          {
            enabled: true,
            label: "Yearly offer",
            discountedPrice: rawYearlyPrice,
            discountPercent: Number(plan?.yearlyDiscountPercent || 0),
            durationMonths: 12,
          },
          yearlyBasePrice,
          12
        )
      : explicitYearlyOffer;

  return {
    monthlyPrice,
    yearlyPrice: yearlyBasePrice,
    monthlyOffer,
    yearlyOffer,
  };
};

export const getPlanAmount = (plan, billingCycle) => {
  const pricing = getPlanPricing(plan);
  if (billingCycle === "yearly") {
    return pricing.yearlyOffer.enabled
      ? pricing.yearlyOffer.discountedPrice
      : pricing.yearlyPrice;
  }

  return pricing.monthlyOffer.enabled
    ? pricing.monthlyOffer.discountedPrice
    : pricing.monthlyPrice;
};

export const formatSubscriptionForResponse = (subscription) => {
  if (!subscription) return null;

  const plan = subscription.plan && typeof subscription.plan === "object"
    ? subscription.plan
    : null;

  return {
    id: subscription._id,
    plan: plan
      ? (() => {
          const pricing = getPlanPricing(plan);
          return {
          id: plan._id,
          code: plan.code,
          name: plan.name,
          description: plan.description,
          monthlyPrice: pricing.monthlyPrice,
          yearlyPrice: pricing.yearlyPrice,
          yearlyDiscountPercent:
            pricing.yearlyOffer.discountPercent || plan.yearlyDiscountPercent,
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
          };
        })()
      : null,
    planCode: subscription.planCode,
    billingCycle: subscription.billingCycle,
    status: subscription.status,
    startDate: subscription.startDate,
    expiryDate: subscription.expiryDate,
    amountPaid: subscription.amountPaid,
    currency: subscription.currency,
    paymentStatus: subscription.paymentStatus,
    paymentProvider: subscription.paymentProvider,
    providerOrderId: subscription.providerOrderId,
    providerPaymentId: subscription.providerPaymentId,
    assignedByRole: subscription.assignedByRole,
    notes: subscription.notes,
    createdAt: subscription.createdAt,
    updatedAt: subscription.updatedAt,
  };
};

export const assignSubscriptionToAdmin = async ({
  adminId,
  plan,
  billingCycle,
  amountPaid = 0,
  paymentProvider = "manual",
  paymentStatus = "manual",
  providerOrderId = "",
  providerPaymentId = "",
  assignedByRole = "super_admin",
  assignedByUserId = null,
  notes = "",
}) => {
  const now = new Date();
  const expiryDate = addDuration(now, billingCycle);

  const subscription = await AdminSubscription.findOneAndUpdate(
    { admin: adminId },
    {
      $set: {
        plan: plan._id,
        planCode: plan.code,
        billingCycle,
        status: "active",
        startDate: now,
        expiryDate,
        amountPaid,
        currency: "INR",
        paymentStatus,
        paymentProvider,
        providerOrderId,
        providerPaymentId,
        assignedByRole,
        assignedByUserId,
        notes,
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  ).populate("plan");

  if (paymentStatus === "paid" || paymentStatus === "manual" || paymentStatus === "free") {
    await SubscriptionPayment.create({
      admin: adminId,
      subscription: subscription._id,
      planCode: plan.code,
      billingCycle,
      amount: amountPaid,
      currency: "INR",
      provider: paymentProvider === "razorpay" ? "razorpay" : "manual",
      providerOrderId,
      providerPaymentId,
      status: paymentProvider === "razorpay" ? "paid" : "manual",
      notes,
    });
  }

  return subscription;
};

const getRazorpayAuthHeader = () => {
  const keyId = String(process.env.RAZORPAY_KEY_ID || "").trim();
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || "").trim();

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured");
  }

  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
};

export const createRazorpayOrder = async ({ amount, receipt, notes = {} }) => {
  const response = await fetch(`${RAZORPAY_API_BASE}/orders`, {
    method: "POST",
    headers: {
      Authorization: getRazorpayAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(Number(amount) * 100),
      currency: "INR",
      receipt,
      payment_capture: 1,
      notes,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.description || "Failed to create Razorpay order");
  }

  return data;
};

export const verifyRazorpaySignature = ({
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature,
}) => {
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || "").trim();
  if (!keySecret) {
    throw new Error("Razorpay secret is not configured");
  }

  const digest = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  return digest === razorpaySignature;
};

export const fetchRazorpayPayment = async (paymentId) => {
  const response = await fetch(`${RAZORPAY_API_BASE}/payments/${paymentId}`, {
    headers: {
      Authorization: getRazorpayAuthHeader(),
    },
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.description || "Failed to fetch Razorpay payment");
  }

  return data;
};
