import React, { useEffect, useState } from "react";
import { FaMoon, FaSun } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";
import logoBlack from "../assets/Images/Logo_black.png";
import logoWhite from "../assets/Images/Logo_white.png";

const navLinks = [
  { to: "/", label: "Home", sectionId: "hero" },
  { to: "/#services", label: "Services", sectionId: "services" },
  { to: "/#subscription", label: "Subscription", sectionId: "subscription" },
  { to: "/#about", label: "About", sectionId: "about" },
  { to: "/#contact", label: "Contact", sectionId: "contact" },
];

const getLastVisibleSection = (sectionIds) => {
  for (let index = sectionIds.length - 1; index >= 0; index -= 1) {
    const sectionId = sectionIds[index];
    const section = document.getElementById(sectionId);
    if (!section) continue;
    if (section.getBoundingClientRect().top <= 130) {
      return sectionId;
    }
  }

  return "hero";
};

const Header = ({ landingTheme, onLandingThemeToggle }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [user, setUser] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const isHomePage = location.pathname === "/";
  const showLandingThemeToggle =
    isHomePage && landingTheme && onLandingThemeToggle;
  const isLandingLight = landingTheme === "light";

  const dashboardRoutes = {
    admin: "/admin",
    manager: "/manager",
    vendor: "/vendor",
    superadmin: "/superadmin",
    chef: "/chef",
    cheif: "/chef",
    cleaner: "/cleaner",
    inventory_manager: "/inventorymanager",
    inventorymanager: "/inventorymanager",
    sucheif: "/sucheif",
    suchef: "/sucheif",
    waiter: "/waiter",
    accountant: "/accountant",
  };

  const displayName =
    user?.name ||
    user?.fullName ||
    user?.businessName ||
    user?.username ||
    user?.email?.split("@")?.[0] ||
    "";

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
        setUser(null);
      }
    }
  }, [location.pathname]);

  useEffect(() => {
    const sectionIds = navLinks.map((link) => link.sectionId);
    let animationFrameId = 0;

    const handleScroll = () => {
      if (animationFrameId) return;

      animationFrameId = window.requestAnimationFrame(() => {
        animationFrameId = 0;
        const nextIsScrolled = window.scrollY > 20;
        setIsScrolled((current) =>
          current === nextIsScrolled ? current : nextIsScrolled
        );

        if (!isHomePage) return;

        const currentSection = getLastVisibleSection(sectionIds);

        setActiveSection((current) =>
          current === currentSection ? current : currentSection
        );
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (animationFrameId) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isHomePage]);

  const handleDashboard = () => {
    if (!user || !user.role) return;
    const roleKey = String(user.role).trim().toLowerCase();
    navigate(dashboardRoutes[roleKey] || "/login");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setUser(null);
    navigate("/");
  };

  const scrollToSection = (sectionId) => {
    const target = document.getElementById(sectionId);
    if (!target) return false;

    const headerOffset = 96;
    const targetTop =
      target.getBoundingClientRect().top + window.scrollY - headerOffset;

    window.scrollTo({
      top: Math.max(targetTop, 0),
      behavior: "smooth",
    });

    setActiveSection(sectionId);
    window.history.pushState(
      null,
      "",
      sectionId === "hero" ? "/" : `/#${sectionId}`
    );

    return true;
  };

  const handleNavClick = (event, sectionId) => {
    if (!sectionId) return;

    if (isHomePage) {
      event.preventDefault();
      scrollToSection(sectionId);
    }

    setIsMenuOpen(false);
  };

  const navShellClass = isLandingLight
    ? "border-emerald-900/10 bg-white/82 text-emerald-950 shadow-[0_18px_48px_-28px_rgba(20,83,45,0.45)]"
    : "border-[#6fbd58]/32 bg-[#174914]/88 text-white shadow-[0_18px_48px_-28px_rgba(74,222,128,0.45)]";
  const loginButtonClass = isLandingLight
    ? "bg-[#f5b84b] text-[#271600] hover:bg-[#ffcf70]"
    : "bg-[#f5b84b] text-[#271600] hover:bg-[#ffcf70]";
  const headerTextClass = isLandingLight ? "text-emerald-950" : "text-white";

  return (
    <header className={`fixed top-0 z-50 w-full px-4 pt-2 transition-all duration-300 md:px-6 lg:px-8 lg:pt-2.5 ${isScrolled ? "backdrop-blur-sm" : ""}`}>
      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
          <Link
            to="/"
            className="flex min-w-[76px] flex-col items-center transition duration-300 hover:scale-[1.02] lg:min-w-[112px]"
          >
            <img
              src={isLandingLight ? logoBlack : logoWhite}
              alt="EFNBMMS"
              className="h-9 w-auto object-contain lg:h-10"
            />
          </Link>

          <nav className={`hidden min-w-0 items-center justify-self-center overflow-x-auto rounded-full border px-4 py-2 backdrop-blur-xl lg:flex lg:max-w-full lg:gap-2 lg:px-5 ${navShellClass}`}>
            {navLinks.map(({ to, label, sectionId }) => {
              const isActive = sectionId
                ? isHomePage && activeSection === sectionId
                : location.pathname === to;

              return (
                <Link
                  key={label}
                  to={to}
                  onClick={(event) => handleNavClick(event, sectionId)}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-sm font-semibold transition-all duration-300 lg:px-3 lg:text-base ${
                    isActive
                      ? "text-[#93d36c]"
                      : `${headerTextClass} hover:text-[#93d36c]`
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden shrink-0 items-center gap-2 lg:flex xl:gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                {displayName ? (
                  <span className={`max-w-[120px] truncate rounded-full border px-3 py-2.5 text-sm font-medium xl:max-w-[160px] xl:px-4 xl:py-3 ${isLandingLight ? "border-emerald-900/10 bg-white/75 text-emerald-950" : "border-white/10 bg-white/6 text-white/90"}`}>
                    {displayName}
                  </span>
                ) : null}
                <button
                  onClick={handleDashboard}
                  className="rounded-full bg-[#4ade80] px-4 py-2.5 text-sm font-semibold text-[#140d09] transition hover:brightness-110 xl:px-5 xl:py-3"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition xl:px-5 xl:py-3 ${
                    isLandingLight
                      ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                      : "border-red-400/25 bg-red-500/12 text-red-200 hover:bg-red-500/20"
                  }`}
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className={`landing-login-button rounded-full border px-4 py-2 text-sm font-semibold uppercase tracking-wide transition lg:px-5 lg:text-base ${loginButtonClass}`}
              >
                Login
              </button>
            )}

            {showLandingThemeToggle && (
              <button
                type="button"
                onClick={onLandingThemeToggle}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full border text-sm transition lg:h-10 lg:w-10 ${
                  isLandingLight
                    ? "border-emerald-900/10 bg-white/82 text-emerald-950 hover:bg-emerald-950 hover:text-white"
                    : "border-white/10 bg-white/12 text-white/85 hover:border-[#4ade80]/35 hover:text-[#4ade80]"
                }`}
                title={isLandingLight ? "Switch to dark mode" : "Switch to light mode"}
                aria-label={isLandingLight ? "Switch to dark mode" : "Switch to light mode"}
              >
                {isLandingLight ? <FaMoon /> : <FaSun />}
              </button>
            )}
          </div>

          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className={`rounded-full border p-2.5 transition hover:text-[#4ade80] lg:hidden ${
              isLandingLight
                ? "border-emerald-900/10 bg-white/80 text-emerald-950"
                : "border-white/10 bg-black/30 text-white"
            }`}
            aria-label="Toggle navigation"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

        <div
          className={`absolute right-0 top-17 w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-[1.6rem] border shadow-[0_18px_42px_-28px_rgba(15,23,42,0.38)] backdrop-blur-xl transition-all duration-500 lg:hidden ${
            isMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
          } ${isLandingLight ? "border-emerald-900/10 bg-white/90" : "border-white/10 bg-[#174914]/92"}`}
        >
          <nav className="px-3.5 py-3.5">
            <ul className="flex flex-col gap-2">
              {navLinks.map(({ to, label, sectionId }) => (
                <li key={label}>
                  <Link
                    to={to}
                    onClick={(event) => handleNavClick(event, sectionId)}
                    className={`block rounded-full border px-3.5 py-1.5 text-center text-[12.5px] font-medium transition ${
                      (sectionId
                        ? isHomePage && activeSection === sectionId
                        : location.pathname === to)
                        ? "border-[#4ade80]/40 bg-[#4ade80] text-[#140d09]"
                        : isLandingLight
                          ? "border-emerald-900/10 bg-white/60 text-emerald-950 hover:text-[#39a84a]"
                          : "border-white/8 bg-white/6 text-white/85 hover:text-[#4ade80]"
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
              <li>
                {showLandingThemeToggle && (
                  <button
                    type="button"
                    onClick={() => {
                      onLandingThemeToggle();
                      setIsMenuOpen(false);
                    }}
                    className={`mb-2 flex w-full items-center justify-center gap-2 rounded-full border px-3.5 py-1.5 text-center text-[12.5px] font-medium ${
                      isLandingLight
                        ? "border-emerald-900/10 bg-white/60 text-emerald-950"
                        : "border-white/8 bg-white/6 text-white/85"
                    }`}
                  >
                    {isLandingLight ? <FaMoon /> : <FaSun />}
                    {isLandingLight ? "Dark Mode" : "Light Mode"}
                  </button>
                )}
                {user ? (
                  <div className="flex flex-col gap-2">
                    {displayName ? (
                      <span
                        className={`rounded-full border px-3.5 py-1.5 text-center text-[12.5px] font-medium ${
                          isLandingLight
                            ? "border-emerald-900/10 bg-white/60 text-emerald-950"
                            : "border-white/10 bg-white/6 text-white/90"
                        }`}
                      >
                        {displayName}
                      </span>
                    ) : null}
                    <button
                      onClick={handleDashboard}
                      className="rounded-full bg-[#4ade80] px-3.5 py-1.5 text-[12.5px] font-semibold text-[#140d09]"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={handleLogout}
                      className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold ${
                        isLandingLight
                          ? "border-red-200 bg-red-50 text-red-700"
                          : "border-red-400/25 bg-red-500/12 text-red-200"
                      }`}
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      navigate("/login");
                    }}
                    className={`landing-login-button w-full rounded-full border px-4 py-2 text-[12.5px] font-semibold uppercase tracking-[0.1em] ${
                      isLandingLight
                        ? "bg-emerald-950 text-white"
                        : "bg-white/80 text-[#174914]"
                    }`}
                  >
                    Login
                  </button>
                )}
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
