import React from "react";
import { AiOutlineHome } from "react-icons/ai";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const PublicPageShell = ({ eyebrow, title, description, children }) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(163,230,53,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.16),_transparent_30%),linear-gradient(180deg,_#f7fee7_0%,_#ffffff_42%,_#ecfdf5_100%)] text-gray-900">
      <motion.div
        animate={{ y: [0, -18, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute left-[-4rem] top-24 h-56 w-56 rounded-full bg-lime-200/60 blur-3xl"
      />
      <motion.div
        animate={{ y: [0, 22, 0], x: [0, -10, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        className="absolute right-[-5rem] top-10 h-72 w-72 rounded-full bg-green-200/60 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-6 py-8 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="mb-12 flex items-center justify-between rounded-full border border-white/60 bg-white/70 px-5 py-3 shadow-lg backdrop-blur"
        >
          <Link
            to="/"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-green-900 text-white transition hover:scale-105 hover:bg-green-800"
            aria-label="Back to home"
          >
            <AiOutlineHome className="text-xl" />
          </Link>

          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-green-700/70">
              {eyebrow}
            </p>
            <h1 className="text-lg font-bold text-green-950 md:text-xl">{title}</h1>
          </div>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12, ease: "easeOut" }}
          className="mb-14 max-w-3xl"
        >
          <span className="inline-flex rounded-full border border-green-200 bg-white/80 px-4 py-1 text-sm font-semibold text-green-700 shadow-sm shadow-lime-100">
            {eyebrow}
          </span>
          <h2 className="mt-5 bg-gradient-to-r from-green-950 via-green-800 to-lime-700 bg-clip-text text-4xl font-extrabold leading-tight text-transparent md:text-6xl">
            {title}
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-600">
            {description}
          </p>
        </motion.section>

        {children}
      </div>
    </div>
  );
};

export default PublicPageShell;
