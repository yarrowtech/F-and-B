import { useEffect, useMemo, useState } from "react";
import API from "../../services/api";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN") : "-";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const calculateOffer = (basePrice, discountedPrice) => {
  const base = Number(basePrice || 0);
  const offer = Number(discountedPrice || 0);

  if (!base || Number.isNaN(base) || Number.isNaN(offer)) {
    return {
      basePrice: base,
      discountedPrice: offer,
      savingsAmount: 0,
      discountPercent: 0,
    };
  }

  const savingsAmount = Math.max(0, base - offer);
  const discountPercent =
    savingsAmount > 0 ? Math.round((savingsAmount / base) * 100) : 0;

  return {
    basePrice: base,
    discountedPrice: offer,
    savingsAmount,
    discountPercent,
  };
};

const getCyclePricing = (plan, billingCycle) => {
  const basePrice =
    billingCycle === "yearly" ? Number(plan?.yearlyPrice || 0) : Number(plan?.monthlyPrice || 0);
  const offer = plan?.offers?.[billingCycle] || {};
  const preview = calculateOffer(basePrice, offer.discountedPrice);

  return {
    basePrice,
    finalPrice: Boolean(offer.enabled) && preview.discountPercent > 0 ? offer.discountedPrice : basePrice,
    offerEnabled: Boolean(offer.enabled) && preview.discountPercent > 0,
    label: offer.label || "",
    savingsAmount: preview.savingsAmount,
    discountPercent: preview.discountPercent,
  };
};

const statusClassMap = {
  active: "bg-emerald-100 text-emerald-700",
  trial: "bg-sky-100 text-sky-700",
  expired: "bg-red-100 text-red-700",
  cancelled: "bg-amber-100 text-amber-700",
  pending: "bg-slate-100 text-slate-700",
};

const featureRows = [
  { key: "restaurants", label: "Restaurants Included" },
  { key: "staff", label: "Staff Accounts" },
  { key: "reportsAnalytics", label: "Reports & Analytics" },
  { key: "exportEnabled", label: "Excel / PDF Export" },
  { key: "multiRestaurantDashboard", label: "Multi-Restaurant Dashboard" },
  { key: "customSettlementCycles", label: "Custom Settlement Cycles" },
  { key: "auditLogs", label: "Audit Logs" },
  { key: "prioritySupport", label: "Priority Support" },
  { key: "apiIntegrationReady", label: "API / Integration Ready" },
];

const featureValue = (plan, key) => {
  if (key === "restaurants") return plan.maxRestaurants >= 9999 ? "Unlimited" : plan.maxRestaurants;
  if (key === "staff") return plan.maxStaff >= 9999 ? "Unlimited" : `Up to ${plan.maxStaff} Staff`;
  const value = plan.features?.[key];
  if (typeof value === "boolean") return value ? "Included" : "Not Included";
  return value || "-";
};

export default function AdminSubscriptionOverview({ onSubscriptionChange }) {
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [processingPlanCode, setProcessingPlanCode] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await API.get("/subscriptions/me");
      const nextSubscription = res.data?.subscription || null;
      setSubscription(nextSubscription);
      setPlans(res.data?.plans || []);
      onSubscriptionChange?.(nextSubscription);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load subscription");
      onSubscriptionChange?.(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currentPlanCode = subscription?.planCode || "";

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    [plans]
  );

  const loadRazorpayScript = () =>
    new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error("Failed to load Razorpay"));
      document.body.appendChild(script);
    });

  const handleUpgrade = async (plan) => {
    try {
      setProcessingPlanCode(plan.code);
      setError("");
      setMessage("");
      await loadRazorpayScript();

      const orderRes = await API.post("/subscriptions/me/upgrade/order", {
        planCode: plan.code,
        billingCycle,
      });

      const order = orderRes.data?.order;
      const keyId = orderRes.data?.keyId;
      if (!order?.id || !keyId) {
        throw new Error("Checkout configuration is incomplete");
      }

      const razorpay = new window.Razorpay({
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: "EFNBMMS Subscription Upgrade",
        description: `${plan.name} plan upgrade`,
        order_id: order.id,
        theme: { color: plan.isPopular ? "#5b3df5" : "#0f766e" },
        handler: async (response) => {
          try {
            const verifyRes = await API.post("/subscriptions/me/upgrade/verify", response);
            setMessage(verifyRes.data?.message || "Subscription upgraded successfully");
            await fetchData();
          } catch (verifyErr) {
            setError(verifyErr?.response?.data?.message || "Payment succeeded but verification failed.");
          } finally {
            setProcessingPlanCode("");
          }
        },
        modal: {
          ondismiss: () => setProcessingPlanCode(""),
        },
      });

      razorpay.open();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to start upgrade payment");
      setProcessingPlanCode("");
    }
  };

  if (loading) {
    return <div className="rounded-3xl border border-gray-200 bg-white p-6 text-sm text-gray-500">Loading subscription...</div>;
  }

  const badgeClass =
    statusClassMap[String(subscription?.status || "").toLowerCase()] || statusClassMap.pending;

  return (
    <section className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {message}
        </div>
      )}

      <div className="rounded-[2rem] border border-violet-100 bg-[linear-gradient(135deg,#ffffff_0%,#eef2ff_52%,#fff7ed_100%)] p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-500">
              Admin Subscription
            </p>
            <h2 className="mt-3 text-3xl font-black text-slate-900">
              {subscription?.plan?.name || "No Plan Active Yet"}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {subscription?.plan?.description || "Create your account first, then activate a plan here to unlock restaurants, staff, billing, analytics, and the rest of the system."}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Status</p>
              <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold capitalize ${badgeClass}`}>
                {subscription?.status || "pending"}
              </span>
            </div>
            <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-sm">
              {["monthly", "yearly"].map((cycle) => (
                <button
                  key={cycle}
                  type="button"
                  onClick={() => setBillingCycle(cycle)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${
                    billingCycle === cycle ? "bg-slate-900 text-white" : "text-slate-600"
                  }`}
                >
                  {cycle}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Billing Cycle</p>
            <p className="mt-2 text-lg font-bold capitalize text-slate-900">{subscription?.billingCycle || "-"}</p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Amount Paid</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{formatCurrency(subscription?.amountPaid)}</p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Start Date</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{formatDate(subscription?.startDate)}</p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Expiry Date</p>
            <p className="mt-2 text-lg font-bold text-slate-900">{formatDate(subscription?.expiryDate)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-2xl font-black text-slate-900">Upgrade your plan</h3>
        <p className="mt-2 text-sm text-slate-600">
          {subscription
            ? "Choose another plan and pay with Razorpay test mode to upgrade your admin account."
            : "Choose your first plan here. Once payment is completed, the admin system will unlock according to the selected plan."}
        </p>

        <div className="mt-6 grid gap-5 xl:grid-cols-3">
          {sortedPlans.map((plan) => {
            const pricing = getCyclePricing(plan, billingCycle);
            const isCurrentPlan = currentPlanCode === plan.code;

            return (
              <article
                key={plan.code}
                className={`relative overflow-hidden rounded-[1.8rem] border p-5 shadow-sm ${
                  plan.isPopular
                    ? "border-violet-300 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(238,242,255,0.94))]"
                    : "border-slate-200 bg-white"
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute inset-x-0 top-0 bg-[linear-gradient(90deg,#5b3df5,#7c3aed)] px-4 py-2 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white">
                    Most Popular
                  </div>
                )}
                <div className={plan.isPopular ? "pt-8" : ""}>
                  <h4 className="text-2xl font-black text-slate-900">{plan.name}</h4>
                  <p className="mt-2 text-sm text-slate-600">{plan.description}</p>
                  {pricing.offerEnabled && (
                    <p className="mt-4 text-sm font-semibold text-slate-400 line-through">
                      {formatCurrency(pricing.basePrice)}
                    </p>
                  )}
                  <div className="mt-1 text-4xl font-black text-slate-900">{formatCurrency(pricing.finalPrice)}</div>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                    per {billingCycle === "yearly" ? "year" : "month"}
                  </p>
                  {pricing.offerEnabled && (
                    <p className="mt-2 text-sm font-semibold text-emerald-600">
                      {pricing.label || `${pricing.discountPercent}% OFF`} • Save {formatCurrency(pricing.savingsAmount)}
                    </p>
                  )}
                  <div className="mt-5 space-y-2 text-sm text-slate-700">
                    {(plan.displayFeatures || []).slice(0, 6).map((feature) => (
                      <div key={feature} className="flex items-start gap-2">
                        <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">✓</span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    disabled={isCurrentPlan || processingPlanCode === plan.code}
                    onClick={() => handleUpgrade(plan)}
                    className={`mt-6 w-full rounded-full px-5 py-3 text-sm font-semibold text-white transition ${
                      isCurrentPlan
                        ? "bg-slate-300"
                        : plan.isPopular
                          ? "bg-violet-600 hover:bg-violet-500"
                          : "bg-emerald-600 hover:bg-emerald-500"
                    } disabled:cursor-not-allowed disabled:opacity-70`}
                  >
                    {isCurrentPlan
                      ? "Current Plan"
                      : processingPlanCode === plan.code
                        ? "Processing..."
                        : subscription
                          ? `Upgrade To ${plan.name.split(" ")[0]}`
                          : `Activate ${plan.name.split(" ")[0]}`}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-2xl font-black text-slate-900">Plan comparison</h3>
        <div className="mt-6 overflow-x-auto">
          <table className="min-w-[960px] w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="rounded-l-2xl bg-slate-100 px-4 py-4 text-left font-semibold text-slate-600">
                  Features
                </th>
                {sortedPlans.map((plan) => (
                  <th key={plan.code} className="bg-slate-100 px-4 py-4 text-center font-semibold text-slate-700 last:rounded-r-2xl">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {featureRows.map((row) => (
                <tr key={row.key}>
                  <td className="border-b border-slate-100 px-4 py-4 font-medium text-slate-700">
                    {row.label}
                  </td>
                  {sortedPlans.map((plan) => (
                    <td key={`${plan.code}-${row.key}`} className="border-b border-slate-100 px-4 py-4 text-center text-slate-600">
                      {String(featureValue(plan, row.key))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
