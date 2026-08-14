import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  FileSpreadsheet,
  Globe2,
  Lock,
  PackageSearch,
  Settings2,
  Sparkles,
  Store,
  WalletCards,
  X,
} from "lucide-react";
import API from "../../services/api";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const statusClassMap = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  trial: "border-sky-200 bg-sky-50 text-sky-700",
  expired: "border-red-200 bg-red-50 text-red-700",
  blocked_due_to_plan: "border-amber-200 bg-amber-50 text-amber-700",
  cancelled: "border-slate-200 bg-slate-100 text-slate-700",
};

const modules = [
  { icon: BarChart3, title: "Dashboard", description: "Overview, KPIs, trends" },
  { icon: Store, title: "Vendor Management", description: "Orders, bills, settlements" },
  { icon: PackageSearch, title: "Inventory / Stock", description: "Stock and item movement" },
  { icon: WalletCards, title: "Accounts", description: "Finance and statement tools" },
  { icon: Sparkles, title: "Analytics", description: "Sales and performance insights" },
  { icon: FileSpreadsheet, title: "Reports", description: "Exports and advanced reports" },
  { icon: Globe2, title: "Global Access", description: "Become global after plan activation" },
  { icon: Settings2, title: "Settings", description: "Profile, bank and preferences" },
];

const planThemeMap = {
  BASIC_VENDOR: {
    shell:
      "border-emerald-200 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_38%),linear-gradient(180deg,#ffffff_0%,#f6fffb_100%)]",
    stripe: "from-emerald-500 to-teal-500",
    badge: "bg-emerald-100 text-emerald-700",
    button: "bg-emerald-600 hover:bg-emerald-700",
    soft: "bg-emerald-50 text-emerald-700",
    ring: "ring-emerald-200",
  },
  PRO_VENDOR: {
    shell:
      "border-violet-200 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.14),transparent_42%),linear-gradient(180deg,#ffffff_0%,#faf7ff_100%)]",
    stripe: "from-violet-500 to-fuchsia-500",
    badge: "bg-violet-100 text-violet-700",
    button: "bg-violet-600 hover:bg-violet-700",
    soft: "bg-violet-50 text-violet-700",
    ring: "ring-violet-200",
  },
  BUSINESS_VENDOR: {
    shell:
      "border-amber-200 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.16),transparent_40%),linear-gradient(180deg,#ffffff_0%,#fffaf2_100%)]",
    stripe: "from-amber-500 to-orange-500",
    badge: "bg-amber-100 text-amber-700",
    button: "bg-amber-500 hover:bg-amber-600",
    soft: "bg-amber-50 text-amber-700",
    ring: "ring-amber-200",
  },
};

const planMappingRows = [
  {
    page: "Dashboard",
    basic: "Basic counts and overview",
    pro: "Revenue and settlement summary",
    business: "Advanced KPIs and comparisons",
  },
  {
    page: "Vendor Management",
    basic: "Orders and invoice preview",
    pro: "Settlements and payout history",
    business: "Advanced settlement tools",
  },
  {
    page: "Inventory / Stock",
    basic: "Stock management",
    pro: "Stock history and deeper view",
    business: "Planning and advanced stock reports",
  },
  {
    page: "Accounts",
    basic: "Locked",
    pro: "Accounts and outstanding",
    business: "Advanced finance and statement download",
  },
  {
    page: "Analytics",
    basic: "Locked",
    pro: "Analytics dashboard",
    business: "Advanced analytics and comparison",
  },
  {
    page: "Reports",
    basic: "Limited",
    pro: "Standard reports and Excel export",
    business: "Premium reports, filters and bulk export",
  },
];

const getTheme = (planCode) => planThemeMap[planCode] || planThemeMap.BASIC_VENDOR;

function SectionCard({ title, subtitle, children, action = null }) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-900 sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-slate-950 dark:text-white">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-gray-400">
              {subtitle}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function PlanDetailsModal({ plan, onClose }) {
  const theme = getTheme(plan.code);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close plan details"
      />

      <div className="relative z-10 max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_30px_90px_-30px_rgba(15,23,42,0.45)] dark:border-neutral-700 dark:bg-neutral-900">
        <div className={`h-1.5 bg-gradient-to-r ${theme.stripe}`} />

        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 dark:border-neutral-700 sm:px-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                {plan.name}
              </h3>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${theme.badge}`}>
                {plan.badgeLabel}
              </span>
              {plan.isPopular ? (
                <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-slate-950">
                  Most Popular
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              {plan.code}
            </p>
            <p className="mt-3 text-base font-semibold text-slate-700 dark:text-slate-200">
              {plan.tagline}
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
              {plan.description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[calc(90vh-92px)] overflow-y-auto px-5 py-5 sm:px-6">
          <div className="grid gap-5 xl:grid-cols-[0.38fr_0.62fr]">
            <div className={`rounded-[1.75rem] border p-5 ${theme.shell}`}>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Plan Snapshot
              </p>
              <div className="mt-4 grid gap-3">
                <div className="rounded-[1.2rem] border border-white/80 bg-white/85 p-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Monthly Price
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {formatCurrency(plan.monthlyPrice)}
                  </p>
                </div>
                <div className="rounded-[1.2rem] border border-white/80 bg-white/85 p-4 shadow-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    Restaurant Access
                  </p>
                  <p className="mt-2 text-xl font-black text-slate-950">
                    {plan.restaurantLimitLabel}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5">
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-5 dark:border-neutral-700 dark:bg-neutral-800/70">
                  <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-slate-950 dark:text-white">
                    <CheckCircle2 size={16} />
                    Included
                  </h4>
                  <div className="mt-4 space-y-2.5">
                    {plan.includedFeatures.map((feature) => (
                      <p key={feature} className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {feature}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-5 dark:border-neutral-700 dark:bg-neutral-800/70">
                  <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-slate-950 dark:text-white">
                    <Lock size={16} />
                    Locked
                  </h4>
                  <div className="mt-4 space-y-2.5">
                    {(plan.excludedFeatures.length
                      ? plan.excludedFeatures
                      : ["No locked features in this plan level"]).map((feature) => (
                      <p key={feature} className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                        {feature}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-5 dark:border-neutral-700 dark:bg-neutral-800/70 md:col-span-2 xl:col-span-1">
                  <h4 className="flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-slate-950 dark:text-white">
                    <Building2 size={16} />
                    Modules
                  </h4>
                  <div className="mt-4 grid gap-2">
                    {modules.slice(0, 6).map(({ icon: Icon, title }) => (
                      <div
                        key={title}
                        className="flex items-center gap-3 rounded-2xl bg-white px-3 py-3 shadow-sm dark:bg-neutral-900"
                      >
                        <div className="rounded-xl bg-slate-100 p-2 text-slate-700 dark:bg-neutral-800 dark:text-white">
                          <Icon size={14} />
                        </div>
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                          {title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50/70 p-5 dark:border-neutral-700 dark:bg-neutral-800/70">
                <h4 className="text-sm font-black uppercase tracking-[0.18em] text-slate-950 dark:text-white">
                  Page Access Mapping
                </h4>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full rounded-[1.25rem] border border-slate-200 bg-white dark:border-neutral-700 dark:bg-neutral-900">
                    <thead className="bg-slate-50 dark:bg-neutral-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                          Module
                        </th>
                        <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                          Basic
                        </th>
                        <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                          Pro
                        </th>
                        <th className="px-4 py-3 text-left text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                          Business
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {planMappingRows.map((row) => (
                        <tr key={row.page} className="border-t border-slate-200 dark:border-neutral-700">
                          <td className="px-4 py-3 text-sm font-bold text-slate-950 dark:text-white">
                            {row.page}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                            {row.basic}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                            {row.pro}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                            {row.business}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VendorSubscriptionOverview({ onSubscriptionChange }) {
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [status, setStatus] = useState("blocked_due_to_plan");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [activatingPlanCode, setActivatingPlanCode] = useState("");
  const [detailPlanCode, setDetailPlanCode] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await API.get("/vendor-subscriptions/me");
      const nextSubscription = res.data?.subscription || null;
      const nextPlans = Array.isArray(res.data?.plans) ? res.data.plans : [];
      setSubscription(nextSubscription);
      setPlans(nextPlans);
      setStatus(res.data?.status || "blocked_due_to_plan");
      onSubscriptionChange?.(nextSubscription);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load vendor subscription");
      onSubscriptionChange?.(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    [plans]
  );

  const currentPlanCode = subscription?.planCode || "";
  const scheduledPlanCode = subscription?.scheduledPlanCode || "";
  const hasRunningPlan = ["active", "trial"].includes(String(status || "").toLowerCase());
  const statusClass =
    statusClassMap[String(status || "").toLowerCase()] || statusClassMap.blocked_due_to_plan;
  const detailPlan =
    sortedPlans.find((plan) => plan.code === detailPlanCode) ||
    (detailPlanCode && subscription?.planCode === detailPlanCode ? subscription?.plan : null) ||
    null;

  const vendorUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null") || {};
    } catch {
      return {};
    }
  })();
  const isLocalVendor = String(vendorUser?.vendorType || "").toLowerCase() === "local";

  const syncVendorType = (nextVendor) => {
    if (!nextVendor?.vendorType) return;

    try {
      const currentUser = JSON.parse(localStorage.getItem("user") || "null") || {};
      localStorage.setItem(
        "user",
        JSON.stringify({
          ...currentUser,
          vendorType: nextVendor.vendorType,
          vendorId: nextVendor.vendorId || currentUser.vendorId,
        })
      );
    } catch {
      // ignore local storage sync errors
    }
  };

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

  const handleActivate = async (planCode) => {
    let checkoutOpened = false;

    try {
      setActivatingPlanCode(planCode);
      setError("");
      setMessage("");
      await loadRazorpayScript();

      const orderRes = await API.post("/vendor-subscriptions/me/order", { planCode });

      if (orderRes.data?.freeActivation) {
        setMessage(orderRes.data?.message || "Plan updated successfully");
        syncVendorType(orderRes.data?.vendor);
        await loadData();
        return;
      }

      const order = orderRes.data?.order;
      const keyId = orderRes.data?.keyId;
      const plan = orderRes.data?.plan;

      if (!order?.id || !keyId) {
        throw new Error("Vendor checkout configuration is incomplete");
      }

      const razorpay = new window.Razorpay({
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        name: "EFNBMMS Vendor Subscription",
        description: `${plan?.name || "Vendor"} plan payment`,
        order_id: order.id,
        theme: { color: plan?.isPopular ? "#7c3aed" : "#059669" },
        handler: async (response) => {
          try {
            const verifyRes = await API.post("/vendor-subscriptions/me/verify", response);
            setMessage(verifyRes.data?.message || "Vendor subscription updated successfully");
            syncVendorType(verifyRes.data?.vendor);
            await loadData();
          } catch (verifyErr) {
            setError(
              verifyErr?.response?.data?.message ||
              "Payment succeeded but vendor verification failed."
            );
          } finally {
            setActivatingPlanCode("");
          }
        },
        modal: {
          ondismiss: () => setActivatingPlanCode(""),
        },
      });

      checkoutOpened = true;
      razorpay.open();
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Failed to start vendor subscription payment"
      );
    } finally {
      if (!checkoutOpened) {
        setActivatingPlanCode("");
      }
    }
  };

  if (loading) {
    return (
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
        Loading vendor subscription...
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      ) : null}
      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {message}
        </div>
      ) : null}

      <SectionCard
        title="Your subscription"
        subtitle={
          hasRunningPlan
            ? "Your current plan keeps running until its end date. If you choose another plan now, it will start automatically after the current one finishes."
            : "Choose a vendor plan to start access. Once active, the system unlocks modules based on the subscribed plan."
        }
        action={
          <div className="flex flex-wrap gap-3">
            <span className={`inline-flex rounded-full border px-4 py-2 text-sm font-semibold ${statusClass}`}>
              {String(status || "blocked_due_to_plan").replaceAll("_", " ")}
            </span>
            {isLocalVendor ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700">
                Subscription can upgrade local vendor to global
                <ArrowRight size={15} />
              </span>
            ) : null}
          </div>
        }
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50/70 p-5 dark:border-neutral-700 dark:bg-neutral-800/70">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Current Plan
            </p>
            <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              {subscription?.plan?.name || "No active plan"}
            </h3>
            <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              {subscription?.plan?.tagline || "Select a plan to unlock vendor modules."}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.2rem] border border-white/80 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Active Till
                </p>
                <p className="mt-2 text-lg font-black text-slate-950 dark:text-white">
                  {formatDate(subscription?.expiryDate)}
                </p>
              </div>
              <div className="rounded-[1.2rem] border border-white/80 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Access Level
                </p>
                <p className="mt-2 text-lg font-black text-slate-950 dark:text-white">
                  {subscription?.plan?.badgeLabel || "-"}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50/70 p-5 dark:border-neutral-700 dark:bg-neutral-800/70">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Next Scheduled Plan
            </p>
            <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
              {subscription?.scheduledPlan?.name || "No scheduled change"}
            </h3>
            <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              {subscription?.scheduledPlan
                ? "This plan will start automatically after the current plan finishes."
                : "Choose another plan any time. If a plan is already running, the next one will wait in schedule."}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.2rem] border border-white/80 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Starts On
                </p>
                <p className="mt-2 text-lg font-black text-slate-950 dark:text-white">
                  {formatDate(subscription?.scheduledChangeAt)}
                </p>
              </div>
              <div className="rounded-[1.2rem] border border-white/80 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-900">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Next Price
                </p>
                <p className="mt-2 text-lg font-black text-slate-950 dark:text-white">
                  {subscription?.scheduledPlan
                    ? formatCurrency(
                        subscription?.scheduledAmountPaid || subscription?.scheduledPlan?.monthlyPrice
                      )
                    : "-"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Choose your next plan"
        subtitle={
          isLocalVendor
            ? "Pick the subscription plan you want. If no plan is running, activation starts now. If a plan is already active, the new one waits and starts after the current cycle ends."
            : "This works like a normal subscription system: current plan stays active until the period ends, and any new plan you choose becomes the next scheduled plan."
        }
      >
        <div className="grid gap-5 xl:grid-cols-3">
          {sortedPlans.map((plan) => {
            const theme = getTheme(plan.code);
            const isCurrent = currentPlanCode === plan.code;
            const isScheduled = scheduledPlanCode === plan.code;
            const canSchedule = hasRunningPlan && !isCurrent && !isScheduled;

            return (
              <article
                key={plan.code}
                className={`relative overflow-hidden rounded-[2rem] border p-5 shadow-sm transition duration-200 ${theme.shell} ${
                  isCurrent || isScheduled ? `ring-2 ${theme.ring}` : ""
                }`}
              >
                <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${theme.stripe}`} />

                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-2xl font-black tracking-tight text-slate-950">
                        {plan.name}
                      </h3>
                      {plan.isPopular ? (
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${theme.badge}`}>
                          Most Popular
                        </span>
                      ) : null}
                      {isCurrent ? (
                        <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                          Active Now
                        </span>
                      ) : null}
                      {isScheduled ? (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          Next Plan
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      {plan.code}
                    </p>
                    <p className="mt-3 text-base font-semibold text-slate-700">{plan.tagline}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Monthly Price
                  </p>
                  <p className="mt-2 text-5xl font-black leading-none tracking-tight text-slate-950">
                    {formatCurrency(plan.monthlyPrice)}
                  </p>
                  <p className="mt-2 text-sm font-medium text-slate-500">{plan.priceDisplay}</p>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-[1.4rem] border border-white/80 bg-white/85 p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Access Layer
                    </p>
                    <p className="mt-2 text-lg font-black text-slate-950">{plan.badgeLabel}</p>
                  </div>
                  <div className="rounded-[1.4rem] border border-white/80 bg-white/85 p-4 shadow-sm">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Restaurant Coverage
                    </p>
                    <p className="mt-2 text-lg font-black text-slate-950">
                      {plan.restaurantLimitLabel}
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {plan.featureSummary.slice(0, 3).map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <div className={`mt-0.5 rounded-full p-1 ${theme.soft}`}>
                        <CheckCircle2 size={13} />
                      </div>
                      <p className="text-sm leading-6 text-slate-600">{feature}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={() => handleActivate(plan.code)}
                    disabled={Boolean(activatingPlanCode) || isCurrent || isScheduled}
                    className={`rounded-full px-5 py-3 text-sm font-semibold text-white transition ${theme.button} disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {activatingPlanCode === plan.code
                      ? "Processing..."
                      : isCurrent
                        ? "Current Plan"
                        : isScheduled
                          ? "Already Scheduled"
                          : canSchedule
                            ? "Start After Current Plan"
                            : isLocalVendor
                              ? "Activate Now And Become Global"
                              : "Activate Now"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailPlanCode(plan.code)}
                    className="rounded-full border border-slate-200 bg-white/90 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
                  >
                    View Plan Details
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-[0.56fr_0.44fr]">
        <SectionCard
          title="What gets locked and why"
          subtitle="These are the common actions that trigger a subscription prompt when the current plan does not allow access."
        >
          <div className="grid gap-3">
            {[
              "Analytics opens from Pro and Business plans only.",
              "Reports and Excel export are not available in the entry plan.",
              "Settlement tracking and outstanding monitoring start from Pro.",
              "More restaurant connections need a higher plan.",
              "Statement download and premium filters belong to the Business plan.",
            ].map((line) => (
              <div
                key={line}
                className="rounded-[1.4rem] border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600 dark:border-neutral-700 dark:bg-neutral-800 dark:text-slate-300"
              >
                {line}
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Subscription state logic"
          subtitle="The dashboard first checks subscription status, then unlocks modules according to the active vendor plan."
        >
          <div className="grid gap-3">
            {[
              {
                key: "active",
                title: "Active",
                detail: "Current plan is live and all allowed modules stay open.",
              },
              {
                key: "trial",
                title: "Trial",
                detail: "Temporary access until the current trial period ends.",
              },
              {
                key: "expired",
                title: "Expired",
                detail: "Login still works, but plan-based modules should renew.",
              },
              {
                key: "blocked_due_to_plan",
                title: "Blocked Due To Plan",
                detail: "Page can open, but the main actions stay locked.",
              },
            ].map((item) => {
              const badgeClass = statusClassMap[item.key] || statusClassMap.blocked_due_to_plan;
              const isCurrent = item.key === status;

              return (
                <div
                  key={item.key}
                  className={`rounded-[1.4rem] border px-4 py-4 ${badgeClass} ${isCurrent ? "ring-2 ring-slate-200 ring-offset-2" : ""}`}
                >
                  <p className="text-sm font-black uppercase tracking-[0.18em]">{item.title}</p>
                  <p className="mt-2 text-sm leading-6">{item.detail}</p>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      {detailPlan ? <PlanDetailsModal plan={detailPlan} onClose={() => setDetailPlanCode("")} /> : null}
    </section>
  );
}
