import React from "react";
import { motion } from "framer-motion";
import {
  FaArrowRight,
  FaBoxes,
  FaChartBar,
  FaCheckCircle,
  FaLeaf,
  FaLayerGroup,
  FaMoneyBillWave,
  FaPlug,
  FaShieldAlt,
  FaTasks,
  FaTruckLoading,
  FaUsers,
  FaUtensils,
} from "react-icons/fa";
import PublicPageShell from "../components/PublicPageShell";

void motion;

const services = [
  {
    icon: <FaUsers />,
    title: "User management",
    description: "Role-based access and multi-location structure for operational control.",
    stat: "Roles + permissions",
    accent: "from-emerald-300/35 via-emerald-100/15 to-transparent",
  },
  {
    icon: <FaUtensils />,
    title: "Menu and recipe flow",
    description: "Keep recipes, item costs, and updates visible in one place.",
    stat: "Menu clarity",
    accent: "from-lime-300/35 via-yellow-100/15 to-transparent",
  },
  {
    icon: <FaBoxes />,
    title: "Inventory control",
    description: "Monitor stock, prevent shortages, and act before waste grows.",
    stat: "Stock movement",
    accent: "from-cyan-300/35 via-sky-100/15 to-transparent",
  },
  {
    icon: <FaTruckLoading />,
    title: "Vendor tracking",
    description: "Coordinate suppliers, procurement, and incoming stock with less friction.",
    stat: "Purchase flow",
    accent: "from-violet-300/35 via-fuchsia-100/15 to-transparent",
  },
  {
    icon: <FaTasks />,
    title: "Kitchen execution",
    description: "Turn orders into clear prep workflows and team coordination.",
    stat: "Prep visibility",
    accent: "from-orange-300/35 via-amber-100/15 to-transparent",
  },
  {
    icon: <FaCheckCircle />,
    title: "Quality checks",
    description: "Support safer operations with repeatable checks and visibility.",
    stat: "Control points",
    accent: "from-teal-300/35 via-emerald-100/15 to-transparent",
  },
  {
    icon: <FaMoneyBillWave />,
    title: "Billing and finance",
    description: "Track payments, cost movement, and financial activity more clearly.",
    stat: "Money flow",
    accent: "from-amber-300/35 via-orange-100/15 to-transparent",
  },
  {
    icon: <FaChartBar />,
    title: "Analytics",
    description: "See trends across operations, performance, and business outcomes.",
    stat: "Decision view",
    accent: "from-blue-300/35 via-indigo-100/15 to-transparent",
  },
  {
    icon: <FaPlug />,
    title: "Platform integration",
    description: "Extend the system with connected tools and service integrations.",
    stat: "Future ready",
    accent: "from-rose-300/35 via-pink-100/15 to-transparent",
  },
];

const processSteps = [
  "Capture operations across departments",
  "Organize the workflow with shared visibility",
  "Turn daily activity into decisions with analytics",
];

const highlights = [
  {
    icon: <FaLayerGroup />,
    title: "Connected modules",
    description: "Every department works inside one operating layer instead of disconnected files, calls, and manual updates.",
  },
  {
    icon: <FaArrowRight />,
    title: "Faster action",
    description: "Teams can move from order, to kitchen, to inventory, to report with less delay and better visibility.",
  },
  {
    icon: <FaShieldAlt />,
    title: "Controlled growth",
    description: "As the restaurant scales, the structure stays readable, role-based, and easier for admins to manage.",
  },
];

const Services = () => {
  return (
    <PublicPageShell
      eyebrow="Services"
      title="A sharper services page for real restaurant operations"
      description="This upgraded layout presents the platform more professionally, with clearer service groups, stronger hierarchy, and a better visual rhythm."
    >
      <section className="grid gap-6">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2.2rem] border border-green-100 bg-[linear-gradient(155deg,_rgba(255,255,255,0.96),_rgba(240,253,244,0.9))] p-8 shadow-[0_30px_90px_-50px_rgba(21,128,61,0.38)]">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-green-600">
              Service Architecture
            </p>
            <h2 className="mt-5 max-w-3xl text-4xl font-black leading-tight text-green-950 md:text-5xl">
              Everything your restaurant team needs, arranged in one cleaner service experience
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-gray-600">
              The structure is now more premium and easier to scan. Users can quickly understand the system value across staff, kitchen, inventory, vendor flow, finance, and reporting.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {highlights.map(({ icon, title, description }) => (
                <article
                  key={title}
                  className="rounded-[1.6rem] border border-green-100 bg-white/90 p-5"
                >
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-lime-300 via-green-400 to-green-600 text-lg text-green-950 shadow-lg shadow-lime-100">
                    {icon}
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-green-950">{title}</h3>
                  <p className="mt-2 text-sm leading-7 text-gray-600">{description}</p>
                </article>
              ))}
            </div>
          </div>

          <motion.aside
            initial={{ opacity: 0, x: 28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="rounded-[2.2rem] border border-green-100 bg-[linear-gradient(180deg,_#052e16_0%,_#14532d_100%)] p-8 text-white shadow-2xl"
          >
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-lime-300 text-xl text-green-950 shadow-lg shadow-lime-200/40">
              <FaLeaf />
            </div>
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.2em] text-green-100/70">
              Operational Flow
            </p>
            <h3 className="mt-4 text-3xl font-bold leading-tight">
              From service floor to reporting, every layer stays connected
            </h3>
            <p className="mt-5 text-base leading-7 text-white/80">
              This section now explains the service journey with better structure, clearer focus, and a more polished premium look.
            </p>

            <div className="mt-8 space-y-4">
              {processSteps.map((step, index) => (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.15 + index * 0.08 }}
                  whileHover={{ x: 8 }}
                  className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime-300 text-sm font-bold text-green-950">
                    0{index + 1}
                  </div>
                  <p className="pt-1 text-sm leading-6 text-white/85">{step}</p>
                </motion.div>
              ))}
            </div>
          </motion.aside>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {services.map(({ icon, title, description, stat, accent }, index) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.45, delay: index * 0.05 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="group relative overflow-hidden rounded-[2rem] border border-green-100 bg-[linear-gradient(165deg,_rgba(255,255,255,0.95),_rgba(240,253,244,0.92))] p-6 shadow-lg backdrop-blur transition hover:shadow-[0_22px_60px_-28px_rgba(21,128,61,0.5)]"
            >
              <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-r ${accent}`} />
              <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-lime-300 via-green-400 to-green-600 text-2xl text-green-950 shadow-lg shadow-lime-100 transition duration-300 group-hover:scale-110 group-hover:rotate-3">
                {icon}
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-green-700/60">
                {stat}
              </p>
              <h3 className="mt-3 text-xl font-bold text-green-950">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-gray-600">{description}</p>
            </motion.article>
          ))}
        </div>
      </section>
    </PublicPageShell>
  );
};

export default Services;
