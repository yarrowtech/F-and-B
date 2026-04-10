import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";


const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/services", label: "Services" },
    { to: "/subscription", label: "Subscription" },
    { to: "/contact", label: "Contact" },
    { to: "/about", label: "About" },
  ];

  const dashboardRoutes = {
    admin: "/admin",
    manager: "/manager",
    vendor: "/vendor",
    superadmin: "/superadmin",
    chef: "/chef",
    cheif: "/chef", // alias fallback
    cleaner: "/cleaner",
    inventory_manager: "/inventorymanager",
    inventorymanager: "/inventorymanager",
    sucheif: "/sucheif",
    suchef: "/sucheif",
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

  const handleDashboard = () => {
    if (!user || !user.role) return;

    const roleKey = String(user.role).trim().toLowerCase();
    const destination = dashboardRoutes[roleKey] || "/login";

    navigate(destination);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled
        ? "backdrop-blur-lg bg-white/80 shadow-md"
        : "backdrop-blur-md bg-white/50"
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
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
        <nav className="hidden md:flex items-center gap-4 font-medium">
          {navLinks.map(({ to, label }) => {
            const isActive = location.pathname.startsWith(to) && to !== "/";
            return (
              <Link
                key={label}
                to={to}
                className={`px-4 py-2 rounded-full transition-all duration-300 ${isActive
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
              <button
                onClick={() => navigate("/login")}
                className="ml-4 px-6 py-2 rounded-full text-white font-medium transition-all duration-300 hover:scale-105 bg-gradient-to-r from-lime-400 to-green-400 shadow-md hover:shadow-lg"
              >
                Login
              </button>
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
        className={`md:hidden transition-all duration-500 ease-in-out overflow-hidden ${isMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
          }`}
      >
        <nav
          className="bg-white/95 backdrop-blur-md border-t border-lime-200 rounded-b-2xl shadow-md p-6"
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
                    }}
                    className={`block px-4 py-2 rounded-full transition-all duration-300 text-center ${isActive
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
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate("/login");
                  }}
                  className="w-full text-left px-5 py-2 rounded-full text-white font-semibold bg-gradient-to-r from-lime-400 to-green-400 shadow-md hover:shadow-lg transition-all duration-300"
                >
                  Login
                </button>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;


