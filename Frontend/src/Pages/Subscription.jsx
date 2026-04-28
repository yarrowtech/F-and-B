import React from "react";
import { motion } from "framer-motion";
import PublicPageShell from "../components/PublicPageShell";

void motion;

const plansAdmin = [
  { name: "Basic", price: "Rs 1499/mo", features: ["Manage menu", "Order tracking", "Basic analytics"] },
  { name: "Pro", price: "Rs 2499/mo", features: ["Advanced reporting", "Inventory management", "Priority support"] },
  { name: "Enterprise", price: "Rs 3499/mo", features: ["Multi-branch support", "Custom solutions", "Dedicated manager"] },
];

const plansVendor = [
  { name: "Starter", price: "Rs 499/mo", features: ["List products", "Basic dashboard", "Standard support"] },
  { name: "Growth", price: "Rs 999/mo", features: ["Inventory sync", "Bulk orders", "Analytics reports"] },
  { name: "Premium", price: "Rs 1499/mo", features: ["Full integration", "Priority leads", "Dedicated account manager"] },
];

const PlanCard = ({ name, price, features, accent, delay = 0 }) => (
  <motion.article
    initial={{ opacity: 0, y: 26 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.45, delay }}
    whileHover={{ y: -10, scale: 1.015 }}
    className="rounded-[2rem] border border-green-100 bg-[linear-gradient(160deg,_rgba(255,255,255,0.96),_rgba(240,253,244,0.94))] p-7 shadow-xl backdrop-blur transition hover:shadow-[0_22px_60px_-28px_rgba(21,128,61,0.5)]"
  >
    <div className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${accent}`}>
      Plan
    </div>
    <h3 className="mt-5 text-3xl font-bold text-green-950">{name}</h3>
    <p className="mt-3 text-2xl font-semibold text-green-700">{price}</p>
    <ul className="mt-6 space-y-3">
      {features.map((feature) => (
        <li key={feature} className="flex items-start gap-3 text-sm text-gray-700">
          <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-lime-200 text-xs font-bold text-green-950">
            +
          </span>
          <span>{feature}</span>
        </li>
      ))}
    </ul>
    <button className="mt-8 w-full rounded-full bg-green-900 px-5 py-3 font-semibold text-white transition hover:-translate-y-1 hover:bg-green-800">
      Get Started
    </button>
  </motion.article>
);

const SubscriptionPage = () => {
  return (
    <PublicPageShell
      eyebrow="Subscription"
      title="Pricing that stays easy to understand"
      description="The subscription page now uses the same updated visual language as the rest of the landing experience while keeping your existing green palette."
    >
      <section className="space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.55 }}
          className="rounded-[2rem] border border-green-100 bg-[linear-gradient(180deg,_#052e16_0%,_#166534_100%)] p-8 text-white shadow-2xl"
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-green-100/70">
                Flexible pricing
              </p>
              <h3 className="mt-4 text-3xl font-bold">Plans for restaurant owners and supply partners</h3>
            </div>
            <p className="text-base leading-7 text-white/80">
              Pick the structure that matches your workflow today and expand later as your operations become more complex.
            </p>
          </div>
        </motion.div>

        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700/70">
                Restaurant owners
              </p>
              <h3 className="mt-2 text-3xl font-bold text-green-950">Core operations plans</h3>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {plansAdmin.map((plan, index) => (
              <PlanCard
                key={plan.name}
                {...plan}
                delay={index * 0.08}
                accent={index === 1 ? "bg-lime-200 text-green-950" : "bg-green-100 text-green-800"}
              />
            ))}
          </div>
        </section>

        <section>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700/70">
                Vendors and suppliers
              </p>
              <h3 className="mt-2 text-3xl font-bold text-green-950">Growth-focused plans</h3>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {plansVendor.map((plan, index) => (
              <PlanCard
                key={plan.name}
                {...plan}
                delay={index * 0.08}
                accent={index === 2 ? "bg-lime-200 text-green-950" : "bg-green-100 text-green-800"}
              />
            ))}
          </div>
        </section>
      </section>
    </PublicPageShell>
  );
};

export default SubscriptionPage;
