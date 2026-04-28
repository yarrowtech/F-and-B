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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);

      if (!isHomePage) return;

      const currentSection =
        sectionIds.findLast((sectionId) => {
          const section = document.getElementById(sectionId);
          if (!section) return false;
          return section.getBoundingClientRect().top <= 130;
        }) || "hero";

      setActiveSection(currentSection);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
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

  const shellClass = isScrolled
    ? "border-[#4ade80]/20 bg-[#17100d]/88 shadow-[0_18px_50px_-24px_rgba(74,222,128,0.3)] backdrop-blur-xl"
    : "border-white/10 bg-[#120d0b]/72 backdrop-blur-md";

  return (
    <header className="fixed top-0 z-50 w-full px-4 pt-4 md:px-8">
      <div className={`mx-auto max-w-7xl rounded-full border ${shellClass} transition-all duration-300`}>
        <div className="flex h-16 items-center justify-between px-5 md:px-7">
          <Link
            to="/"
            className="flex items-center gap-3 transition duration-300 hover:scale-[1.02]"
          >
            <div className="grid h-11 w-11 place-items-center rounded-full bg-[#4ade80] font-bold text-[#140d09] shadow-[0_0_35px_rgba(74,222,128,0.35)]">
              F
            </div>
            <div className="leading-none">
              <span className="block text-lg font-black tracking-wide text-white">
                EF<span className="text-[#4ade80]">&amp;</span>B-M
              </span>
              <span className="text-[10px] uppercase tracking-[0.28em] text-white/45">
                Restaurant ERP
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {navLinks.map(({ to, label, sectionId }) => {
              const isActive = isHomePage && activeSection === sectionId;

              return (
                <Link
                  key={label}
                  to={to}
                  onClick={(event) => handleNavClick(event, sectionId)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? "bg-[#4ade80] text-[#140d09] shadow-[0_0_30px_rgba(74,222,128,0.35)]"
                      : "text-white/78 hover:bg-white/8 hover:text-[#4ade80]"
                  }`}
                >
                  {label}
                </Link>
              );
            })}

            {user ? (
              <div className="ml-3 flex items-center gap-2">
                {displayName ? (
                  <span className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white/90">
                    {displayName}
                  </span>
                ) : null}
                <button
                  onClick={handleDashboard}
                  className="rounded-full bg-[#4ade80] px-4 py-2 text-sm font-semibold text-[#140d09] transition hover:brightness-110"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="rounded-full border border-red-400/25 bg-red-500/12 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/20"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="ml-3 rounded-full border border-[#4ade80]/35 bg-[#4ade80]/10 px-5 py-2 text-sm font-semibold text-[#4ade80] transition hover:bg-[#4ade80] hover:text-[#140d09]"
              >
                Login
              </button>
            )}

            {showLandingThemeToggle && (
              <button
                type="button"
                onClick={onLandingThemeToggle}
                className="ml-1 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/85 transition hover:border-[#4ade80]/35 hover:text-[#4ade80]"
                title={isLandingLight ? "Switch to dark mode" : "Switch to light mode"}
                aria-label={isLandingLight ? "Switch to dark mode" : "Switch to light mode"}
              >
                {isLandingLight ? <FaMoon /> : <FaSun />}
              </button>
            )}
          </nav>

          <button
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className="text-white transition hover:text-[#4ade80] md:hidden"
          >
            <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        <div
          className={`overflow-hidden transition-all duration-500 md:hidden ${
            isMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <nav className="border-t border-white/10 px-5 py-5">
            <ul className="flex flex-col gap-3">
              {navLinks.map(({ to, label, sectionId }) => (
                <li key={label}>
                  <Link
                    to={to}
                    onClick={(event) => handleNavClick(event, sectionId)}
                    className={`block rounded-full border px-4 py-2 text-center text-sm transition ${
                      isHomePage && activeSection === sectionId
                        ? "border-[#4ade80]/40 bg-[#4ade80] text-[#140d09]"
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
                    className="mb-3 flex w-full items-center justify-center gap-2 rounded-full border border-white/8 bg-white/6 px-4 py-2 text-center text-sm font-semibold text-white/85"
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
                      className="rounded-full border border-red-400/25 bg-red-500/12 px-4 py-2 text-sm font-semibold text-red-200"
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
                    className="w-full rounded-full border border-[#4ade80]/35 bg-[#4ade80]/10 px-5 py-2 text-sm font-semibold text-[#4ade80]"
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
