import React from "react";
import { motion } from "framer-motion";
import { FaArrowRight, FaPlay } from "react-icons/fa";
import tableImage from "../assets/Images/resturent.jpg";

const floatingTags = [
  { label: "Fresh", top: "10%", left: "12%" },
  { label: "Fast", top: "58%", left: "14%" },
  { label: "Smart", top: "22%", right: "8%" },
];

const Hero = () => {
  return (
    <section id="hero" className="relative overflow-hidden px-4 pt-28 md:px-8 md:pt-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(132,204,22,0.1),_transparent_24%),radial-gradient(circle_at_left_bottom,_rgba(74,222,128,0.14),_transparent_24%)]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[2.4rem] border border-white/10 bg-[#130d0a] shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_0_55px_rgba(255,255,255,0.18)]">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-22"
            style={{ backgroundImage: `url(${tableImage})` }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(19,13,10,0.95)_0%,rgba(19,13,10,0.78)_45%,rgba(19,13,10,0.92)_100%)]" />

          <div className="absolute -left-10 bottom-0 h-56 w-56 rounded-full bg-lime-400/15 blur-3xl" />
          <div className="absolute right-10 top-10 h-48 w-48 rounded-full bg-green-300/12 blur-3xl" />

          <div className="relative grid min-h-[780px] gap-10 px-8 py-12 lg:grid-cols-[0.92fr_1.08fr] lg:px-16 lg:py-16">
            <div className="flex flex-col justify-center pt-6 lg:pt-14">
              <div className="mb-8 flex items-center gap-3 text-white/55">
                <div className="h-24 w-px bg-gradient-to-b from-transparent via-white/55 to-transparent" />
                <div className="space-y-3 text-xs uppercase tracking-[0.35em]">
                  <p>Fresh</p>
                  <p>Fast</p>
                  <p>Premium</p>
                </div>
              </div>

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="font-serif text-2xl italic text-lime-300 md:text-3xl"
              >
                Smart ERP Solution
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.1 }}
                className="mt-4 max-w-xl text-5xl font-black leading-[0.96] text-white md:text-7xl"
              >
                <span className="text-lime-300">Streamline</span> Your Restaurant Operations
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.18 }}
                className="mt-6 max-w-lg text-base leading-8 text-white/72 md:text-lg"
              >
                Tailored for food and beverage excellence. Automate tasks, manage teams, and gain insights all in one platform.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.65, delay: 0.28 }}
                className="mt-10 flex flex-col gap-4 sm:flex-row"
              >
                <a
                  href="#services"
                  className="inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-lime-300 to-green-500 px-8 py-4 text-base font-bold text-[#140d09] shadow-[0_14px_35px_-18px_rgba(132,204,22,0.85)] transition hover:-translate-y-1"
                >
                  Explore Services
                  <FaArrowRight className="text-sm" />
                </a>
                <a
                  href="#contact"
                  className="inline-flex items-center justify-center gap-3 rounded-full border border-white/12 bg-white/6 px-8 py-4 text-base font-semibold text-white/90 backdrop-blur transition hover:border-lime-300/40 hover:text-lime-300"
                >
                  <FaPlay className="text-xs" />
                  Contact Us
                </a>
              </motion.div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="relative flex h-[520px] w-full max-w-[620px] items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
                  className="absolute h-[430px] w-[430px] rounded-full border border-white/35"
                >
                  <span className="absolute left-6 top-24 h-4 w-4 rounded-full bg-lime-300 shadow-[0_0_25px_rgba(132,204,22,0.85)]" />
                  <span className="absolute bottom-16 right-14 h-3 w-3 rounded-full bg-lime-300 shadow-[0_0_25px_rgba(132,204,22,0.85)]" />
                </motion.div>

                <motion.div
                  animate={{ y: [0, -12, 0] }}
                  transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-10"
                >
                  <div className="absolute -bottom-7 left-12 h-40 w-40 rounded-[50%] bg-lime-400/60 blur-2xl" />
                  <div className="absolute -bottom-3 right-8 h-32 w-32 rounded-[50%] bg-lime-300/45 blur-2xl" />
                  <img
                    src={tableImage}
                    alt="Food presentation"
                    className="h-[380px] w-[380px] rounded-full border-8 border-white/92 object-cover shadow-[0_30px_70px_-28px_rgba(0,0,0,0.9)] md:h-[430px] md:w-[430px]"
                  />
                </motion.div>

                {floatingTags.map((tag) => (
                  <div
                    key={tag.label}
                    className="absolute rounded-full border border-white/12 bg-[#1f1713]/80 px-4 py-2 text-sm font-semibold tracking-[0.2em] text-lime-300 backdrop-blur"
                    style={tag}
                  >
                    {tag.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
