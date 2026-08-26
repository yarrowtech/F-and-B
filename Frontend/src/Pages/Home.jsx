import React, { useEffect, useState } from "react";
import {
  FaArrowRight,
  FaBoxes,
  FaCashRegister,
  FaChartLine,
  FaCheckCircle,
  FaClipboardCheck,
  FaEnvelope,
  FaLeaf,
  FaLayerGroup,
  FaPhoneAlt,
  FaShieldAlt,
  FaTimes,
  FaTruck,
  FaUsers,
} from "react-icons/fa";
import API from "../services/api";
import Header from "../components/Header";
import Hero from "../components/Hero";
import aboutImage from "../assets/Images/about.jpg";
import { Link } from "react-router-dom";

const serviceCards = [
  {
    title: "Staff Control",
    description: "Manage departments, permissions, attendance, and shift flow from one dashboard.",
    icon: <FaUsers className="text-xl" />,
    accent: "from-emerald-300/25 via-emerald-200/10 to-transparent",
    stat: "Roles + shifts",
  },
  {
    title: "Inventory Pulse",
    description: "Track stock movement, reduce waste, and respond quickly to kitchen demand.",
    icon: <FaBoxes className="text-xl" />,
    accent: "from-cyan-300/25 via-sky-200/10 to-transparent",
    stat: "Stock visibility",
  },
  {
    title: "Kitchen Queue",
    description: "Move orders from service to preparation with cleaner timing and visibility.",
    icon: <FaClipboardCheck className="text-xl" />,
    accent: "from-amber-300/25 via-orange-200/10 to-transparent",
    stat: "Prep flow",
  },
  {
    title: "Vendor Sync",
    description: "Coordinate purchase planning, deliveries, and supplier performance in one flow.",
    icon: <FaTruck className="text-xl" />,
    accent: "from-violet-300/25 via-fuchsia-200/10 to-transparent",
    stat: "Supplier control",
  },
  {
    title: "Live Analytics",
    description: "Turn everyday activity into insights for managers, admins, and owners.",
    icon: <FaChartLine className="text-xl" />,
    accent: "from-lime-300/25 via-green-200/10 to-transparent",
    stat: "Decision ready",
  },
];

const serviceHighlights = [
  {
    title: "One connected operating layer",
    text: "Front office, kitchen, inventory, vendors, and accounts work in one connected flow.",
    icon: <FaLayerGroup />,
  },
  {
    title: "Faster team execution",
    text: "Orders, tasks, and updates move with better visibility across teams.",
    icon: <FaArrowRight />,
  },
  {
    title: "Clear control",
    text: "Role-based access and reporting help admins manage operations with confidence.",
    icon: <FaShieldAlt />,
  },
];

const serviceJourney = [
  "Capture orders, stock, staff, and vendor activity in one place",
  "Keep every department updated with role-based views",
  "Turn daily movement into reporting, controls, and growth decisions",
];

const storyCards = [
  {
    title: "Role Based Modules",
    text: "Admins, managers, chefs, waiters, accountants, vendors, and inventory teams each get a focused workspace.",
  },
  {
    title: "Live Operational Flow",
    text: "Orders, kitchen status, stock movement, payments, and staff activity stay connected across the restaurant.",
  },
  {
    title: "Clear Business Visibility",
    text: "Dashboards and account history help teams understand daily performance without digging through manual records.",
  },
];

const contactCards = [
  { label: "Email", value: "contact@efnbmmsgmail.com", icon: <FaEnvelope /> },
  { label: "Phone", value: "+91 98305 90929", icon: <FaPhoneAlt /> },
];

const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const CONTACT_API_URL = `${API_BASE_URL}/contact`;

const platformStats = [
  { value: "9+", label: "Team modules" },
  { value: "24/7", label: "Live workflow" },
  { value: "1", label: "Connected ERP" },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const calculateOffer = (basePrice, discountedPrice) => {
  const base = Number(basePrice || 0);
  const offer = Number(discountedPrice || 0);
  const savingsAmount = Math.max(0, base - offer);
  const discountPercent =
    base > 0 && savingsAmount > 0 ? Math.round((savingsAmount / base) * 100) : 0;

  return {
    finalPrice: discountPercent > 0 ? offer : base,
    discountPercent,
  };
};

const getAdminLandingPrice = (plan) => {
  const offer = plan?.offers?.monthly || {};
  const preview = calculateOffer(plan?.monthlyPrice, offer.discountedPrice);

  return {
    finalPrice: preview.finalPrice,
    discountPercent: preview.discountPercent,
    label: offer.label || "",
  };
};

const adminPlanThemes = [
  {
    shell: "from-emerald-300/35 via-emerald-100/14 to-transparent border-emerald-300/30",
    glow: "from-emerald-300/40 via-lime-200/20 to-transparent",
    badge: "text-[#86efac]",
    accentBg: "bg-emerald-400",
  },
  {
    shell: "from-violet-300/35 via-fuchsia-100/14 to-transparent border-violet-300/30",
    glow: "from-violet-300/40 via-fuchsia-200/20 to-transparent",
    badge: "text-[#c4b5fd]",
    accentBg: "bg-violet-400",
  },
  {
    shell: "from-amber-300/35 via-orange-100/14 to-transparent border-amber-300/30",
    glow: "from-amber-300/40 via-orange-200/20 to-transparent",
    badge: "text-[#fcd34d]",
    accentBg: "bg-amber-400",
  },
];

const vendorPlanThemes = [
  {
    shell: "from-cyan-300/35 via-sky-100/14 to-transparent border-cyan-300/30",
    glow: "from-cyan-300/40 via-sky-200/20 to-transparent",
    badge: "text-[#7dd3fc]",
    accentBg: "bg-cyan-400",
  },
  {
    shell: "from-rose-300/35 via-pink-100/14 to-transparent border-rose-300/30",
    glow: "from-rose-300/40 via-pink-200/20 to-transparent",
    badge: "text-[#f9a8d4]",
    accentBg: "bg-rose-400",
  },
  {
    shell: "from-indigo-300/35 via-blue-100/14 to-transparent border-indigo-300/30",
    glow: "from-indigo-300/40 via-blue-200/20 to-transparent",
    badge: "text-[#93c5fd]",
    accentBg: "bg-indigo-400",
  },
];

const getPlanTheme = (type, index = 0) =>
  (type === "admin" ? adminPlanThemes : vendorPlanThemes)[
    index % (type === "admin" ? adminPlanThemes.length : vendorPlanThemes.length)
  ];

const getAdminPlanDetails = (plan) => {
  const features = Array.isArray(plan.displayFeatures) ? plan.displayFeatures : [];
  const monthlyOffer = plan?.offers?.monthly || {};
  const yearlyOffer = plan?.offers?.yearly || {};

  return {
    features,
    monthlyOffer,
    yearlyOffer,
  };
};

const getVendorPlanDetails = (plan) => ({
  includedFeatures: Array.isArray(plan.includedFeatures) ? plan.includedFeatures : [],
  excludedFeatures: Array.isArray(plan.excludedFeatures) ? plan.excludedFeatures : [],
});

const AdminPlanPreviewCard = ({ plan, index, onOpen }) => {
  const pricing = getAdminLandingPrice(plan);
  const theme = getPlanTheme("admin", index);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`relative w-full overflow-hidden rounded-[1.9rem] border bg-white/[0.06] p-6 text-left backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-white/25 ${theme.shell}`}
    >
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r ${theme.glow}`} />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-white">{plan.name}</h3>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
            {plan.code}
          </p>
        </div>
        {plan.isPopular && (
          <span className={`rounded-full bg-white/12 px-3 py-1 text-xs font-semibold ${theme.badge}`}>
            Popular
          </span>
        )}
      </div>
      <p className="relative mt-4 text-sm leading-7 text-white/68">{plan.description}</p>
      <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/38">Monthly</p>
          <p className="mt-2 break-words text-xl font-black leading-tight text-white sm:text-2xl">
            {formatCurrency(pricing.finalPrice)}
          </p>
          {pricing.discountPercent > 0 && (
            <p className="mt-2 text-xs font-semibold text-[#86efac]">
              {pricing.label || `${pricing.discountPercent}% offer active`}
            </p>
          )}
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/38">Restaurants</p>
          <p className="mt-2 break-words text-xl font-black leading-tight text-white sm:text-2xl">
            {plan.maxRestaurants}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/38">Staff</p>
          <p className="mt-2 break-words text-xl font-black leading-tight text-white sm:text-2xl">
            {plan.maxStaff >= 9999 ? "Unlimited" : plan.maxStaff}
          </p>
        </div>
      </div>
      <div className="relative mt-5 flex items-center justify-between border-t border-white/10 pt-4">
        <p className="text-sm font-semibold text-white/72">Click to view full plan</p>
        <span className="text-xl font-light text-white/70">+</span>
      </div>
    </button>
  );
};

const VendorPlanPreviewCard = ({ plan, index, onOpen }) => {
  const theme = getPlanTheme("vendor", index);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`relative w-full overflow-hidden rounded-[1.9rem] border bg-white/[0.06] p-6 text-left backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-white/25 ${theme.shell}`}
    >
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r ${theme.glow}`} />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <h3 className="text-2xl font-black text-white">{plan.name}</h3>
          <p className="mt-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
            {plan.code}
          </p>
        </div>
        {plan.isPopular && (
          <span className={`rounded-full bg-white/12 px-3 py-1 text-xs font-semibold ${theme.badge}`}>
            Popular
          </span>
        )}
      </div>
      <p className="relative mt-4 text-sm font-semibold text-white/90">{plan.tagline}</p>
      <p className="relative mt-2 text-sm leading-7 text-white/68">{plan.description}</p>
      <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/38">Monthly</p>
          <p className="mt-2 break-words text-xl font-black leading-tight text-white sm:text-2xl">
            {formatCurrency(plan.monthlyPrice)}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/38">Access</p>
          <p className="mt-2 break-words text-base font-black leading-tight text-white sm:text-lg">
            {plan.badgeLabel}
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/38">Limit</p>
          <p className="mt-2 break-words text-base font-black leading-tight text-white sm:text-lg">
            {plan.restaurantLimitLabel}
          </p>
        </div>
      </div>
      <div className="relative mt-5 flex items-center justify-between border-t border-white/10 pt-4">
        <p className="text-sm font-semibold text-white/72">Click to view full plan</p>
        <span className="text-xl font-light text-white/70">+</span>
      </div>
    </button>
  );
};

const Home = () => {
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    company: "",
    message: "",
  });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSuccess, setContactSuccess] = useState("");
  const [contactError, setContactError] = useState("");
  const [adminPlans, setAdminPlans] = useState([]);
  const [vendorPlans, setVendorPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [landingTheme, setLandingTheme] = useState(
    () => {
      const savedIsDark = localStorage.getItem("isDark");
      const savedTheme = localStorage.getItem("theme");
      return savedIsDark !== null
        ? savedIsDark === "true" ? "dark" : "light"
        : savedTheme || "dark";
    }
  );

  useEffect(() => {
    localStorage.setItem("landingTheme", landingTheme);
    localStorage.setItem("theme", landingTheme);
    localStorage.setItem("isDark", String(landingTheme === "dark"));
    document.documentElement.classList.toggle("dark", landingTheme === "dark");
  }, [landingTheme]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setPlansLoading(true);
        const [adminRes, vendorRes] = await Promise.all([
          API.get("/subscriptions/plans"),
          API.get("/vendor-subscriptions/plans"),
        ]);
        setAdminPlans(adminRes.data?.plans || []);
        setVendorPlans(vendorRes.data?.plans || []);
      } catch {
        setAdminPlans([]);
        setVendorPlans([]);
      } finally {
        setPlansLoading(false);
      }
    };

    fetchPlans();
  }, []);

  useEffect(() => {
    if (!window.location.hash) {
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    const sectionId = window.location.hash.replace("#", "");
    const timeoutId = window.setTimeout(() => {
      const target = document.getElementById(sectionId);
      if (target) {
        const headerOffset = 96;
        const targetTop =
          target.getBoundingClientRect().top + window.scrollY - headerOffset;

        window.scrollTo({
          top: Math.max(targetTop, 0),
          behavior: "smooth",
        });
      }
    }, 100);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (!selectedPlan) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedPlan(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedPlan]);

  const handleContactChange = (event) => {
    const { name, value } = event.target;
    setContactForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateContactForm = () => {
    if (!contactForm.name.trim()) return "Please enter your name.";
    if (!contactForm.email.trim()) return "Please enter your email.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email.trim())) {
      return "Please enter a valid email address.";
    }
    if (!contactForm.message.trim()) return "Please enter your message.";
    return "";
  };

  const handleContactSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateContactForm();
    if (validationError) {
      setContactError(validationError);
      setContactSuccess("");
      return;
    }

    setContactSubmitting(true);
    setContactError("");
    setContactSuccess("");

    try {
      const response = await fetch(CONTACT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactForm.name.trim(),
          email: contactForm.email.trim(),
          company: contactForm.company.trim(),
          subject: contactForm.company.trim() || "General Inquiry",
          message: contactForm.message.trim(),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setContactError(data.message || "Message could not be sent. Please try again.");
        return;
      }

      setContactForm({ name: "", email: "", company: "", message: "" });
      setContactSuccess("Contact form successfully submitted");
    } catch {
      setContactError("Unable to reach the server. Please try again later.");
    } finally {
      setContactSubmitting(false);
    }
  };

  return (
    <div
      className={`relative overflow-hidden bg-[#120c09] text-white ${
        landingTheme === "light" ? "landing-light" : ""
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(74,222,128,0.12),_transparent_18%),radial-gradient(circle_at_bottom_left,_rgba(74,222,128,0.14),_transparent_25%)]" />

      <Header
        landingTheme={landingTheme}
        onLandingThemeToggle={() =>
          setLandingTheme((current) => (current === "light" ? "dark" : "light"))
        }
      />
      <Hero />

      <main className="relative overflow-hidden px-4 pb-16 md:px-8">
        <section id="services" className="scroll-mt-28 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] shadow-[0_30px_120px_-60px_rgba(74,222,128,0.45)]">
              <div className="grid gap-8 p-8 md:p-10 xl:grid-cols-[1.2fr_0.8fr] xl:gap-10 xl:p-12">
                <div>
                  <span className="inline-flex rounded-full border border-[#4ade80]/25 bg-[#4ade80]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.24em] text-[#86efac]">
                    Platform Services
                  </span>
                  <h2 className="mt-5 max-w-2xl text-3xl font-black leading-tight text-white md:text-5xl">
                    Restaurant operations in one connected system
                  </h2>
                  <p className="mt-4 max-w-xl text-base leading-7 text-white/68">
                    Manage staff, kitchen, stock, vendors, billing, and reporting from one structured platform.
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      to="/login"
                      className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:border-[#4ade80]/35 hover:text-[#86efac]"
                    >
                      Login / Create Account
                    </Link>
                  </div>
                </div>

                <div className="grid gap-3">
                  {serviceHighlights.map(({ title, text, icon }) => (
                    <article
                      key={title}
                      className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4 backdrop-blur"
                    >
                      <div className="flex items-start gap-4">
                        <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#4ade80] text-base text-[#140d09] shadow-[0_16px_30px_-18px_rgba(74,222,128,0.8)]">
                          {icon}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white">{title}</h3>
                          <p className="mt-1 text-sm leading-6 text-white/62">{text}</p>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {platformStats.map(({ value, label }) => (
                <div
                  key={label}
                  className="rounded-[1.6rem] border border-white/8 bg-white/[0.04] p-5"
                >
                  <p className="text-4xl font-black text-[#4ade80]">{value}</p>
                  <p className="mt-2 text-sm uppercase tracking-[0.2em] text-white/52">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
              {serviceCards.map(({ title, description, icon, accent, stat }) => (
                <article
                  key={title}
                  className="group relative overflow-hidden rounded-[1.8rem] border border-white/8 bg-white/[0.045] p-6 transition duration-300 hover:-translate-y-2 hover:border-[#4ade80]/35"
                >
                  <div className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-r ${accent}`} />
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#4ade80] text-[#140d09]">
                    {icon}
                  </div>
                  <p className="relative text-[11px] font-semibold uppercase tracking-[0.24em] text-white/42">
                    {stat}
                  </p>
                  <h3 className="relative mt-3 text-xl font-bold text-white">{title}</h3>
                  <p className="relative mt-3 text-sm leading-7 text-white/62">{description}</p>
                  <div className="relative mt-6 h-px w-12 bg-[#4ade80]/50 transition-all duration-300 group-hover:w-24" />
                </article>
              ))}
            </div>

            <div className="mt-10 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[2rem] border border-[#4ade80]/15 bg-[linear-gradient(145deg,rgba(74,222,128,0.1),rgba(255,255,255,0.04))] p-6 md:p-7">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#4ade80] text-[#140d09]">
                    <FaLeaf />
                  </span>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#86efac]">
                      Service Flow
                    </p>
                    <h3 className="mt-1 text-2xl font-black text-white">
                      Clear from first order to final report
                    </h3>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {serviceJourney.map((step, index) => (
                    <div
                      key={step}
                      className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#86efac]">
                        Step 0{index + 1}
                      </p>
                      <p className="mt-3 text-sm leading-7 text-white/72">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/8 bg-white/[0.04] p-6 md:p-7">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/45">
                  Why teams like it
                </p>
                <h3 className="mt-3 text-3xl font-black leading-tight text-white">
                  A cleaner service page with stronger structure and better readability
                </h3>
                <p className="mt-4 text-sm leading-7 text-white/62">
                  The upgraded section now explains your modules more clearly and feels closer to a polished product website instead of a simple feature list.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="subscription" className="scroll-mt-28 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
              <div>
                <span className="inline-flex rounded-full border border-[#fde68a]/25 bg-[#fde68a]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.2em] text-[#fde68a]">
                  Subscription Plans
                </span>
                <h2 className="mt-6 max-w-xl text-4xl font-black leading-tight text-white md:text-5xl">
                  Subscription plans for admins and vendors
                </h2>
              </div>
              <p className="max-w-3xl text-lg leading-8 text-white/66 lg:justify-self-end">
                Compare all plans in one place with clear pricing, features, and access details for both admin and vendor accounts.
              </p>
            </div>

            <div className="mt-12 grid gap-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#86efac]">
                    Admin Subscription
                  </p>
                  <p className="mt-2 text-sm text-white/58">
                    Restaurant owner plans for operations, staff, reporting, and expansion.
                  </p>
                </div>
                <Link
                  to="/#subscription"
                  className="inline-flex items-center rounded-full border border-white/12 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-white transition hover:border-[#4ade80]/35 hover:text-[#4ade80]"
                >
                  Subscription Section
                </Link>
              </div>

              {plansLoading ? (
                <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] px-6 py-10 text-center text-sm text-white/60">
                  Loading admin plans...
                </div>
              ) : (
                <div className="grid gap-5 xl:grid-cols-3">
                  {adminPlans.map((plan, index) => (
                    <AdminPlanPreviewCard
                      key={plan.code}
                      plan={plan}
                      index={index}
                      onOpen={() => setSelectedPlan({ type: "admin", plan, index })}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="mt-12 grid gap-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#7dd3fc]">
                  Vendor Subscription
                </p>
                <p className="mt-2 text-sm text-white/58">
                  Local and global vendor growth plans for products, account flow, analytics, and restaurant access.
                </p>
              </div>

              {plansLoading ? (
                <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] px-6 py-10 text-center text-sm text-white/60">
                  Loading vendor plans...
                </div>
              ) : (
                <div className="grid gap-5 xl:grid-cols-3">
                  {vendorPlans.map((plan, index) => (
                    <VendorPlanPreviewCard
                      key={plan.code}
                      plan={plan}
                      index={index}
                      onOpen={() => setSelectedPlan({ type: "vendor", plan, index })}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="about" className="scroll-mt-28 py-14">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/20">
              <img
                src={aboutImage}
                alt="Restaurant operations"
                className="h-full min-h-[520px] w-full object-cover opacity-90"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#120c09] via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-7">
                <div className="inline-flex items-center gap-3 rounded-full border border-white/12 bg-black/40 px-4 py-2 text-sm font-semibold text-white/82 backdrop-blur">
                  <FaCashRegister className="text-[#4ade80]" />
                  Floor, kitchen, inventory, and accounts in sync
                </div>
              </div>
            </div>

            <div>
              <span className="inline-flex rounded-full border border-[#4ade80]/20 bg-[#4ade80]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.2em] text-[#4ade80]">
                How It Helps
              </span>
              <h2 className="mt-6 text-4xl font-black leading-tight text-white md:text-5xl">
                Less manual chasing, more controlled service
              </h2>
              <p className="mt-5 text-lg leading-8 text-white/68">
                The landing page now explains the product the way a restaurant owner thinks about it: people, orders, inventory, payments, and the decisions that connect them.
              </p>

              <div className="mt-8 grid gap-4">
                {storyCards.map(({ title, text }, index) => (
                  <div key={title} className="grid grid-cols-[48px_1fr] gap-4 rounded-2xl border border-white/8 bg-white/[0.04] p-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#4ade80]/25 bg-[#4ade80]/10 text-sm font-black text-[#4ade80]">
                      0{index + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{title}</h3>
                      <p className="mt-2 text-sm leading-7 text-white/64">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="scroll-mt-28 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 max-w-3xl">
              <span className="inline-flex rounded-full border border-[#4ade80]/20 bg-[#4ade80]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.2em] text-[#4ade80]">
                Start The Conversation
              </span>
              <h2 className="mt-6 text-4xl font-black leading-tight text-white md:text-5xl">
                Bring your restaurant workflow into one system
              </h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-2xl border border-[#4ade80]/18 bg-[#4ade80]/10 p-7">
                <p className="text-lg leading-8 text-white/78">
                  Tell us about your restaurant, team size, and current workflow. We will help map the right modules for your operation.
                </p>

                <div className="mt-8 grid gap-4">
                  {contactCards.map(({ label, value, icon }) => (
                    <a
                      key={label}
                      href={label === "Email" ? `mailto:${value}` : `tel:${value.replace(/\s/g, "")}`}
                      className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-[#4ade80]/35 hover:bg-black/28"
                    >
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/12 text-[#4ade80]">
                        {icon}
                      </span>
                      <span>
                        <span className="block text-xs uppercase tracking-[0.24em] text-white/50">{label}</span>
                        <span className="mt-1 block text-lg font-semibold text-white">{value}</span>
                      </span>
                    </a>
                  ))}
                </div>
              </div>

              <form
                className="rounded-2xl border border-white/10 bg-[#17100d]/92 p-7 backdrop-blur md:p-8"
                onSubmit={handleContactSubmit}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <input
                    type="text"
                    name="name"
                    value={contactForm.name}
                    onChange={handleContactChange}
                    placeholder="Your name"
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-[#4ade80]/50"
                  />
                  <input
                    type="email"
                    name="email"
                    value={contactForm.email}
                    onChange={handleContactChange}
                    placeholder="Email address"
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-[#4ade80]/50"
                  />
                  <input
                    type="text"
                    name="company"
                    value={contactForm.company}
                    onChange={handleContactChange}
                    placeholder="Business name"
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-[#4ade80]/50 sm:col-span-2"
                  />
                  <textarea
                    name="message"
                    rows="5"
                    value={contactForm.message}
                    onChange={handleContactChange}
                    placeholder="Tell us what you need"
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-[#4ade80]/50 sm:col-span-2"
                  />
                  <button
                    type="submit"
                    disabled={contactSubmitting}
                    className={`rounded-full bg-[#4ade80] px-6 py-3 font-bold text-[#140d09] transition hover:-translate-y-1 hover:brightness-110 sm:col-span-2 ${
                      contactSubmitting ? "cursor-not-allowed opacity-70" : ""
                    }`}
                  >
                    {contactSubmitting ? "Submitting..." : "Submit"}
                  </button>
                  {contactError && (
                    <p className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200 sm:col-span-2">
                      {contactError}
                    </p>
                  )}
                </div>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/8 bg-[#0f0a08] px-4 py-10 md:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h3 className="text-2xl font-black text-white">
              EFNBMMS
            </h3>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
              A connected restaurant operations platform for teams, inventory, kitchen workflow, and business visibility.
            </p>

            <div className="mt-6 flex flex-col gap-2 text-sm text-white/55">
              <a href="#hero" className="transition hover:text-[#4ade80]">
                Back to top
              </a>
              <Link
                to="/privacy-policy"
                className="inline-flex w-fit bg-transparent text-sky-300 no-underline outline-none transition visited:text-sky-300 hover:text-sky-200 focus:bg-transparent focus:text-sky-200 focus:outline-none active:bg-transparent [-webkit-tap-highlight-color:transparent]"
              >
                Privacy Policy
              </Link>
              <p>contact@efnbmmsgmail.com</p>
              <p>+91 98305 90929</p>
              <p>3A, Bertram St, Esplanade, Dharmatala, Taltala, Kolkata, West Bengal 700087</p>
              <p>(c) 2026 EFNBMMS. All rights reserved.</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/5 p-3 shadow-[0_18px_50px_-28px_rgba(0,0,0,0.8)]">
            <div className="mb-3 px-2">
              <p className="text-xs uppercase tracking-[0.28em] text-[#4ade80]">Address</p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                3A, Bertram St, Esplanade, Dharmatala, Taltala, Kolkata, West Bengal 700087
              </p>
            </div>
            <iframe
              title="EFNBMMS location"
              src="https://www.google.com/maps?q=3A,+Bertram+St,+Esplanade,+Dharmatala,+Taltala,+Kolkata,+West+Bengal+700087&output=embed"
              className="h-[260px] w-full rounded-[1.2rem] border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </footer>

      {contactSuccess && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 md:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setContactSuccess("")}
            aria-label="Close success popup"
          />

          <div className="relative z-10 w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl">
            <button
              type="button"
              onClick={() => setContactSuccess("")}
              className="absolute right-4 top-4 text-gray-400 transition hover:text-gray-600"
              aria-label="Close"
            >
              <FaTimes size={16} />
            </button>

            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <FaCheckCircle className="text-3xl text-green-600" />
              </div>
            </div>

            <h3 className="mb-2 text-xl font-bold text-gray-800">
              {contactSuccess}
            </h3>
            <p className="mb-6 text-sm text-gray-500">
              Thank you for reaching out. We'll get back to you as soon as possible.
            </p>

            <button
              type="button"
              onClick={() => setContactSuccess("")}
              className="w-full rounded-full bg-green-900 py-3 font-semibold text-white transition hover:bg-green-800"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedPlan(null)}
            aria-label="Close plan popup"
          />

          <div className="relative z-10 my-6 w-full max-w-3xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#17100d]/95 shadow-[0_26px_70px_-34px_rgba(0,0,0,0.9)] backdrop-blur-xl md:my-0 md:max-h-[88vh]">
            <div
              className={`pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-r ${
                getPlanTheme(selectedPlan.type, selectedPlan.index).glow
              }`}
            />
            <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5 md:p-6">
              <div>
                <p
                  className={`text-xs font-semibold uppercase tracking-[0.24em] ${
                    getPlanTheme(selectedPlan.type, selectedPlan.index).badge
                  }`}
                >
                  {selectedPlan.type === "admin" ? "Admin plan" : "Vendor plan"}
                </p>
                <h3 className="mt-2 text-2xl font-black text-white md:text-3xl">
                  {selectedPlan.plan.name}
                </h3>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-white/45">
                  {selectedPlan.plan.code}
                </p>
                <p className="mt-3 max-w-xl text-sm leading-6 text-white/68">
                  {selectedPlan.plan.tagline || selectedPlan.plan.description}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:border-[#4ade80]/35 hover:text-[#4ade80]"
                aria-label="Close"
              >
                <FaTimes />
              </button>
            </div>

            <div className="grid max-h-[calc(100vh-8rem)] gap-5 overflow-y-auto p-5 md:max-h-[calc(88vh-6.5rem)] md:p-6 xl:grid-cols-[0.86fr_1.14fr]">
              <div className="grid gap-3">
                {selectedPlan.type === "admin" ? (
                  <>
                    <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.05] p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                        Monthly Price
                      </p>
                      <p className="mt-2 text-2xl font-black text-white">
                        {formatCurrency(getAdminLandingPrice(selectedPlan.plan).finalPrice)}
                      </p>
                      {getAdminPlanDetails(selectedPlan.plan).monthlyOffer?.enabled && (
                        <p className="mt-2 text-sm font-semibold text-[#86efac]">
                          {getAdminPlanDetails(selectedPlan.plan).monthlyOffer.label || "Monthly offer active"}
                        </p>
                      )}
                    </div>
                    <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.05] p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                        Yearly Price
                      </p>
                      <p className="mt-2 text-2xl font-black text-white">
                        {formatCurrency(
                          getAdminPlanDetails(selectedPlan.plan).yearlyOffer?.enabled
                            ? getAdminPlanDetails(selectedPlan.plan).yearlyOffer.discountedPrice
                            : selectedPlan.plan.yearlyPrice
                        )}
                      </p>
                      {getAdminPlanDetails(selectedPlan.plan).yearlyOffer?.enabled && (
                        <p className="mt-2 text-sm font-semibold text-[#fde68a]">
                          {getAdminPlanDetails(selectedPlan.plan).yearlyOffer.label || "Yearly offer active"}
                        </p>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.05] p-4">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Restaurants</p>
                        <p className="mt-2 text-xl font-black text-white">{selectedPlan.plan.maxRestaurants}</p>
                      </div>
                      <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.05] p-4">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Staff Limit</p>
                        <p className="mt-2 text-xl font-black text-white">
                          {selectedPlan.plan.maxStaff >= 9999 ? "Unlimited" : selectedPlan.plan.maxStaff}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.05] p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                        Monthly Price
                      </p>
                      <p className="mt-2 text-2xl font-black text-white">
                        {formatCurrency(selectedPlan.plan.monthlyPrice)}
                      </p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.05] p-4">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Access</p>
                        <p className="mt-2 text-lg font-black text-white">{selectedPlan.plan.badgeLabel}</p>
                      </div>
                      <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.05] p-4">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Restaurant Limit</p>
                        <p className="mt-2 text-lg font-black text-white">{selectedPlan.plan.restaurantLimitLabel}</p>
                      </div>
                    </div>
                    <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.05] p-4">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">Plan Summary</p>
                      <p className="mt-2 text-sm leading-6 text-white/70">{selectedPlan.plan.description}</p>
                    </div>
                  </>
                )}
              </div>

              <div className="grid gap-3">
                <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.05] p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/45">
                    {selectedPlan.type === "admin" ? "Included Features" : "Plan Features"}
                  </p>
                  <div className="mt-4 grid gap-3">
                    {(selectedPlan.type === "admin"
                      ? getAdminPlanDetails(selectedPlan.plan).features
                      : getVendorPlanDetails(selectedPlan.plan).includedFeatures
                    ).map((feature) => (
                      <div
                        key={feature}
                        className="rounded-[1.1rem] border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white/78"
                      >
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>

                {selectedPlan.type === "vendor" &&
                  getVendorPlanDetails(selectedPlan.plan).excludedFeatures.length > 0 && (
                    <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.05] p-4">
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/45">
                        Locked / Not Included
                      </p>
                      <div className="mt-4 grid gap-3">
                        {getVendorPlanDetails(selectedPlan.plan).excludedFeatures.map((feature) => (
                          <div
                            key={feature}
                            className="rounded-[1.1rem] border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white/78"
                          >
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
