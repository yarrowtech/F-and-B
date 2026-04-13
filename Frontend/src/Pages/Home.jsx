import React, { useEffect } from "react";
import { motion } from "framer-motion";
import {
  FaBoxes,
  FaChartLine,
  FaClipboardCheck,
  FaEnvelope,
  FaPhoneAlt,
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
    title: "Built For Daily Operations",
    text: "This platform brings your restaurant floor, kitchen, inventory, accounts, and management teams into one workflow.",
  },
  {
    title: "One Flow, Not Many Screens",
    text: "The home page introduces the product section by section so it feels like a proper landing page while scrolling.",
  },
  {
    title: "Ready To Scale",
    text: "Whether you run one outlet or many, the system is designed to support clearer operations and faster decisions.",
  },
];

const contactCards = [
  { label: "Email", value: "info@fnb-solutions.com", icon: <FaEnvelope /> },
  { label: "Phone", value: "+91 98305 90929", icon: <FaPhoneAlt /> },
];

const Home = () => {
  useEffect(() => {
    if (!window.location.hash) {
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    const sectionId = window.location.hash.replace("#", "");
    const timeoutId = window.setTimeout(() => {
      const target = document.getElementById(sectionId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);

    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <div className="relative overflow-hidden bg-[#120c09] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(74,222,128,0.12),_transparent_18%),radial-gradient(circle_at_bottom_left,_rgba(74,222,128,0.14),_transparent_25%)]" />

      <Header />
      <Hero />

      <main className="relative overflow-hidden px-4 pb-16 md:px-8">
        <section id="services" className="scroll-mt-28 py-20">
          <div className="mx-auto max-w-7xl rounded-[2.4rem] border border-white/8 bg-[#17100d]/90 p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_28px_80px_-35px_rgba(0,0,0,0.9)] backdrop-blur md:p-12">
            <div className="mx-auto mb-14 max-w-3xl text-center">
              <span className="inline-flex rounded-full border border-[#4ade80]/20 bg-[#4ade80]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.2em] text-[#4ade80]">
                Connected Experience
              </span>
              <h2 className="mt-6 text-4xl font-black text-white md:text-5xl">
                Everything flows in one landing page
              </h2>
              <p className="mt-4 text-lg leading-8 text-white/64">
                Visitors can now scroll through your services, product value, and contact section in one smooth journey instead of jumping between separate pages.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
              {serviceCards.map(({ title, description, icon }, index) => (
                <motion.article
                  key={title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                  whileHover={{ y: -10 }}
                  className="rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,_rgba(255,255,255,0.06)_0%,_rgba(255,255,255,0.02)_100%)] p-6 shadow-[0_18px_40px_-28px_rgba(74,222,128,0.24)]"
                >
                  <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4ade80] text-[#140d09] shadow-[0_14px_30px_-18px_rgba(74,222,128,0.9)]">
                    {icon}
                  </div>
                  <h3 className="text-xl font-bold text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/64">{description}</p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section id="about" className="scroll-mt-28 py-8">
          <div className="mx-auto grid max-w-7xl items-center gap-10 rounded-[2.4rem] border border-white/8 bg-[#18110d]/92 p-8 shadow-[0_28px_80px_-35px_rgba(0,0,0,0.9)] md:grid-cols-[0.95fr_1.05fr] md:p-12">
            <div className="relative overflow-hidden rounded-[2rem] border border-[#4ade80]/10 bg-black/30 p-4">
              <img
                src={aboutImage}
                alt="Restaurant operations"
                className="h-full min-h-[420px] w-full rounded-[1.6rem] object-cover opacity-90"
                loading="lazy"
              />
              <div className="absolute inset-x-8 bottom-8 rounded-[1.4rem] border border-white/10 bg-black/35 p-6 backdrop-blur-md">
                <p className="text-xs uppercase tracking-[0.3em] text-[#4ade80]">About The Platform</p>
                <p className="mt-3 text-base leading-7 text-white/78">
                  A connected restaurant operations platform presented with a stronger landing page experience.
                </p>
              </div>
            </div>

            <div>
              <span className="inline-flex rounded-full border border-[#4ade80]/20 bg-[#4ade80]/10 px-4 py-1 text-sm font-semibold uppercase tracking-[0.2em] text-[#4ade80]">
                About The Platform
              </span>
              <h2 className="mt-6 text-4xl font-black text-white md:text-5xl">
                Restaurant operations made simpler from start to finish
              </h2>
              <p className="mt-5 text-lg leading-8 text-white/68">
                From front-of-house activity to inventory planning and manager reporting, the system is designed to help teams move faster with fewer manual steps.
              </p>

              <div className="mt-8 grid gap-4">
                {storyCards.map(({ title, text }, index) => (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, x: 18 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.4, delay: index * 0.08 }}
                    className="rounded-[1.7rem] border border-white/8 bg-white/5 p-5 backdrop-blur-sm"
                  >
                    <h3 className="text-lg font-semibold text-[#4ade80]">{title}</h3>
                    <p className="mt-2 text-sm leading-7 text-white/66">{text}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="scroll-mt-28 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr]">
              <div className="rounded-[2.4rem] border border-[#4ade80]/14 bg-[linear-gradient(140deg,_rgba(74,222,128,0.18)_0%,_rgba(74,222,128,0.12)_100%)] p-8 shadow-[0_18px_70px_-35px_rgba(74,222,128,0.42)] backdrop-blur md:p-10">
                <span className="inline-flex rounded-full border border-white/10 bg-black/20 px-4 py-1 text-sm font-semibold uppercase tracking-[0.2em] text-[#86efac]">
                  Final Section
                </span>
                <h2 className="mt-6 text-4xl font-black text-white md:text-5xl">
                  End the scroll with a clear next step
                </h2>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-white/78">
                  This section completes the landing page journey, so users can understand the platform and contact you without leaving the home page.
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {contactCards.map(({ label, value, icon }) => (
                    <div key={label} className="rounded-[1.7rem] border border-white/10 bg-black/20 p-5 backdrop-blur-sm">
                      <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/12 text-[#4ade80]">
                        {icon}
                      </div>
                      <p className="mt-4 text-xs uppercase tracking-[0.25em] text-white/55">{label}</p>
                      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <form className="rounded-[2.4rem] border border-white/8 bg-[#17100d]/92 p-8 shadow-[0_28px_80px_-35px_rgba(0,0,0,0.9)] backdrop-blur md:p-10">
                <h3 className="text-3xl font-black text-white">Contact Us</h3>
                <p className="mt-3 text-white/64">
                  Share your details here. This form is now part of the home page landing flow.
                </p>

                <div className="mt-8 grid gap-4">
                  <input
                    type="text"
                    placeholder="Your name"
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-[#4ade80]/50"
                  />
                  <input
                    type="email"
                    placeholder="Email address"
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-[#4ade80]/50"
                  />
                  <input
                    type="text"
                    placeholder="Business name"
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-[#4ade80]/50"
                  />
                  <textarea
                    rows="5"
                    placeholder="Tell us what you need"
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/35 focus:border-[#4ade80]/50"
                  />
                  <button
                    type="button"
                    className="rounded-full bg-[#4ade80] px-6 py-3 font-bold text-[#140d09] transition hover:-translate-y-1 hover:brightness-110"
                  >
                    Send Message
                  </button>
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
              EF<span className="text-[#4ade80]">&amp;</span>B-M
            </h3>
            <p className="mt-2 max-w-xl text-sm leading-6 text-white/55">
              A connected restaurant operations platform for teams, inventory, kitchen workflow, and business visibility.
            </p>

            <div className="mt-6 flex flex-col gap-2 text-sm text-white/55">
              <a href="#hero" className="transition hover:text-[#4ade80]">
                Back to top
              </a>
              <p>info@fnb-solutions.com</p>
              <p>+91 98305 90929</p>
              <p>3A, Bertram St, Esplanade, Dharmatala, Taltala, Kolkata, West Bengal 700087</p>
              <p>(c) 2026 EF&amp;B-M. All rights reserved.</p>
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
              title="EF&B-M location"
              src="https://www.google.com/maps?q=3A,+Bertram+St,+Esplanade,+Dharmatala,+Taltala,+Kolkata,+West+Bengal+700087&output=embed"
              className="h-[260px] w-full rounded-[1.2rem] border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
