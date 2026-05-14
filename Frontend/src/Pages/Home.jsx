import React, { useEffect, useState } from "react";
import {
  FaBoxes,
  FaCashRegister,
  FaChartLine,
  FaCheckCircle,
  FaClipboardCheck,
  FaEnvelope,
  FaPhoneAlt,
  FaTimes,
  FaTruck,
  FaUsers,
} from "react-icons/fa";
import Header from "../components/Header";
import Hero from "../components/Hero";
import aboutImage from "../assets/Images/about.jpg";

const serviceCards = [
  {
    title: "Staff Control",
    description: "Manage departments, permissions, attendance, and shift flow from one dashboard.",
    icon: <FaUsers className="text-xl" />,
  },
  {
    title: "Inventory Pulse",
    description: "Track stock movement, reduce waste, and respond quickly to kitchen demand.",
    icon: <FaBoxes className="text-xl" />,
  },
  {
    title: "Kitchen Queue",
    description: "Move orders from service to preparation with cleaner timing and visibility.",
    icon: <FaClipboardCheck className="text-xl" />,
  },
  {
    title: "Vendor Sync",
    description: "Coordinate purchase planning, deliveries, and supplier performance in one flow.",
    icon: <FaTruck className="text-xl" />,
  },
  {
    title: "Live Analytics",
    description: "Turn everyday activity into insights for managers, admins, and owners.",
    icon: <FaChartLine className="text-xl" />,
  },
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
            <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
              <div>
                <span className="inline-flex rounded-full border border-[#4ade80]/20 bg-[#4ade80]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.2em] text-[#4ade80]">
                  Platform Modules
                </span>
                <h2 className="mt-6 max-w-xl text-4xl font-black leading-tight text-white md:text-5xl">
                  Built around the real rhythm of restaurants
                </h2>
              </div>
              <p className="max-w-3xl text-lg leading-8 text-white/66 lg:justify-self-end">
                EFNBMMS brings staff, stock, kitchen, vendor, account, and reporting workflows into a single operating layer so every department sees what matters.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              {platformStats.map(({ value, label }) => (
                <div key={label} className="border-l border-[#4ade80]/30 pl-5">
                  <p className="text-4xl font-black text-[#4ade80]">{value}</p>
                  <p className="mt-2 text-sm uppercase tracking-[0.2em] text-white/52">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
              {serviceCards.map(({ title, description, icon }) => (
                <article
                  key={title}
                  className="group rounded-2xl border border-white/8 bg-white/[0.045] p-6 transition duration-300 hover:-translate-y-2 hover:border-[#4ade80]/35 hover:bg-[#4ade80]/[0.075]"
                >
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#4ade80] text-[#140d09]">
                    {icon}
                  </div>
                  <h3 className="text-xl font-bold text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/62">{description}</p>
                  <div className="mt-6 h-px w-12 bg-[#4ade80]/50 transition-all duration-300 group-hover:w-24" />
                </article>
              ))}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
    </div>
  );
};

export default Home;
