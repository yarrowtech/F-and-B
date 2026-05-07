import React from "react";
import { AiOutlineHome } from "react-icons/ai";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

void motion;

const PublicPageShell = ({ eyebrow, title, description, children }) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(163,230,53,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.16),_transparent_30%),linear-gradient(180deg,_#f7fee7_0%,_#ffffff_42%,_#ecfdf5_100%)] text-gray-900 dark:bg-[radial-gradient(circle_at_top_left,_rgba(74,222,128,0.12),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.12),_transparent_30%),linear-gradient(180deg,_#080d08_0%,_#10170f_48%,_#071007_100%)] dark:text-white">
      <motion.div
        animate={{ y: [0, -18, 0], scale: [1, 1.06, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[-4rem] top-24 h-56 w-56 rounded-full bg-lime-200/60 blur-3xl dark:bg-green-500/10"
      />
      <motion.div
        animate={{ y: [0, 22, 0], x: [0, -10, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
          className="absolute right-[-5rem] top-10 h-72 w-72 rounded-full bg-green-200/60 blur-3xl dark:bg-lime-400/10"
      />

      <div className="relative mx-auto max-w-7xl px-6 py-8 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="mb-12 flex items-center justify-between rounded-full border border-white/60 bg-white/70 px-5 py-3 shadow-lg backdrop-blur dark:border-white/10 dark:bg-white/8"
        >
          <Link
            to="/"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-green-900 text-white transition hover:scale-105 hover:bg-green-800 dark:bg-[#6fbd58] dark:text-[#061006]"
            aria-label="Back to home"
          >
            <AiOutlineHome className="text-xl" />
          </Link>

          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-green-700/70 dark:text-[#8bd96f]">
              {eyebrow}
            </p>
            <h1 className="text-lg font-bold text-green-950 dark:text-white md:text-xl">{title}</h1>
          </div>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12, ease: "easeOut" }}
          className="mb-14 max-w-3xl"
        >
          <span className="inline-flex rounded-full border border-green-200 bg-white/80 px-4 py-1 text-sm font-semibold text-green-700 shadow-sm shadow-lime-100 dark:border-[#6fbd58]/25 dark:bg-[#6fbd58]/10 dark:text-[#8bd96f] dark:shadow-none">
            {eyebrow}
          </span>
          <h2 className="mt-5 bg-gradient-to-r from-green-950 via-green-800 to-lime-700 bg-clip-text text-4xl font-extrabold leading-tight text-transparent dark:from-white dark:via-[#8bd96f] dark:to-[#6fbd58] md:text-6xl">
            {title}
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-600 dark:text-white/66">
            {description}
          </p>
        </motion.section>

        {children}
      </div>
    </div>
  );
};

export default PublicPageShell;
