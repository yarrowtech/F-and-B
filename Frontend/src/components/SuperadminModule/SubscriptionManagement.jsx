import { useEffect, useMemo, useState } from "react";
import {
  BadgeIndianRupee,
  Crown,
  Layers3,
  PencilLine,
  Plus,
  ShieldCheck,
  Sparkles,
  Store,
  Users,
} from "lucide-react";
import API from "../../services/api";

const emptyForm = {
  code: "",
  name: "",
  description: "",
  monthlyPrice: "",
  yearlyPrice: "",
  monthlyOfferEnabled: false,
  monthlyOfferLabel: "",
  monthlyOfferDiscountedPrice: "",
  monthlyOfferDiscountPercent: "0",
  monthlyOfferDurationMonths: "1",
  yearlyOfferEnabled: false,
  yearlyOfferLabel: "",
  yearlyOfferDiscountedPrice: "",
  yearlyOfferDiscountPercent: "0",
  yearlyOfferDurationMonths: "12",
  maxRestaurants: "",
  maxStaff: "",
  extraRestaurantMonthlyPrice: "0",
  trialDays: "7",
  displayFeatures: "",
  isPopular: false,
  isActive: true,
  sortOrder: "0",
};

const emptyVendorForm = {
  code: "",
  name: "",
  tagline: "",
  description: "",
  tier: "basic",
  monthlyPrice: "",
  badgeLabel: "",
  restaurantLimit: "",
  restaurantLimitLabel: "",
  featureSummary: "",
  includedFeatures: "",
  excludedFeatures: "",
  lockedTriggers: "",
  pageAccess: "",
  isPopular: false,
  isActive: true,
  sortOrder: "0",
};

const statCards = [
  {
    key: "plans",
    label: "Plans",
    icon: Layers3,
    accent: "from-sky-500/15 to-cyan-500/10 text-sky-700",
  },
  {
    key: "admins",
    label: "Admins",
    icon: Users,
    accent: "from-emerald-500/15 to-lime-500/10 text-emerald-700",
  },
  {
    key: "activeSubs",
    label: "Active Subs",
    icon: ShieldCheck,
    accent: "from-violet-500/15 to-fuchsia-500/10 text-violet-700",
  },
];

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100";

const labelClass = "space-y-2 text-sm font-medium text-slate-700";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const roundPrice = (value) => {
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return "";
  }
  return String(Math.max(0, Math.round(numericValue)));
};

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

const getMonthlyOffer = (plan) => {
  const offer = plan?.offers?.monthly || {};
  const preview = calculateOffer(plan?.monthlyPrice, offer.discountedPrice);

  return {
    ...offer,
    enabled: Boolean(offer.enabled) && preview.discountPercent > 0,
    ...preview,
  };
};

const getYearlyOffer = (plan) => {
  const offer = plan?.offers?.yearly || {};
  const preview = calculateOffer(plan?.yearlyPrice, offer.discountedPrice);

  return {
    ...offer,
    enabled: Boolean(offer.enabled) && preview.discountPercent > 0,
    ...preview,
  };
};

const buildOfferPayload = ({
  enabled,
  label,
  discountedPrice,
  durationMonths,
  basePrice,
}) => {
  const preview = calculateOffer(basePrice, discountedPrice);

  return {
    enabled: Boolean(enabled) && preview.discountPercent > 0,
    label: String(label || "").trim(),
    discountedPrice: Number(discountedPrice || 0),
    discountPercent: preview.discountPercent,
    durationMonths: Math.max(1, Number(durationMonths || 1)),
  };
};

const mapPlanToForm = (plan) => ({
  code: plan.code || "",
  name: plan.name || "",
  description: plan.description || "",
  monthlyPrice: String(plan.monthlyPrice ?? ""),
  yearlyPrice: String(plan.yearlyPrice ?? ""),
  monthlyOfferEnabled: Boolean(plan.offers?.monthly?.enabled),
  monthlyOfferLabel: plan.offers?.monthly?.label || "",
  monthlyOfferDiscountedPrice: String(plan.offers?.monthly?.discountedPrice ?? ""),
  monthlyOfferDiscountPercent: String(plan.offers?.monthly?.discountPercent ?? 0),
  monthlyOfferDurationMonths: String(plan.offers?.monthly?.durationMonths ?? 1),
  yearlyOfferEnabled: Boolean(plan.offers?.yearly?.enabled),
  yearlyOfferLabel: plan.offers?.yearly?.label || "",
  yearlyOfferDiscountedPrice: String(plan.offers?.yearly?.discountedPrice ?? ""),
  yearlyOfferDiscountPercent: String(plan.offers?.yearly?.discountPercent ?? 0),
  yearlyOfferDurationMonths: String(plan.offers?.yearly?.durationMonths ?? 12),
  maxRestaurants: String(plan.maxRestaurants ?? ""),
  maxStaff: String(plan.maxStaff ?? ""),
  extraRestaurantMonthlyPrice: String(plan.extraRestaurantMonthlyPrice ?? 0),
  trialDays: String(plan.trialDays ?? 7),
  displayFeatures: Array.isArray(plan.displayFeatures)
    ? plan.displayFeatures.join("\n")
    : "",
  isPopular: Boolean(plan.isPopular),
  isActive: Boolean(plan.isActive),
  sortOrder: String(plan.sortOrder ?? 0),
});

const mapVendorPlanToForm = (plan) => ({
  code: plan.code || "",
  name: plan.name || "",
  tagline: plan.tagline || "",
  description: plan.description || "",
  tier: plan.tier || "basic",
  monthlyPrice: String(plan.monthlyPrice ?? ""),
  badgeLabel: plan.badgeLabel || "",
  restaurantLimit: String(plan.restaurantLimit ?? ""),
  restaurantLimitLabel: plan.restaurantLimitLabel || "",
  featureSummary: Array.isArray(plan.featureSummary) ? plan.featureSummary.join("\n") : "",
  includedFeatures: Array.isArray(plan.includedFeatures) ? plan.includedFeatures.join("\n") : "",
  excludedFeatures: Array.isArray(plan.excludedFeatures) ? plan.excludedFeatures.join("\n") : "",
  lockedTriggers: Array.isArray(plan.lockedTriggers) ? plan.lockedTriggers.join("\n") : "",
  pageAccess: Array.isArray(plan.pageAccess) ? plan.pageAccess.join("\n") : "",
  isPopular: Boolean(plan.isPopular),
  isActive: Boolean(plan.isActive),
  sortOrder: String(plan.sortOrder ?? 0),
});

const SectionTitle = ({ eyebrow, title, description }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-500">
      {eyebrow}
    </p>
    <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
      {title}
    </h2>
    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
      {description}
    </p>
  </div>
);

const PlanCard = ({ plan, onEdit }) => {
  const monthlyOffer = getMonthlyOffer(plan);
  const yearlyOffer = getYearlyOffer(plan);
  const featurePreview =
    Array.isArray(plan.displayFeatures) && plan.displayFeatures.length > 0
      ? plan.displayFeatures.slice(0, 4)
      : [];

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-[1.2rem] border border-slate-200 bg-[linear-gradient(145deg,#ffffff_0%,#f8fafc_100%)] p-4 shadow-[0_14px_34px_-28px_rgba(15,23,42,0.18)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_-30px_rgba(76,29,149,0.2)]">
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-gradient-to-br from-violet-200/30 to-transparent blur-2xl" />

      <div className="relative flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[1.75rem] font-black tracking-tight text-slate-950">
              {plan.name}
            </h3>
            {plan.isPopular && (
              <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-semibold text-violet-700">
                Most Popular
              </span>
            )}
            {monthlyOffer.enabled && (
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                {monthlyOffer.label || `${monthlyOffer.discountPercent}% OFF first month`}
              </span>
            )}
            {yearlyOffer.enabled && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                {yearlyOffer.label || `${yearlyOffer.discountPercent}% OFF yearly`}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
            {plan.code}
          </p>
          <p className="mt-2.5 max-w-2xl text-sm leading-6 text-slate-600">
            {plan.description}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onEdit(plan)}
          className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white/90 px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:border-violet-300 hover:text-violet-700"
        >
          <PencilLine size={15} />
          Edit Plan
        </button>
      </div>

      <div className="relative mt-4 grid grid-cols-2 gap-2.5 xl:grid-cols-3">
        <div className="rounded-[1rem] border border-white/80 bg-white/90 p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Monthly
          </p>
          {monthlyOffer.enabled && (
            <p className="mt-1.5 text-sm font-semibold text-slate-400 line-through">
              {formatCurrency(plan.monthlyPrice)}
            </p>
          )}
          <p className="mt-1 text-[1.9rem] font-black leading-none text-slate-950">
            {formatCurrency(
              monthlyOffer.enabled ? monthlyOffer.discountedPrice : plan.monthlyPrice
            )}
          </p>
          <p className="mt-1.5 text-xs font-medium leading-5 text-amber-600">
            {monthlyOffer.enabled
              ? `${monthlyOffer.discountPercent}% OFF for ${monthlyOffer.durationMonths} month`
              : "Regular monthly billing"}
          </p>
        </div>

        <div className="rounded-[1rem] border border-white/80 bg-white/90 p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Yearly
          </p>
          {yearlyOffer.enabled && (
            <p className="mt-1.5 text-sm font-semibold text-slate-400 line-through">
              {formatCurrency(plan.yearlyPrice)}
            </p>
          )}
          <p className="mt-1 text-[1.9rem] font-black leading-none text-slate-950">
            {formatCurrency(
              yearlyOffer.enabled ? yearlyOffer.discountedPrice : plan.yearlyPrice
            )}
          </p>
          <p className="mt-1.5 text-xs font-medium leading-5 text-emerald-600">
            {yearlyOffer.enabled
              ? `${yearlyOffer.discountPercent}% OFF yearly • Save ${formatCurrency(
                  yearlyOffer.savingsAmount
                )}`
              : "Regular yearly billing"}
          </p>
        </div>

        <div className="rounded-[1rem] border border-white/80 bg-white/90 p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Restaurants
          </p>
          <p className="mt-2 text-[1.9rem] font-black leading-none text-slate-950">
            {plan.maxRestaurants}
          </p>
        </div>

        <div className="rounded-[1rem] border border-white/80 bg-white/90 p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Staff
          </p>
          <p className="mt-2 text-[1.9rem] font-black leading-none text-slate-950">
            {plan.maxStaff >= 9999 ? "Unlimited" : plan.maxStaff}
          </p>
        </div>

        <div className="rounded-[1rem] border border-white/80 bg-white/90 p-3.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            Trial
          </p>
          <p className="mt-2 text-[1.9rem] font-black leading-none text-slate-950">
            {plan.trialDays}d
          </p>
        </div>
      </div>

      <div className="relative mt-4 rounded-[1rem] border border-slate-200/80 bg-white/80 p-3.5">
        <p className="text-sm font-semibold text-slate-800">Feature Preview</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {featurePreview.length > 0 ? (
            featurePreview.map((feature) => (
              <span
                key={feature}
                className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600"
              >
                {feature}
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-500">No feature summary added</span>
          )}
        </div>
      </div>
    </article>
  );
};

const VendorPlanCard = ({ plan, onEdit }) => (
  <article className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(145deg,#ffffff_0%,#f8fafc_100%)] p-6 shadow-[0_18px_50px_-28px_rgba(15,23,42,0.25)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_60px_-30px_rgba(8,145,178,0.25)]">
    <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-gradient-to-br from-emerald-200/35 to-transparent blur-2xl" />

    <div className="relative flex items-start justify-between gap-4">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-3xl font-black tracking-tight text-slate-950">{plan.name}</h3>
          {plan.isPopular && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              Popular
            </span>
          )}
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
            {plan.tier}
          </span>
        </div>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
          {plan.code}
        </p>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">{plan.description}</p>
      </div>

      <button
        type="button"
        onClick={() => onEdit(plan)}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700"
      >
        <PencilLine size={16} />
        Edit Plan
      </button>
    </div>

    <div className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-2xl border border-white/80 bg-white/90 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Monthly</p>
        <p className="mt-2 text-2xl font-black text-slate-950">{formatCurrency(plan.monthlyPrice)}</p>
      </div>
      <div className="rounded-2xl border border-white/80 bg-white/90 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Restaurants</p>
        <p className="mt-2 text-2xl font-black text-slate-950">{plan.restaurantLimitLabel}</p>
      </div>
      <div className="rounded-2xl border border-white/80 bg-white/90 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Access</p>
        <p className="mt-2 text-2xl font-black text-slate-950">{plan.badgeLabel}</p>
      </div>
      <div className="rounded-2xl border border-white/80 bg-white/90 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">Features</p>
        <p className="mt-2 text-2xl font-black text-slate-950">{plan.featureSummary?.length || 0}</p>
      </div>
    </div>

    <div className="relative mt-5 rounded-2xl border border-slate-200/80 bg-white/80 p-4">
      <p className="text-sm font-semibold text-slate-800">Feature Preview</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {(plan.featureSummary || []).slice(0, 4).map((feature) => (
          <span
            key={feature}
            className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600"
          >
            {feature}
          </span>
        ))}
      </div>
    </div>
  </article>
);

const SubscriptionManagement = () => {
  const [plans, setPlans] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [vendorPlans, setVendorPlans] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [activeTab, setActiveTab] = useState("admin");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vendorSaving, setVendorSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedPlanCode, setSelectedPlanCode] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selectedVendorPlanCode, setSelectedVendorPlanCode] = useState("");
  const [vendorFormOpen, setVendorFormOpen] = useState(false);
  const [vendorForm, setVendorForm] = useState(emptyVendorForm);
  const [assigningAdminId, setAssigningAdminId] = useState("");
  const [assigningVendorId, setAssigningVendorId] = useState("");
  const [selectedPlanByAdmin, setSelectedPlanByAdmin] = useState({});
  const [selectedCycleByAdmin, setSelectedCycleByAdmin] = useState({});
  const [selectedPlanByVendor, setSelectedPlanByVendor] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, adminsRes, vendorRes] = await Promise.all([
        API.get("/subscriptions/plans"),
        API.get("/subscriptions/super-admin/admins"),
        API.get("/vendor-subscriptions/super-admin/vendors"),
      ]);
      setPlans(plansRes.data?.plans || []);
      setAdmins(adminsRes.data?.admins || []);
      setVendorPlans(vendorRes.data?.plans || []);
      setVendors(vendorRes.data?.vendors || []);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load subscription data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const sortedPlans = useMemo(
    () => [...plans].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    [plans]
  );
  const sortedVendorPlans = useMemo(
    () => [...vendorPlans].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    [vendorPlans]
  );

  const monthlyOfferPreview = useMemo(
    () => calculateOffer(form.monthlyPrice, form.monthlyOfferDiscountedPrice),
    [form.monthlyPrice, form.monthlyOfferDiscountedPrice]
  );

  const yearlyOfferPreview = useMemo(
    () => calculateOffer(form.yearlyPrice, form.yearlyOfferDiscountedPrice),
    [form.yearlyPrice, form.yearlyOfferDiscountedPrice]
  );

  const stats = {
    plans: plans.length,
    admins: admins.length,
    activeSubs: admins.filter((admin) => admin.subscription?.status === "active").length,
  };
  const vendorStats = {
    plans: vendorPlans.length,
    vendors: vendors.length,
    activeSubs: vendors.filter((vendor) => vendor.subscription?.status === "active").length,
  };

  const resetForm = () => {
    setSelectedPlanCode("");
    setForm(emptyForm);
    setFormOpen(false);
  };
  const resetVendorForm = () => {
    setSelectedVendorPlanCode("");
    setVendorForm(emptyVendorForm);
    setVendorFormOpen(false);
  };

  const startEdit = (plan) => {
    setSelectedPlanCode(plan.code);
    setForm(mapPlanToForm(plan));
    setFormOpen(true);
    setSuccess("");
    setError("");
  };

  const startCreate = () => {
    setSelectedPlanCode("");
    setForm(emptyForm);
    setFormOpen(true);
    setSuccess("");
    setError("");
  };
  const startVendorEdit = (plan) => {
    setSelectedVendorPlanCode(plan.code);
    setVendorForm(mapVendorPlanToForm(plan));
    setVendorFormOpen(true);
    setSuccess("");
    setError("");
  };
  const startVendorCreate = () => {
    setSelectedVendorPlanCode("");
    setVendorForm(emptyVendorForm);
    setVendorFormOpen(true);
    setSuccess("");
    setError("");
  };

  const handleFormChange = (key, value) => {
    setForm((current) => {
      const next = {
        ...current,
        [key]: value,
      };

      if (key === "monthlyPrice" || key === "monthlyOfferDiscountPercent") {
        const monthly = Number(key === "monthlyPrice" ? value : next.monthlyPrice);
        const discount = Number(
          key === "monthlyOfferDiscountPercent"
            ? value
            : next.monthlyOfferDiscountPercent
        );
        if (!Number.isNaN(monthly) && monthly > 0 && !Number.isNaN(discount)) {
          next.monthlyOfferDiscountedPrice = roundPrice(
            monthly * (1 - discount / 100)
          );
        }
      }

      if (key === "monthlyOfferDiscountedPrice") {
        next.monthlyOfferDiscountPercent = String(
          calculateOffer(next.monthlyPrice, value).discountPercent
        );
      }

      if (key === "yearlyPrice" || key === "yearlyOfferDiscountPercent") {
        const yearly = Number(key === "yearlyPrice" ? value : next.yearlyPrice);
        const discount = Number(
          key === "yearlyOfferDiscountPercent"
            ? value
            : next.yearlyOfferDiscountPercent
        );
        if (!Number.isNaN(yearly) && yearly > 0 && !Number.isNaN(discount)) {
          next.yearlyOfferDiscountedPrice = roundPrice(
            yearly * (1 - discount / 100)
          );
        }
      }

      if (key === "yearlyOfferDiscountedPrice") {
        next.yearlyOfferDiscountPercent = String(
          calculateOffer(next.yearlyPrice, value).discountPercent
        );
      }

      return next;
    });
  };

  const handleSavePlan = async (event) => {
    event.preventDefault();
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        code: form.code,
        name: form.name,
        description: form.description,
        monthlyPrice: Number(form.monthlyPrice),
        yearlyPrice: Number(form.yearlyPrice),
        yearlyDiscountPercent: yearlyOfferPreview.discountPercent,
        maxRestaurants: Number(form.maxRestaurants),
        maxStaff: Number(form.maxStaff),
        extraRestaurantMonthlyPrice: Number(form.extraRestaurantMonthlyPrice),
        trialDays: Number(form.trialDays),
        sortOrder: Number(form.sortOrder),
        displayFeatures: form.displayFeatures
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean),
        isPopular: Boolean(form.isPopular),
        isActive: Boolean(form.isActive),
        offers: {
          monthly: buildOfferPayload({
            enabled: form.monthlyOfferEnabled,
            label: form.monthlyOfferLabel,
            discountedPrice: form.monthlyOfferDiscountedPrice,
            durationMonths: form.monthlyOfferDurationMonths,
            basePrice: form.monthlyPrice,
          }),
          yearly: buildOfferPayload({
            enabled: form.yearlyOfferEnabled,
            label: form.yearlyOfferLabel,
            discountedPrice: form.yearlyOfferDiscountedPrice,
            durationMonths: form.yearlyOfferDurationMonths,
            basePrice: form.yearlyPrice,
          }),
        },
      };

      if (selectedPlanCode) {
        await API.put(`/subscriptions/super-admin/plans/${selectedPlanCode}`, payload);
        setSuccess("Subscription plan updated successfully");
      } else {
        await API.post("/subscriptions/super-admin/plans", payload);
        setSuccess("Subscription plan created successfully");
      }

      resetForm();
      await fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save plan");
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async (adminId) => {
    const planCode = selectedPlanByAdmin[adminId];
    const billingCycle = selectedCycleByAdmin[adminId] || "monthly";
    if (!planCode) return;

    try {
      setAssigningAdminId(adminId);
      setError("");
      setSuccess("");
      await API.patch(`/subscriptions/super-admin/admins/${adminId}/assign`, {
        planCode,
        billingCycle,
      });
      setSuccess("Subscription assigned successfully");
      await fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to assign plan");
    } finally {
      setAssigningAdminId("");
    }
  };

  const handleSaveVendorPlan = async (event) => {
    event.preventDefault();
    try {
      setVendorSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        code: vendorForm.code,
        name: vendorForm.name,
        tagline: vendorForm.tagline,
        description: vendorForm.description,
        tier: vendorForm.tier,
        monthlyPrice: Number(vendorForm.monthlyPrice),
        badgeLabel: vendorForm.badgeLabel,
        restaurantLimit: Number(vendorForm.restaurantLimit),
        restaurantLimitLabel: vendorForm.restaurantLimitLabel,
        featureSummary: vendorForm.featureSummary.split("\n").map((item) => item.trim()).filter(Boolean),
        includedFeatures: vendorForm.includedFeatures.split("\n").map((item) => item.trim()).filter(Boolean),
        excludedFeatures: vendorForm.excludedFeatures.split("\n").map((item) => item.trim()).filter(Boolean),
        lockedTriggers: vendorForm.lockedTriggers.split("\n").map((item) => item.trim()).filter(Boolean),
        pageAccess: vendorForm.pageAccess.split("\n").map((item) => item.trim()).filter(Boolean),
        isPopular: Boolean(vendorForm.isPopular),
        isActive: Boolean(vendorForm.isActive),
        sortOrder: Number(vendorForm.sortOrder || 0),
      };

      if (selectedVendorPlanCode) {
        await API.put(`/vendor-subscriptions/super-admin/plans/${selectedVendorPlanCode}`, payload);
        setSuccess("Vendor subscription plan updated successfully");
      } else {
        await API.post("/vendor-subscriptions/super-admin/plans", payload);
        setSuccess("Vendor subscription plan created successfully");
      }

      resetVendorForm();
      await fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save vendor plan");
    } finally {
      setVendorSaving(false);
    }
  };

  const handleAssignVendor = async (vendorId) => {
    const planCode = selectedPlanByVendor[vendorId];
    if (!planCode) return;

    try {
      setAssigningVendorId(vendorId);
      setError("");
      setSuccess("");
      await API.patch(`/vendor-subscriptions/super-admin/vendors/${vendorId}/assign`, {
        planCode,
      });
      setSuccess("Vendor subscription assigned successfully");
      await fetchData();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to assign vendor plan");
    } finally {
      setAssigningVendorId("");
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {success}
        </div>
      )}

      <section className="rounded-[1.5rem] border border-slate-200 bg-white/90 p-2.5 shadow-[0_12px_34px_-26px_rgba(15,23,42,0.22)]">
        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setActiveTab("admin")}
            className={`rounded-[1.15rem] border px-4 py-3 text-left transition ${
              activeTab === "admin"
                ? "border-violet-200 bg-[linear-gradient(135deg,rgba(245,243,255,0.95),rgba(255,255,255,0.95))] text-violet-700"
                : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-base font-black tracking-tight">Admin</span>
              <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]">
                {activeTab === "admin" ? "Active" : "Open"}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6">
              Plans, offers, and assignments.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("vendor")}
            className={`rounded-[1.15rem] border px-4 py-3 text-left transition ${
              activeTab === "vendor"
                ? "border-emerald-200 bg-[linear-gradient(135deg,rgba(236,253,245,0.95),rgba(255,255,255,0.95))] text-emerald-700"
                : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-base font-black tracking-tight">Vendor</span>
              <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]">
                {activeTab === "vendor" ? "Active" : "Open"}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6">
              Vendor plans and subscriptions.
            </p>
          </button>
        </div>
      </section>

      {activeTab === "admin" && (
        <>
      <section className="overflow-hidden rounded-[1.65rem] border border-violet-100 bg-[radial-gradient(circle_at_top_left,_rgba(167,139,250,0.18),_transparent_24%),linear-gradient(135deg,#ffffff_0%,#f8f7ff_56%,#fffaf4_100%)] shadow-[0_16px_42px_-30px_rgba(76,29,149,0.28)]">
        <div className="flex flex-col gap-5 px-5 py-5 xl:flex-row xl:items-end xl:justify-between">
          <SectionTitle
            eyebrow="Admin Subscription"
            title="Plans and access"
            description="Manage pricing, offers, and admin subscriptions."
          />

          <div className="flex w-full flex-col gap-3 xl:w-auto xl:items-end">
            <button
              type="button"
              onClick={startCreate}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_-18px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:bg-violet-700"
            >
              <Plus size={16} />
              New Plan
            </button>

            <div className="grid gap-2 sm:grid-cols-3">
              {statCards.map(({ key, label, icon: Icon, accent }) => (
                <div
                  key={key}
                  className={`rounded-[1.1rem] border border-white/70 bg-gradient-to-br ${accent} bg-white/85 px-3 py-3 shadow-sm backdrop-blur`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                      {label}
                    </p>
                    <Icon size={16} />
                  </div>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    {stats[key]}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="rounded-[1.45rem] border border-slate-200 bg-white p-4 shadow-[0_12px_30px_-28px_rgba(15,23,42,0.18)]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-[1.8rem] font-black tracking-tight text-slate-950">
                Available plans
              </h3>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">
                Review actual price, offer price, and capacity details.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-[11px] font-medium text-violet-700">
              <Sparkles size={14} />
              Offer pricing
            </div>
          </div>

          {loading ? (
            <p className="mt-6 text-sm text-slate-500">Loading plans...</p>
          ) : (
            <div className="mt-5 grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
              {sortedPlans.map((plan) => (
                <PlanCard key={plan.code} plan={plan} onEdit={startEdit} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_50px_-34px_rgba(15,23,42,0.25)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-500">
            Admin Allocation
          </p>
          <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            Admin Subscriptions
          </h3>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-[1180px] w-full border-separate border-spacing-y-3 text-left text-sm">
            <thead>
              <tr className="text-slate-400">
                <th className="px-4 py-2 font-semibold uppercase tracking-[0.2em]">Admin</th>
                <th className="px-4 py-2 font-semibold uppercase tracking-[0.2em]">Created By</th>
                <th className="px-4 py-2 font-semibold uppercase tracking-[0.2em]">Current Plan</th>
                <th className="px-4 py-2 font-semibold uppercase tracking-[0.2em]">Status</th>
                <th className="px-4 py-2 font-semibold uppercase tracking-[0.2em]">Billing</th>
                <th className="px-4 py-2 font-semibold uppercase tracking-[0.2em]">Expiry</th>
                <th className="px-4 py-2 font-semibold uppercase tracking-[0.2em]">Update Subscription</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin.id} className="rounded-2xl bg-slate-50/90 shadow-sm">
                  <td className="rounded-l-2xl px-4 py-4">
                    <div className="font-semibold text-slate-950">{admin.businessName}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {admin.adminId} • {admin.email}
                    </div>
                  </td>
                  <td className="px-4 py-4 capitalize text-slate-600">
                    {String(admin.createdBySource || "").replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {admin.subscription?.plan?.name || "Not assigned"}
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                      {admin.subscription?.status || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-4 capitalize text-slate-600">
                    {admin.subscription?.billingCycle || "-"}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {admin.subscription?.expiryDate
                      ? new Date(admin.subscription.expiryDate).toLocaleDateString("en-IN")
                      : "-"}
                  </td>
                  <td className="rounded-r-2xl px-4 py-4">
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedPlanByAdmin[admin.id] || ""}
                        onChange={(event) =>
                          setSelectedPlanByAdmin((current) => ({
                            ...current,
                            [admin.id]: event.target.value,
                          }))
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-violet-400"
                      >
                        <option value="">Select plan</option>
                        {sortedPlans.map((plan) => (
                          <option key={plan.code} value={plan.code}>
                            {plan.name}
                          </option>
                        ))}
                      </select>
                      <select
                        value={selectedCycleByAdmin[admin.id] || "monthly"}
                        onChange={(event) =>
                          setSelectedCycleByAdmin((current) => ({
                            ...current,
                            [admin.id]: event.target.value,
                          }))
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-violet-400"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleAssign(admin.id)}
                        disabled={
                          !selectedPlanByAdmin[admin.id] || assigningAdminId === admin.id
                        }
                        className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-violet-500 disabled:opacity-60"
                      >
                        <ShieldCheck size={14} />
                        {assigningAdminId === admin.id ? "Updating..." : "Save"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
        </>
      )}

      {activeTab === "vendor" && (
        <>
      <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-[radial-gradient(circle_at_top_left,_rgba(52,211,153,0.18),_transparent_24%),linear-gradient(135deg,#ffffff_0%,#f4fbf7_56%,#f7fbff_100%)] shadow-[0_20px_60px_-35px_rgba(5,150,105,0.25)]">
        <div className="flex flex-col gap-8 px-6 py-7 xl:flex-row xl:items-end xl:justify-between">
          <SectionTitle
            eyebrow="Vendor Subscription"
            title="Vendor Plans And Vendor Access"
            description="Manage vendor subscription plans, convert local vendors into global vendors through plan assignment, and control active vendor subscriptions from the same super admin workspace."
          />

          <div className="flex w-full flex-col gap-4 xl:w-auto xl:items-end">
            <button
              type="button"
              onClick={startVendorCreate}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_34px_-18px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:bg-emerald-700"
            >
              <Plus size={16} />
              New Vendor Plan
            </button>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: "Plans", value: vendorStats.plans, icon: Layers3 },
                { label: "Vendors", value: vendorStats.vendors, icon: Store },
                { label: "Active Subs", value: vendorStats.activeSubs, icon: ShieldCheck },
              ].map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
                      <p className="mt-1 text-2xl font-black text-slate-950">{value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        {sortedVendorPlans.map((plan) => (
          <VendorPlanCard key={plan.code} plan={plan} onEdit={startVendorEdit} />
        ))}
      </section>

      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_16px_50px_-34px_rgba(15,23,42,0.25)]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-500">
            Vendor Allocation
          </p>
          <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            Vendor Subscriptions
          </h3>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-[1180px] w-full border-separate border-spacing-y-3 text-left text-sm">
            <thead>
              <tr className="text-slate-400">
                <th className="px-4 py-2 font-semibold uppercase tracking-[0.2em]">Vendor</th>
                <th className="px-4 py-2 font-semibold uppercase tracking-[0.2em]">Type</th>
                <th className="px-4 py-2 font-semibold uppercase tracking-[0.2em]">Created By</th>
                <th className="px-4 py-2 font-semibold uppercase tracking-[0.2em]">Current Plan</th>
                <th className="px-4 py-2 font-semibold uppercase tracking-[0.2em]">Status</th>
                <th className="px-4 py-2 font-semibold uppercase tracking-[0.2em]">Amount</th>
                <th className="px-4 py-2 font-semibold uppercase tracking-[0.2em]">Update Subscription</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="rounded-2xl bg-slate-50/90 shadow-sm">
                  <td className="rounded-l-2xl px-4 py-4">
                    <div className="font-semibold text-slate-950">{vendor.name}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {vendor.vendorId} • {vendor.email || vendor.phone || "-"}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                      {vendor.vendorType}
                    </span>
                  </td>
                  <td className="px-4 py-4 capitalize text-slate-600">
                    {String(vendor.createdByRole || "").replace(/_/g, " ")}
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {vendor.subscription?.plan?.name || "Not assigned"}
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                      {vendor.subscription?.status || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {vendor.subscription?.amountPaid ? formatCurrency(vendor.subscription.amountPaid) : "-"}
                  </td>
                  <td className="rounded-r-2xl px-4 py-4">
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedPlanByVendor[vendor.id] || ""}
                        onChange={(event) =>
                          setSelectedPlanByVendor((current) => ({
                            ...current,
                            [vendor.id]: event.target.value,
                          }))
                        }
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-400"
                      >
                        <option value="">Select plan</option>
                        {sortedVendorPlans.map((plan) => (
                          <option key={plan.code} value={plan.code}>
                            {plan.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleAssignVendor(vendor.id)}
                        disabled={!selectedPlanByVendor[vendor.id] || assigningVendorId === vendor.id}
                        className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
                      >
                        <ShieldCheck size={14} />
                        {assigningVendorId === vendor.id ? "Updating..." : "Save"}
                      </button>
                    </div>
                    {vendor.vendorType === "local" && (
                      <p className="mt-2 text-xs font-medium text-violet-600">
                        Assigning a plan will upgrade this vendor to global
                      </p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
        </>
      )}

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)] p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.6)]">
            <form onSubmit={handleSavePlan}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-violet-500">
                    Plan Editor
                  </p>
                  <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                    {selectedPlanCode ? "Edit Plan" : "Create Plan"}
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                    Set actual plan pricing, then define optional monthly intro and yearly offer pricing separately.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Close
                </button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  ["code", "Plan Code"],
                  ["name", "Plan Name"],
                  ["monthlyPrice", "Actual Monthly Price"],
                  ["yearlyPrice", "Actual Yearly Price"],
                  ["maxRestaurants", "Restaurant Limit"],
                  ["maxStaff", "Staff Limit"],
                  ["extraRestaurantMonthlyPrice", "Extra Restaurant Price"],
                  ["trialDays", "Trial Days"],
                  ["sortOrder", "Sort Order"],
                ].map(([key, label]) => (
                  <label key={key} className={labelClass}>
                    <span>{label}</span>
                    <input
                      value={form[key]}
                      onChange={(event) => handleFormChange(key, event.target.value)}
                      disabled={key === "code" && Boolean(selectedPlanCode)}
                      className={`${inputClass} ${
                        key === "code" && selectedPlanCode
                          ? "bg-slate-100 text-slate-500"
                          : ""
                      }`}
                    />
                  </label>
                ))}
              </div>

              <div className="mt-5 grid gap-5 xl:grid-cols-2">
                <div className="rounded-[1.5rem] border border-amber-100 bg-amber-50/70 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
                      Monthly Intro Offer
                    </p>
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={form.monthlyOfferEnabled}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            monthlyOfferEnabled: event.target.checked,
                          }))
                        }
                      />
                      Enable
                    </label>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className={labelClass}>
                      <span>Offer Label</span>
                      <input
                        value={form.monthlyOfferLabel}
                        onChange={(event) =>
                          handleFormChange("monthlyOfferLabel", event.target.value)
                        }
                        className={inputClass}
                        placeholder="₹1 first month"
                      />
                    </label>
                    <label className={labelClass}>
                      <span>Offer Price</span>
                      <input
                        value={form.monthlyOfferDiscountedPrice}
                        onChange={(event) =>
                          handleFormChange(
                            "monthlyOfferDiscountedPrice",
                            event.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </label>
                    <label className={labelClass}>
                      <span>Offer Discount %</span>
                      <input
                        value={form.monthlyOfferDiscountPercent}
                        onChange={(event) =>
                          handleFormChange(
                            "monthlyOfferDiscountPercent",
                            event.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </label>
                    <label className={labelClass}>
                      <span>Offer Duration (Months)</span>
                      <input
                        value={form.monthlyOfferDurationMonths}
                        onChange={(event) =>
                          handleFormChange(
                            "monthlyOfferDurationMonths",
                            event.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </label>
                  </div>
                  <div className="mt-4 rounded-2xl border border-dashed border-amber-200 bg-white px-4 py-3 text-sm text-slate-600">
                    <span className="font-semibold text-slate-900">Display:</span>{" "}
                    <span className="text-slate-400 line-through">
                      {formatCurrency(form.monthlyPrice || 0)}
                    </span>{" "}
                    <span className="font-bold text-amber-700">
                      {formatCurrency(form.monthlyOfferDiscountedPrice || 0)}
                    </span>{" "}
                    <span className="text-xs font-semibold text-amber-700">
                      {monthlyOfferPreview.discountPercent}% OFF
                    </span>
                  </div>
                </div>

                <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/70 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                      Yearly Billing Offer
                    </p>
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={form.yearlyOfferEnabled}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            yearlyOfferEnabled: event.target.checked,
                          }))
                        }
                      />
                      Enable
                    </label>
                  </div>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className={labelClass}>
                      <span>Offer Label</span>
                      <input
                        value={form.yearlyOfferLabel}
                        onChange={(event) =>
                          handleFormChange("yearlyOfferLabel", event.target.value)
                        }
                        className={inputClass}
                        placeholder="17% off yearly"
                      />
                    </label>
                    <label className={labelClass}>
                      <span>Offer Price</span>
                      <input
                        value={form.yearlyOfferDiscountedPrice}
                        onChange={(event) =>
                          handleFormChange(
                            "yearlyOfferDiscountedPrice",
                            event.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </label>
                    <label className={labelClass}>
                      <span>Offer Discount %</span>
                      <input
                        value={form.yearlyOfferDiscountPercent}
                        onChange={(event) =>
                          handleFormChange(
                            "yearlyOfferDiscountPercent",
                            event.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </label>
                    <label className={labelClass}>
                      <span>Offer Duration (Months)</span>
                      <input
                        value={form.yearlyOfferDurationMonths}
                        onChange={(event) =>
                          handleFormChange(
                            "yearlyOfferDurationMonths",
                            event.target.value
                          )
                        }
                        className={inputClass}
                      />
                    </label>
                  </div>
                  <div className="mt-4 rounded-2xl border border-dashed border-emerald-200 bg-white px-4 py-3 text-sm text-slate-600">
                    <span className="font-semibold text-slate-900">Display:</span>{" "}
                    <span className="text-slate-400 line-through">
                      {formatCurrency(form.yearlyPrice || 0)}
                    </span>{" "}
                    <span className="font-bold text-emerald-700">
                      {formatCurrency(form.yearlyOfferDiscountedPrice || 0)}
                    </span>{" "}
                    <span className="text-xs font-semibold text-emerald-700">
                      {yearlyOfferPreview.discountPercent}% OFF
                    </span>
                  </div>
                </div>
              </div>

              <label className={`mt-4 block ${labelClass}`}>
                <span>Description</span>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </label>

              <label className={`mt-4 block ${labelClass}`}>
                <span>Display Features</span>
                <textarea
                  rows={8}
                  value={form.displayFeatures}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      displayFeatures: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </label>

              <div className="mt-4 flex flex-wrap gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.isPopular}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        isPopular: event.target.checked,
                      }))
                    }
                  />
                  Mark as most popular
                </label>
                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        isActive: event.target.checked,
                      }))
                    }
                  />
                  Active
                </label>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
                >
                  <ShieldCheck size={16} />
                  {saving
                    ? "Saving..."
                    : selectedPlanCode
                      ? "Update Plan"
                      : "Create Plan"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {vendorFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fbfcff_100%)] p-6 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.6)]">
            <form onSubmit={handleSaveVendorPlan}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-500">
                    Vendor Plan Editor
                  </p>
                  <h3 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
                    {selectedVendorPlanCode ? "Edit Vendor Plan" : "Create Vendor Plan"}
                  </h3>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                    Manage vendor plan pricing, access labels, restaurant limits, and plan feature lists.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetVendorForm}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Close
                </button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  ["code", "Plan Code"],
                  ["name", "Plan Name"],
                  ["tagline", "Tagline"],
                  ["badgeLabel", "Badge Label"],
                  ["monthlyPrice", "Monthly Price"],
                  ["restaurantLimit", "Restaurant Limit"],
                  ["restaurantLimitLabel", "Restaurant Label"],
                  ["sortOrder", "Sort Order"],
                ].map(([key, label]) => (
                  <label key={key} className={labelClass}>
                    <span>{label}</span>
                    <input
                      value={vendorForm[key]}
                      onChange={(event) =>
                        setVendorForm((current) => ({ ...current, [key]: event.target.value }))
                      }
                      disabled={key === "code" && Boolean(selectedVendorPlanCode)}
                      className={`${inputClass} ${
                        key === "code" && selectedVendorPlanCode ? "bg-slate-100 text-slate-500" : ""
                      }`}
                    />
                  </label>
                ))}

                <label className={labelClass}>
                  <span>Tier</span>
                  <select
                    value={vendorForm.tier}
                    onChange={(event) =>
                      setVendorForm((current) => ({ ...current, tier: event.target.value }))
                    }
                    className={inputClass}
                  >
                    <option value="basic">Basic</option>
                    <option value="pro">Pro</option>
                    <option value="business">Business</option>
                  </select>
                </label>
              </div>

              <label className={`mt-4 block ${labelClass}`}>
                <span>Description</span>
                <textarea
                  rows={3}
                  value={vendorForm.description}
                  onChange={(event) =>
                    setVendorForm((current) => ({ ...current, description: event.target.value }))
                  }
                  className={inputClass}
                />
              </label>

              {[
                ["featureSummary", "Feature Summary"],
                ["includedFeatures", "Included Features"],
                ["excludedFeatures", "Excluded Features"],
                ["lockedTriggers", "Locked Triggers"],
                ["pageAccess", "Page Access"],
              ].map(([key, label]) => (
                <label key={key} className={`mt-4 block ${labelClass}`}>
                  <span>{label}</span>
                  <textarea
                    rows={6}
                    value={vendorForm[key]}
                    onChange={(event) =>
                      setVendorForm((current) => ({ ...current, [key]: event.target.value }))
                    }
                    className={inputClass}
                  />
                </label>
              ))}

              <div className="mt-4 flex flex-wrap gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={vendorForm.isPopular}
                    onChange={(event) =>
                      setVendorForm((current) => ({ ...current, isPopular: event.target.checked }))
                    }
                  />
                  Mark as popular
                </label>
                <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={vendorForm.isActive}
                    onChange={(event) =>
                      setVendorForm((current) => ({ ...current, isActive: event.target.checked }))
                    }
                  />
                  Active
                </label>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={vendorSaving}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  <ShieldCheck size={16} />
                  {vendorSaving
                    ? "Saving..."
                    : selectedVendorPlanCode
                      ? "Update Vendor Plan"
                      : "Create Vendor Plan"}
                </button>
                <button
                  type="button"
                  onClick={resetVendorForm}
                  className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;
