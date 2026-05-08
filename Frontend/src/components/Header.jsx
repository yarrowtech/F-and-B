import React, { useEffect, useState } from "react";
import { FaMoon, FaSun } from "react-icons/fa";
import { Link, useLocation, useNavigate } from "react-router-dom";

const navLinks = [
  { to: "/", label: "Home", sectionId: "hero" },
  { to: "/#services", label: "Services", sectionId: "services" },
  { to: "/#about", label: "About", sectionId: "about" },
  { to: "/#contact", label: "Contact", sectionId: "contact" },
];

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

        const currentSection =
          sectionIds.findLast((sectionId) => {
            const section = document.getElementById(sectionId);
            if (!section) return false;
            return section.getBoundingClientRect().top <= 130;
          }) || "hero";

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
    <header className={`fixed top-0 z-50 w-full px-4 pt-3 transition-all duration-300 md:px-6 lg:px-8 lg:pt-4 ${isScrolled ? "backdrop-blur-sm" : ""}`}>
      <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link
            to="/"
            className="flex min-w-[86px] flex-col items-center transition duration-300 hover:scale-[1.02] lg:min-w-[128px]"
          >
            <span className="mb-1 h-9 w-9 rounded-full bg-[#6fbd58] shadow-[0_0_30px_rgba(111,189,88,0.3)] lg:h-11 lg:w-11" />
            <span className="leading-none">
              <span className="block text-xl font-black tracking-wide text-[#7fc84f] lg:text-2xl">
                EFNBM
              </span>
            </span>
          </Link>

          <nav className={`absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 rounded-full border px-4 py-2.5 backdrop-blur-xl lg:flex lg:gap-2 lg:px-6 ${navShellClass}`}>
            {navLinks.map(({ to, label, sectionId }) => {
              const isActive = isHomePage && activeSection === sectionId;

              return (
                <Link
                  key={label}
                  to={to}
                  onClick={(event) => handleNavClick(event, sectionId)}
                  className={`rounded-full px-2.5 py-1 text-base font-semibold transition-all duration-300 lg:px-3 lg:text-lg ${
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

          <div className="hidden items-center gap-2 lg:flex xl:gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                {displayName ? (
                  <span className={`max-w-[150px] truncate rounded-full border px-3 py-2.5 text-sm font-medium xl:max-w-[180px] xl:px-4 xl:py-3 ${isLandingLight ? "border-emerald-900/10 bg-white/75 text-emerald-950" : "border-white/10 bg-white/6 text-white/90"}`}>
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
                className={`landing-login-button rounded-full border px-5 py-2.5 text-base font-semibold uppercase tracking-wide transition lg:px-6 lg:text-lg ${loginButtonClass}`}
              >
                Login
              </button>
            )}

            {showLandingThemeToggle && (
              <button
                type="button"
                onClick={onLandingThemeToggle}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full border text-sm transition lg:h-11 lg:w-11 ${
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
          className={`absolute left-4 right-4 top-20 overflow-hidden rounded-3xl border backdrop-blur-xl transition-all duration-500 lg:hidden ${
            isMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
          } ${isLandingLight ? "border-emerald-900/10 bg-white/90" : "border-white/10 bg-[#174914]/92"}`}
        >
          <nav className="px-5 py-5">
            <ul className="flex flex-col gap-3">
              {navLinks.map(({ to, label, sectionId }) => (
                <li key={label}>
                  <Link
                    to={to}
                    onClick={(event) => handleNavClick(event, sectionId)}
                    className={`block rounded-full border px-4 py-2 text-center text-sm transition ${
                      isHomePage && activeSection === sectionId
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
                    className={`mb-3 flex w-full items-center justify-center gap-2 rounded-full border px-4 py-2 text-center text-sm font-semibold ${
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
                      <span className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-center text-sm font-medium text-white/90">
                        {displayName}
                      </span>
                    ) : null}
                    <button
                      onClick={handleDashboard}
                      className="rounded-full bg-[#4ade80] px-4 py-2 text-sm font-semibold text-[#140d09]"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={handleLogout}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold ${
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
                    className={`landing-login-button w-full rounded-full border px-5 py-3 text-sm font-semibold uppercase ${
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
