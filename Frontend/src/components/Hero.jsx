import React from "react";

const heroStats = [
  { value: "20+", label: "Restaurants" },
  { value: "8+", label: "Services" },
  { value: "12+", label: "Brands" },
  { value: "22+", label: "Countries" },
];

const Hero = () => {
  return (
    <section
      id="hero"
      className="hero-landing relative min-h-screen overflow-hidden px-5 pt-24 md:px-10 lg:px-20"
    >
      <img
        src="/images/cabage.png"
        alt="Fresh cabbage"
        className="absolute inset-0 h-full w-full -scale-x-100 object-cover object-center opacity-45 md:opacity-55 lg:inset-y-0 lg:left-auto lg:-right-[6%] lg:w-[64%] lg:object-contain lg:object-right lg:opacity-100 xl:-right-[5%] xl:w-[60%]"
        fetchPriority="high"
        decoding="async"
      />
      <div className="hero-image-overlay absolute inset-0" />
      <div className="hero-bottom-shade absolute inset-x-0 bottom-0 h-[32vh]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-6rem)] max-w-7xl flex-col justify-center pb-48 pt-8 sm:pb-40 lg:pt-2">
        <div className="max-w-[40rem]">
          <p className="hero-reveal hero-kicker text-lg font-bold text-white sm:text-xl md:text-2xl">
            Smart ERP solution
          </p>
          <h1
            className="hero-reveal hero-title mt-5 max-w-4xl text-5xl font-black leading-[0.96] text-[#68b957] sm:text-6xl md:text-7xl lg:text-[5.8rem]"
            style={{ animationDelay: "80ms" }}
          >
            Streamline your restaurant
          </h1>
          <p
            className="hero-reveal hero-copy mt-6 max-w-2xl text-base leading-7 text-white/76 sm:text-lg md:text-xl md:leading-8"
            style={{ animationDelay: "140ms" }}
          >
            Manage orders, teams, inventory, vendors, billing, and reporting from one connected food and beverage platform.
          </p>
          <a
            href="#services"
            className="hero-reveal hero-cta mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-[#f5b84b] px-8 text-base font-bold text-[#271600] shadow-[0_18px_42px_-22px_rgba(245,184,75,0.9)] transition hover:-translate-y-1 hover:bg-[#ffcf70] md:min-h-14 md:px-10 md:text-lg"
            style={{ animationDelay: "200ms" }}
          >
            Explore services
          </a>
        </div>

        <div className="absolute bottom-9 left-0 right-0 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4 md:bottom-12">
          {heroStats.map(({ value, label }) => (
            <div key={label} className="min-w-0">
              <p className="hero-stat-value text-3xl font-black leading-none text-white/82 sm:text-4xl md:text-5xl">
                {value}
              </p>
              <p className="hero-stat-label mt-1.5 text-base font-bold text-white sm:text-lg md:text-xl">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
