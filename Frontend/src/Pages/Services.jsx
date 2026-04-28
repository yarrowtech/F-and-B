import React from "react";
import { motion } from "framer-motion";
import {
  FaBoxes,
  FaChartBar,
  FaCheckCircle,
  FaMoneyBillWave,
  FaPlug,
  FaTasks,
  FaTruckLoading,
  FaUsers,
  FaUtensils,
} from "react-icons/fa";
import PublicPageShell from "../components/PublicPageShell";

void motion;

const services = [
  { icon: <FaUsers />, title: "User management", description: "Role-based access and multi-location structure for operational control." },
  { icon: <FaUtensils />, title: "Menu and recipe flow", description: "Keep recipes, item costs, and updates visible in one place." },
  { icon: <FaBoxes />, title: "Inventory control", description: "Monitor stock, prevent shortages, and act before waste grows." },
  { icon: <FaTruckLoading />, title: "Vendor tracking", description: "Coordinate suppliers, procurement, and incoming stock with less friction." },
  { icon: <FaTasks />, title: "Kitchen execution", description: "Turn orders into clear prep workflows and team coordination." },
  { icon: <FaCheckCircle />, title: "Quality checks", description: "Support safer operations with repeatable checks and visibility." },
  { icon: <FaMoneyBillWave />, title: "Billing and finance", description: "Track payments, cost movement, and financial activity more clearly." },
  { icon: <FaChartBar />, title: "Analytics", description: "See trends across operations, performance, and business outcomes." },
  { icon: <FaPlug />, title: "Platform integration", description: "Extend the system with connected tools and service integrations." },
];

const processSteps = [
  "Capture operations across departments",
  "Organize the workflow with shared visibility",
  "Turn daily activity into decisions with analytics",
];

const Services = () => {
  return (
    <PublicPageShell
      eyebrow="Services"
      title="A service stack built around restaurant momentum"
      description="The UI is updated to feel more premium and structured, while keeping the same familiar green identity across the landing pages."
    >
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3 lg:col-span-1">
          {services.map(({ icon, title, description }, index) => (
            <motion.article
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.45, delay: index * 0.05 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="group rounded-[2rem] border border-green-100 bg-[linear-gradient(165deg,_rgba(255,255,255,0.95),_rgba(240,253,244,0.92))] p-6 shadow-lg backdrop-blur transition hover:shadow-[0_22px_60px_-28px_rgba(21,128,61,0.5)]"
            >
              <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-lime-300 via-green-400 to-green-600 text-2xl text-green-950 shadow-lg shadow-lime-100 transition duration-300 group-hover:scale-110 group-hover:rotate-3">
                {icon}
              </div>
              <h3 className="text-xl font-bold text-green-950">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-gray-600">{description}</p>
            </motion.article>
          ))}
        </div>

        <motion.aside
          initial={{ opacity: 0, x: 28 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="rounded-[2rem] border border-green-100 bg-[linear-gradient(180deg,_#052e16_0%,_#14532d_100%)] p-8 text-white shadow-2xl"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-green-100/70">
            Flow
          </p>
          <h3 className="mt-4 text-3xl font-bold leading-tight">
            From service floor to reporting, every layer stays connected
          </h3>
          <p className="mt-5 text-base leading-7 text-white/80">
            The refreshed UI makes the service story easier to scan. Users can understand the platform at a glance without losing the brand color language.
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
      </section>
    </PublicPageShell>
  );
};

export default Services;
