import React from "react";
import { FaLeaf, FaLightbulb, FaPeopleCarry, FaShieldAlt } from "react-icons/fa";
import { motion } from "framer-motion";
import PublicPageShell from "../components/PublicPageShell";
import aboutImage from "../assets/Images/about.jpg";

const highlights = [
  {
    title: "Operational clarity",
    description: "One platform for staff, kitchen, stock, and day-to-day decisions.",
    icon: <FaLightbulb />,
  },
  {
    title: "Team coordination",
    description: "Clear role visibility and smoother communication across departments.",
    icon: <FaPeopleCarry />,
  },
  {
    title: "Sustainable control",
    description: "Reduce waste with better inventory awareness and planning discipline.",
    icon: <FaLeaf />,
  },
  {
    title: "Reliable oversight",
    description: "Build accountability with trackable processes and stronger reporting.",
    icon: <FaShieldAlt />,
  },
];

const storyCards = [
  {
    title: "Why we built it",
    text: "Restaurant teams often jump across disconnected tools. We designed one operating system that brings the work together.",
  },
  {
    title: "What we believe",
    text: "Great hospitality runs on both people and process. Technology should support both without adding noise.",
  },
  {
    title: "Where it helps most",
    text: "From fast-moving kitchens to management reporting, the platform helps teams stay organized and responsive.",
  },
];

const About = () => {
  return (
    <PublicPageShell
      eyebrow="About"
      title="A cleaner, smarter way to run restaurant operations"
      description="This platform is built for restaurants that want the same green brand identity with a more modern, structured experience across every public page."
    >
      <section className="grid gap-8 lg:grid-cols-[1fr_0.95fr]">
        <motion.div
          initial={{ opacity: 0, x: -32 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="rounded-[2rem] border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            {highlights.map(({ title, description, icon }, index) => (
              <motion.article
                key={title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                whileHover={{ y: -10, rotateX: 2, rotateY: -2 }}
                className="rounded-3xl border border-green-100 bg-[linear-gradient(145deg,_rgba(255,255,255,0.96),_rgba(236,253,245,0.92))] p-6 shadow-sm ring-1 ring-white/70 transition hover:shadow-[0_22px_60px_-24px_rgba(21,128,61,0.45)]"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-green-950 to-green-700 text-lg text-white shadow-lg shadow-green-200/70">
                  {icon}
                </div>
                <h3 className="text-xl font-bold text-green-950">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-gray-600">{description}</p>
              </motion.article>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 32, scale: 0.96 }}
          whileInView={{ opacity: 1, x: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[2rem] border border-green-100 bg-green-950 p-4 shadow-2xl"
        >
          <motion.img
            src={aboutImage}
            alt="Restaurant technology"
            className="h-full min-h-[420px] w-full rounded-[1.5rem] object-cover opacity-90"
            loading="lazy"
            whileHover={{ scale: 1.04 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="absolute inset-x-8 bottom-8 rounded-[1.5rem] border border-white/15 bg-white/10 p-6 text-white backdrop-blur"
          >
            <p className="text-sm uppercase tracking-[0.2em] text-green-100/70">
              Built for modern hospitality
            </p>
            <p className="mt-3 text-lg leading-7 text-white/90">
              A single platform that keeps service, supply, and reporting aligned as the business grows.
            </p>
          </motion.div>
        </motion.div>
      </section>

      <section className="mt-14 grid gap-6 md:grid-cols-3">
        {storyCards.map(({ title, text }, index) => (
          <motion.article
            key={title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, delay: index * 0.1 }}
            whileHover={{ y: -8 }}
            className="rounded-[2rem] border border-green-100 bg-white/80 p-8 shadow-lg backdrop-blur transition hover:shadow-[0_18px_50px_-24px_rgba(21,128,61,0.45)]"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-green-700/70">
              Story
            </p>
            <h3 className="mt-4 text-2xl font-bold text-green-950">{title}</h3>
            <p className="mt-4 text-sm leading-7 text-gray-600">{text}</p>
          </motion.article>
        ))}
      </section>
    </PublicPageShell>
  );
};

export default About;
