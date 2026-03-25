import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";


const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoginOpenDesktop, setIsLoginOpenDesktop] = useState(false);
  const [isLoginOpenMobile, setIsLoginOpenMobile] = useState(false);
  const [user, setUser] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const desktopRef = useRef(null);
  const mobileRef = useRef(null);

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/services", label: "Services" },
    { to: "/subscription", label: "Subscription" },
    { to: "/contact", label: "Contact" },
    { to: "/about", label: "About" },
  ];

  const loginLinks = [
    { to: "/superadmin-login", label: "Super Admin" },
    { to: "/admin-login", label: "Admin" },
    { to: "/vendor-login", label: "Vendor" },
    { to: "/department", label: "Department" },
  ];

  const dashboardRoutes = {
    admin: "/admin",
    manager: "/manager",
    vendor: "/vendor",
    superadmin: "/superadmin",
    cheif: "/cheif",
    cleaner: "/cleaner",
    inventoryManager: "/inventorymanager",
    sucheif: "/sucheif",
    waiter: "/waiter",
    accountant: "/accountant",
  };

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!desktopRef.current?.contains(e.target)) setIsLoginOpenDesktop(false);
      if (!mobileRef.current?.contains(e.target)) setIsLoginOpenMobile(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDashboard = () => {
    if (user && user.role && dashboardRoutes[user.role]) {
      navigate(dashboardRoutes[user.role]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? "backdrop-blur-lg bg-white/80 shadow-md"
          : "backdrop-blur-md bg-white/50"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          onClick={() => {
            setIsLoginOpenDesktop(false);
            setIsLoginOpenMobile(false);
          }}
          className="flex items-center gap-3 transform transition duration-300 hover:scale-105"
        >
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-lime-400 to-green-400 text-white font-bold grid place-items-center shadow-md">
            F&B
          </div>
          <span className="text-lg font-extrabold text-gray-800 tracking-wide">
            Food & Beverage
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-4 font-medium" ref={desktopRef}>
          {navLinks.map(({ to, label }) => {
            const isActive = location.pathname.startsWith(to) && to !== "/";
            return (
              <Link
                key={label}
                to={to}
                className={`px-4 py-2 rounded-full transition-all duration-300 ${
                  isActive
                    ? "bg-lime-400 text-white shadow-lg"
                    : "bg-white text-gray-800 hover:bg-lime-100 hover:text-lime-600"
                }`}
              >
                {label}
              </Link>
            );
          })}

          {/* Desktop Login / User */}
          <div className="relative">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="ml-4 px-6 py-2 rounded-full text-white font-medium bg-gradient-to-r from-lime-400 to-green-400 shadow-md">
                  {user.name}
                </span>
                <button
                  onClick={handleDashboard}
                  className="ml-2 px-3 py-2 rounded-full text-white font-medium bg-blue-500 hover:bg-blue-600 transition"
                >
                  Dashboard
                </button>
                <button
                  onClick={handleLogout}
                  className="ml-2 px-3 py-2 rounded-full text-white font-medium bg-red-500 hover:bg-red-600 transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setIsLoginOpenDesktop((prev) => !prev)}
                  className="ml-4 px-6 py-2 rounded-full text-white font-medium transition-all duration-300 hover:scale-105 bg-gradient-to-r from-lime-400 to-green-400 shadow-md hover:shadow-lg"
                >
                  Login
                </button>
                <ul
                  className={`absolute right-0 mt-3 w-56 border border-lime-200 rounded-2xl shadow-lg backdrop-blur-md bg-white/90 text-gray-800 transform transition-all duration-300 ease-out ${
                    isLoginOpenDesktop
                      ? "scale-100 opacity-100 translate-y-0"
                      : "scale-95 opacity-0 -translate-y-2 pointer-events-none"
                  }`}
                >
                  {loginLinks.map(({ to, label }) => (
                    <li key={label}>
                      <Link
                        to={to}
                        onClick={() => setIsLoginOpenDesktop(false)}
                        className="block px-5 py-2 rounded-full hover:bg-lime-100 transition duration-200 text-center"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </nav>

        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setIsMenuOpen((prev) => !prev)}
          className="md:hidden text-gray-700 hover:text-lime-400 transition"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Nav    */}
      <div
        className={`md:hidden transition-all duration-500 ease-in-out overflow-hidden ${
          isMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav
          className="bg-white/95 backdrop-blur-md border-t border-lime-200 rounded-b-2xl shadow-md p-6"
          ref={mobileRef}
        >
          <ul className="flex flex-col gap-3">
            {navLinks.map(({ to, label }) => {
              const isActive = location.pathname.startsWith(to) && to !== "/";
              return (
                <li key={label}>
                  <Link
                    to={to}
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsLoginOpenMobile(false);
                    }}
                    className={`block px-4 py-2 rounded-full transition-all duration-300 text-center ${
                      isActive
                        ? "bg-lime-400 text-white shadow"
                        : "bg-white text-gray-800 hover:bg-lime-100 hover:text-lime-600"
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}

            {/* Mobile Login / User */}
            <li className="relative">
              {user ? (
                <div className="flex flex-col gap-2">
                  <span className="w-full px-5 py-2 rounded-full text-white font-semibold bg-gradient-to-r from-lime-400 to-green-400 shadow-md text-center">
                    {user.name}
                  </span>
                  <button
                    onClick={handleDashboard}
                    className="w-full px-5 py-2 rounded-full text-white font-medium bg-blue-500 hover:bg-blue-600 transition"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-5 py-2 rounded-full text-white font-medium bg-red-500 hover:bg-red-600 transition"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setIsLoginOpenMobile((prev) => !prev)}
                    className="w-full text-left px-5 py-2 rounded-full text-white font-semibold bg-gradient-to-r from-lime-400 to-green-400 shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    Login
                  </button>
                  <ul
                    className={`transition-all duration-300 overflow-hidden mt-2 rounded-xl p-3 bg-white/95 shadow-md ${
                      isLoginOpenMobile ? "max-h-96 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
                    }`}
                  >
                    {loginLinks.map(({ to, label }) => (
                      <li key={label}>
                        <Link
                          to={to}
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsLoginOpenMobile(false);
                          }}
                          className="block px-3 py-1 rounded-full hover:bg-lime-100 transition duration-200 text-center"
                        >
                          {label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;


