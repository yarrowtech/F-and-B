import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaHome,
  FaTachometerAlt,
  FaUsers,
  FaUtensils,
  FaBox,
  FaHandshake,
  FaClipboardList,
  FaUserCircle,
  FaChartBar,
  FaStickyNote,
  FaBars,
  FaTimes,
} from "react-icons/fa";

const Sidebar = ({ active, setActive }) => {
  const [isOpen, setIsOpen] = useState(false); // mobile menu toggle
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");
  const [adminEmail, setAdminEmail] = useState(() => localStorage.getItem("adminEmail") || "admin@gmail.com");
  const [adminName, setAdminName] = useState(() => {
    const email = localStorage.getItem("adminEmail") || "admin@gmail.com";
    const namePart = email.split("@")[0].replace(/\./g, " ");
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine); // online/offline status
  const navigate = useNavigate();

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // Listen for online/offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Update name/email if localStorage changes (e.g. after login)
  useEffect(() => {
    const handleStorage = () => {
      const email = localStorage.getItem("adminEmail") || "admin@gmail.com";
      setAdminEmail(email);
      const namePart = email.split("@")[0].replace(/\./g, " ");
      setAdminName(namePart.charAt(0).toUpperCase() + namePart.slice(1));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const menuItems = [
    { name: "Dashboard", icon: FaTachometerAlt, key: "dashboard" },
    { name: "Staff Management", icon: FaUsers, key: "staff" },
    { name: "Restaurant Management", icon: FaUtensils, key: "restaurant" },
    { name: "Subscription", icon: FaClipboardList, key: "subscription" },
    { name: "Inventory", icon: FaBox, key: "inventory" },
    { name: "Vendor Management", icon: FaHandshake, key: "vendor" },
    { name: "Menu Management", icon: FaClipboardList, key: "menu" },
    { name: "Account", icon: FaUserCircle, key: "account" },
    { name: "Analytics", icon: FaChartBar, key: "analytics" },
    { name: "Notes", icon: FaStickyNote, key: "notes" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("adminEmail");
    setIsOpen(false);
    navigate("/admin-login");
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden bg-green-100 dark:bg-gray-800 text-green-800 dark:text-gray-200 flex items-center justify-between px-4 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setActive("home");
              setIsOpen(false);
              navigate("/");
            }}
            className={`p-2 rounded-full transition-colors ${
              active === "home"
                ? "bg-green-600 text-white"
                : "bg-green-500 text-white hover:bg-green-600"
            }`}
          >
            <FaHome size={20} />
          </button>
          <h2 className="text-lg font-bold">Admin Panel</h2>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 transition"
        >
          {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      </div>

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-green-100 dark:bg-gray-900 rounded-r-2xl shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Desktop Header */}
        <div className="hidden lg:flex items-center justify-between px-5 py-4 border-b border-green-300 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActive("home");
                navigate("/");
              }}
              className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600"
            >
              <FaHome size={20} />
            </button>
            <div>
              <h2 className="text-xl font-bold text-green-800 dark:text-gray-100 leading-none">
                F & B
              </h2>
              <h3 className="text-sm font-semibold text-green-700 dark:text-gray-400 leading-none">
                Management
              </h3>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {menuItems.map(({ name, icon: Icon, key }) => {
            const isActive = active === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setActive(key);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-3 mb-2 rounded-lg text-sm font-medium transition-all duration-200 border-l-4
                  ${
                    isActive
                      ? "bg-green-500 text-white border-green-700"
                      : "bg-white dark:bg-gray-800 text-green-700 dark:text-gray-200 border-transparent hover:bg-green-200 dark:hover:bg-gray-700"
                  }`}
              >
                <Icon className={`text-lg ${isActive ? "text-white" : "text-green-600 dark:text-gray-300"}`} />
                <span>{name}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-green-300 dark:border-gray-700 p-4 flex items-center justify-between bg-green-50 dark:bg-gray-800">
          <div className="flex items-center gap-3">
            <FaUserCircle className="text-green-700 dark:text-gray-300 text-2xl" />
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-gray-100">{adminName}</p>
              <p className="text-xs text-green-600 dark:text-gray-400">{adminEmail}</p>

              {/* Online/Offline Indicator */}
              <div className="flex items-center gap-1 mt-1">
                <span
                  className={`h-2 w-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`}
                ></span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  {isOnline ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-green-700 dark:text-gray-300 hover:text-green-900 dark:hover:text-white text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-40 z-40 lg:hidden"
        />
      )}
    </>
  );
};

export default Sidebar;



