import VendorSubscription from "../models/VendorSubscription.model.js";
import VendorSubscriptionPlan from "../models/VendorSubscriptionPlan.model.js";
import { DEFAULT_VENDOR_SUBSCRIPTION_PLANS } from "./vendorSubscriptionDefaults.js";

export const VENDOR_PLAN_RANK = {
  BASIC_VENDOR: 1,
  PRO_VENDOR: 2,
  BUSINESS_VENDOR: 3,
};

export const ensureDefaultVendorSubscriptionPlans = async () => {
  const operations = DEFAULT_VENDOR_SUBSCRIPTION_PLANS.map((plan) => ({
    updateOne: {
      filter: { code: plan.code },
      update: { $setOnInsert: plan },
      upsert: true,
    },
  }));

  if (operations.length) {
    await VendorSubscriptionPlan.bulkWrite(operations, { ordered: false });
  }

  return VendorSubscriptionPlan.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 });
};

export const formatVendorPlanResponse = (plan) => ({
  id: plan._id,
  code: plan.code,
  name: plan.name,
  tagline: plan.tagline,
  description: plan.description,
  tier: plan.tier,
  monthlyPrice: plan.monthlyPrice,
  priceDisplay: `₹${Number(plan.monthlyPrice || 0).toLocaleString("en-IN")} / month`,
  badgeLabel: plan.badgeLabel,
  restaurantLimit: plan.restaurantLimit,
  restaurantLimitLabel: plan.restaurantLimitLabel,
  featureSummary: plan.featureSummary,
  includedFeatures: plan.includedFeatures,
  excludedFeatures: plan.excludedFeatures,
  lockedTriggers: plan.lockedTriggers,
  pageAccess: plan.pageAccess,
  isPopular: plan.isPopular,
  isActive: plan.isActive,
  sortOrder: plan.sortOrder,
  rank: VENDOR_PLAN_RANK[plan.code] || 0,
});

export const formatVendorSubscriptionResponse = (subscription) => {
  if (!subscription) return null;

  const plan = subscription.plan && typeof subscription.plan === "object" ? subscription.plan : null;
  const scheduledPlan =
    subscription.scheduledPlan && typeof subscription.scheduledPlan === "object"
      ? subscription.scheduledPlan
      : null;

  return {
    id: subscription._id,
    vendor: subscription.vendor,
    planCode: subscription.planCode,
    plan: plan ? formatVendorPlanResponse(plan) : null,
    status: subscription.status,
    startDate: subscription.startDate,
    expiryDate: subscription.expiryDate,
    scheduledPlanCode: subscription.scheduledPlanCode || "",
    scheduledPlan: scheduledPlan ? formatVendorPlanResponse(scheduledPlan) : null,
    scheduledChangeAt: subscription.scheduledChangeAt,
    scheduledAmountPaid: subscription.scheduledAmountPaid || 0,
    scheduledPaymentMode: subscription.scheduledPaymentMode || "none",
    amountPaid: subscription.amountPaid,
    currency: subscription.currency,
    paymentMode: subscription.paymentMode,
    providerOrderId: subscription.providerOrderId,
    providerPaymentId: subscription.providerPaymentId,
    assignedByRole: subscription.assignedByRole,
    notes: subscription.notes,
    createdAt: subscription.createdAt,
    updatedAt: subscription.updatedAt,
  };
};

export const getVendorSubscriptionCycleEnd = (startDate = new Date()) => {
  const nextDate = new Date(startDate);
  nextDate.setMonth(nextDate.getMonth() + 1);
  return nextDate;
};

const clearScheduledVendorChange = () => ({
  scheduledPlan: null,
  scheduledPlanCode: "",
  scheduledChangeAt: null,
  scheduledAmountPaid: 0,
  scheduledPaymentMode: "none",
  scheduledProviderOrderId: "",
  scheduledProviderPaymentId: "",
  scheduledAssignedByRole: "system",
  scheduledAssignedByUserId: null,
  scheduledNotes: "",
});

export const assignVendorSubscription = async ({
  vendorId,
  plan,
  assignedByRole = "vendor",
  assignedByUserId = null,
  amountPaid,
  paymentMode = "manual",
  providerOrderId = "",
  providerPaymentId = "",
  notes = "",
}) => {
  const now = new Date();
  const expiryDate = getVendorSubscriptionCycleEnd(now);

  return VendorSubscription.findOneAndUpdate(
    { vendor: vendorId },
    {
      $set: {
        plan: plan._id,
        planCode: plan.code,
        status: "active",
        startDate: now,
        expiryDate,
        amountPaid: Number.isFinite(Number(amountPaid)) ? Number(amountPaid) : Number(plan.monthlyPrice || 0),
        currency: "INR",
        paymentMode,
        providerOrderId,
        providerPaymentId,
        assignedByRole,
        assignedByUserId,
        notes,
        ...clearScheduledVendorChange(),
      },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  ).populate("plan");
};

export const scheduleVendorSubscriptionChange = async ({
  subscription,
  plan,
  assignedByRole = "vendor",
  assignedByUserId = null,
  amountPaid,
  paymentMode = "manual",
  providerOrderId = "",
  providerPaymentId = "",
  notes = "",
}) => {
  const effectiveChangeAt =
    subscription.expiryDate ||
    getVendorSubscriptionCycleEnd(subscription.startDate || subscription.updatedAt || new Date());

  subscription.scheduledPlan = plan._id;
  subscription.scheduledPlanCode = plan.code;
  subscription.scheduledChangeAt = effectiveChangeAt;
  subscription.scheduledAmountPaid = Number.isFinite(Number(amountPaid))
    ? Number(amountPaid)
    : Number(plan.monthlyPrice || 0);
  subscription.scheduledPaymentMode = paymentMode;
  subscription.scheduledProviderOrderId = providerOrderId;
  subscription.scheduledProviderPaymentId = providerPaymentId;
  subscription.scheduledAssignedByRole = assignedByRole;
  subscription.scheduledAssignedByUserId = assignedByUserId;
  subscription.scheduledNotes = notes;
  await subscription.save();

  return subscription.populate(["plan", "scheduledPlan"]);
};

export const resolveVendorSubscriptionState = async (subscription) => {
  if (!subscription) return null;

  const now = new Date();
  let hasChanges = false;

  if (!subscription.expiryDate && ["active", "trial"].includes(String(subscription.status || "").toLowerCase())) {
    subscription.expiryDate = getVendorSubscriptionCycleEnd(
      subscription.startDate || subscription.updatedAt || subscription.createdAt || now
    );
    hasChanges = true;
  }

  if (subscription.expiryDate && subscription.expiryDate <= now) {
    if (subscription.scheduledPlanCode) {
      const nextPlan =
        subscription.scheduledPlan && typeof subscription.scheduledPlan === "object"
          ? subscription.scheduledPlan
          : await VendorSubscriptionPlan.findOne({
              code: subscription.scheduledPlanCode,
              isActive: true,
            });

      if (nextPlan) {
        const nextStart = new Date(subscription.expiryDate);
        const nextExpiry = getVendorSubscriptionCycleEnd(nextStart);

        subscription.plan = nextPlan._id;
        subscription.planCode = nextPlan.code;
        subscription.status = "active";
        subscription.startDate = nextStart;
        subscription.expiryDate = nextExpiry;
        subscription.amountPaid = Number(subscription.scheduledAmountPaid || nextPlan.monthlyPrice || 0);
        subscription.paymentMode = subscription.scheduledPaymentMode || "manual";
        subscription.providerOrderId = subscription.scheduledProviderOrderId || "";
        subscription.providerPaymentId = subscription.scheduledProviderPaymentId || "";
        subscription.assignedByRole = subscription.scheduledAssignedByRole || "system";
        subscription.assignedByUserId = subscription.scheduledAssignedByUserId || null;
        subscription.notes =
          subscription.scheduledNotes ||
          `Scheduled change activated for ${nextPlan.name}`;
        Object.assign(subscription, clearScheduledVendorChange());
        hasChanges = true;
      } else {
        subscription.status = "expired";
        Object.assign(subscription, clearScheduledVendorChange());
        hasChanges = true;
      }
    } else if (subscription.status !== "expired") {
      subscription.status = "expired";
      hasChanges = true;
    }
  }

  if (!hasChanges) {
    return subscription.populate(["plan", "scheduledPlan"]);
  }

  await subscription.save();
  return subscription.populate(["plan", "scheduledPlan"]);
};
