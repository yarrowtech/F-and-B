import { Fragment, useEffect, useMemo, useState } from "react";
import API from "../../services/api";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const DAY_MS = 24 * 60 * 60 * 1000;

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

const STATUS_STYLES = {
  active: { chip: "bg-emerald-50 text-emerald-700 ring-emerald-200", dot: "bg-emerald-500" },
  trial: { chip: "bg-sky-50 text-sky-700 ring-sky-200", dot: "bg-sky-500" },
  expired: { chip: "bg-red-50 text-red-700 ring-red-200", dot: "bg-red-500" },
  cancelled: { chip: "bg-amber-50 text-amber-700 ring-amber-200", dot: "bg-amber-500" },
  pending: { chip: "bg-slate-100 text-slate-700 ring-slate-200", dot: "bg-slate-400" },
};

const featureRows = [
  { key: "restaurants", label: "Restaurants included", group: "Capacity" },
  { key: "staff", label: "Staff accounts", group: "Capacity" },
  { key: "reportsAnalytics", label: "Reports & analytics", group: "Insights" },
  { key: "exportEnabled", label: "Excel / PDF export", group: "Insights" },
  { key: "multiRestaurantDashboard", label: "Multi-restaurant dashboard", group: "Insights" },
  { key: "customSettlementCycles", label: "Custom settlement cycles", group: "Operations" },
  { key: "auditLogs", label: "Audit logs", group: "Operations" },
  { key: "prioritySupport", label: "Priority support", group: "Support" },
  { key: "apiIntegrationReady", label: "API / integration ready", group: "Support" },
];

const featureValue = (plan, key) => {
  if (key === "restaurants") return plan.maxRestaurants >= 9999 ? "Unlimited" : plan.maxRestaurants;
  if (key === "staff") return plan.maxStaff >= 9999 ? "Unlimited" : `Up to ${plan.maxStaff}`;
  const value = plan.features?.[key];
  if (typeof value === "boolean") return value;
  return value || "—";
};

const Check = () => (
  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700">
    ✓
  </span>
);

const Cross = () => <span className="text-base text-slate-300">—</span>;

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

  // biggest saving a customer gets by paying yearly instead of 12 × monthly
  const yearlySavingPercent = useMemo(() => {
    const percents = sortedPlans.map((plan) => {
      const monthly = getCyclePricing(plan, "monthly").finalPrice * 12;
      const yearly = getCyclePricing(plan, "yearly").finalPrice;
      return monthly > 0 && yearly > 0 && yearly < monthly
        ? Math.round((1 - yearly / monthly) * 100)
        : 0;
    });
    return Math.max(0, ...percents);
  }, [sortedPlans]);

  // plan period progress
  const period = useMemo(() => {
    if (!subscription?.startDate || !subscription?.expiryDate) return null;
    const start = new Date(subscription.startDate).getTime();
    const end = new Date(subscription.expiryDate).getTime();
    const now = Date.now();
    if (!start || !end || end <= start) return null;
    const total = Math.round((end - start) / DAY_MS);
    const daysLeft = Math.ceil((end - now) / DAY_MS);
    const used = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
    return { total, daysLeft, used };
  }, [subscription]);

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
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Loading subscription...
      </div>
    );
  }

  const status = String(subscription?.status || "pending").toLowerCase();
  const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.pending;
  const expiringSoon = period && period.daysLeft >= 0 && period.daysLeft <= 7;
  const expired = status === "expired" || (period && period.daysLeft < 0);
  const busy = Boolean(processingPlanCode);

  const groups = featureRows.reduce((acc, row) => {
    (acc[row.group] = acc[row.group] || []).push(row);
    return acc;
  }, {});

  return (
    <section className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
          {message}
        </div>
      )}

      {/* ── 1. CURRENT SUBSCRIPTION ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        {subscription ? (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Current plan
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-2.5">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {subscription.plan?.name || "Plan"}
                  </h2>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold capitalize ring-1 ${statusStyle.chip}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                    {status}
                  </span>
                </div>
                {subscription.plan?.description && (
                  <p className="mt-1 max-w-2xl text-sm text-slate-500">
                    {subscription.plan.description}
                  </p>
                )}
              </div>

              {period && (
                <div className="shrink-0 text-left sm:text-right">
                  <p
                    className={`text-3xl font-extrabold leading-none ${
                      expired
                        ? "text-red-600"
                        : expiringSoon
                          ? "text-amber-600"
                          : "text-slate-900"
                    }`}
                  >
                    {expired ? "Expired" : period.daysLeft}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {expired
                      ? `on ${formatDate(subscription.expiryDate)}`
                      : `day${period.daysLeft === 1 ? "" : "s"} left`}
                  </p>
                </div>
              )}
            </div>

            {period && (
              <div className="mt-4">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${
                      expired ? "bg-red-500" : expiringSoon ? "bg-amber-500" : "bg-violet-500"
                    }`}
                    style={{ width: `${period.used}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between text-[11px] text-slate-500">
                  <span>{formatDate(subscription.startDate)}</span>
                  <span>{formatDate(subscription.expiryDate)}</span>
                </div>
              </div>
            )}

            {(expired || expiringSoon) && (
              <p
                className={`mt-3 rounded-lg px-3 py-2 text-sm font-medium ${
                  expired ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
                }`}
              >
                {expired
                  ? "Your subscription has expired. Choose a plan below to restore access."
                  : `Your plan expires in ${period.daysLeft} day${period.daysLeft === 1 ? "" : "s"}. Renew or upgrade below to avoid interruption.`}
              </p>
            )}

            <dl className="mt-4 grid grid-cols-2 gap-2.5 border-t border-slate-100 pt-4 lg:grid-cols-4">
              {[
                { label: "Billing cycle", value: subscription.billingCycle || "—", capitalize: true },
                { label: "Amount paid", value: formatCurrency(subscription.amountPaid) },
                { label: "Started", value: formatDate(subscription.startDate) },
                { label: "Expires", value: formatDate(subscription.expiryDate) },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-slate-50 px-3 py-2">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    {item.label}
                  </dt>
                  <dd
                    className={`mt-0.5 text-sm font-bold text-slate-900 ${
                      item.capitalize ? "capitalize" : ""
                    }`}
                  >
                    {item.value}
                  </dd>
                </div>
              ))}
            </dl>
          </>
        ) : (
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Subscription
            </p>
            <h2 className="text-2xl font-bold text-slate-900">No active plan yet</h2>
            <p className="max-w-2xl text-sm text-slate-500">
              Pick a plan below to unlock restaurants, staff accounts, billing, analytics and the
              rest of the system. It activates as soon as the payment is completed.
            </p>
          </div>
        )}
      </div>

      {/* ── 2. CHOOSE A PLAN ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {subscription ? "Upgrade or renew" : "Choose your plan"}
            </h3>
            <p className="text-sm text-slate-500">
              Secure payment with Razorpay. Your plan updates right after payment.
            </p>
          </div>

          <div className="inline-flex shrink-0 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            {["monthly", "yearly"].map((cycle) => (
              <button
                key={cycle}
                type="button"
                disabled={busy}
                onClick={() => setBillingCycle(cycle)}
                className={`inline-flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-semibold capitalize transition disabled:opacity-60 ${
                  billingCycle === cycle
                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {cycle}
                {cycle === "yearly" && yearlySavingPercent > 0 && (
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                    Save {yearlySavingPercent}%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          {sortedPlans.map((plan) => {
            const pricing = getCyclePricing(plan, billingCycle);
            const isCurrentPlan = currentPlanCode === plan.code;
            const isProcessing = processingPlanCode === plan.code;
            const firstWord = plan.name.split(" ")[0];

            return (
              <article
                key={plan.code}
                className={`relative flex flex-col rounded-xl border p-4 transition ${
                  isCurrentPlan
                    ? "border-emerald-300 bg-emerald-50/40 ring-1 ring-emerald-200"
                    : plan.isPopular
                      ? "border-violet-300 bg-violet-50/40 ring-1 ring-violet-200"
                      : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-lg font-bold text-slate-900">{plan.name}</h4>
                  {isCurrentPlan ? (
                    <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-700">
                      Current
                    </span>
                  ) : plan.isPopular ? (
                    <span className="rounded-md bg-violet-600 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                      Popular
                    </span>
                  ) : null}
                </div>
                {plan.description && (
                  <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-slate-500">
                    {plan.description}
                  </p>
                )}

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {formatCurrency(pricing.finalPrice)}
                  </span>
                  <span className="text-xs text-slate-500">
                    / {billingCycle === "yearly" ? "year" : "month"}
                  </span>
                  {pricing.offerEnabled && (
                    <span className="text-sm font-medium text-slate-400 line-through">
                      {formatCurrency(pricing.basePrice)}
                    </span>
                  )}
                </div>
                {pricing.offerEnabled ? (
                  <p className="mt-1 text-xs font-semibold text-emerald-600">
                    {pricing.label || `${pricing.discountPercent}% off`} · save{" "}
                    {formatCurrency(pricing.savingsAmount)}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-transparent select-none">.</p>
                )}

                <ul className="mt-3 flex-1 space-y-1.5 border-t border-slate-100 pt-3 text-sm text-slate-700">
                  {(plan.displayFeatures || []).slice(0, 6).map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <span className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700">
                        ✓
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  disabled={isCurrentPlan || busy}
                  onClick={() => handleUpgrade(plan)}
                  className={`mt-4 w-full rounded-lg px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed ${
                    isCurrentPlan
                      ? "bg-slate-100 text-slate-500"
                      : plan.isPopular
                        ? "bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-60"
                        : "bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
                  }`}
                >
                  {isCurrentPlan
                    ? "Your current plan"
                    : isProcessing
                      ? "Processing..."
                      : subscription
                        ? `Upgrade to ${firstWord}`
                        : `Activate ${firstWord}`}
                </button>
              </article>
            );
          })}
        </div>
      </div>

      {/* ── 3. COMPARISON ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <h3 className="text-lg font-bold text-slate-900">Compare plans</h3>
        <p className="text-sm text-slate-500">Everything each plan includes, side by side.</p>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-white px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Feature
                </th>
                {sortedPlans.map((plan) => {
                  const isCurrent = currentPlanCode === plan.code;
                  return (
                    <th
                      key={plan.code}
                      className={`px-3 py-2.5 text-center text-sm font-bold text-slate-800 ${
                        isCurrent ? "rounded-t-lg bg-emerald-50" : ""
                      }`}
                    >
                      {plan.name}
                      {isCurrent && (
                        <span className="ml-1.5 text-[10px] font-bold uppercase text-emerald-600">
                          current
                        </span>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {Object.entries(groups).map(([group, rows]) => (
                <Fragment key={group}>
                  <tr>
                    <td
                      colSpan={sortedPlans.length + 1}
                      className="bg-slate-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500"
                    >
                      {group}
                    </td>
                  </tr>
                  {rows.map((row) => (
                    <tr key={row.key}>
                      <td className="sticky left-0 border-b border-slate-100 bg-white px-3 py-2.5 font-medium text-slate-700">
                        {row.label}
                      </td>
                      {sortedPlans.map((plan) => {
                        const value = featureValue(plan, row.key);
                        const isCurrent = currentPlanCode === plan.code;
                        return (
                          <td
                            key={`${plan.code}-${row.key}`}
                            className={`border-b border-slate-100 px-3 py-2.5 text-center text-slate-700 ${
                              isCurrent ? "bg-emerald-50/50" : ""
                            }`}
                          >
                            {value === true ? (
                              <Check />
                            ) : value === false ? (
                              <Cross />
                            ) : (
                              <span className="font-medium">{String(value)}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
