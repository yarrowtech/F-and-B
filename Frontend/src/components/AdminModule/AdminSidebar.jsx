import React, { useState, useEffect } from "react";
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
  FaSignOutAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Sidebar = ({ active, setActive }) => {
  const navigate = useNavigate();

  /* ================= STATE ================= */
  const [isOpen, setIsOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );

  /* ================= GET REAL ADMIN ================= */
  const user = JSON.parse(localStorage.getItem("user")) || {};

  const adminName = user?.name || "Name";
  const businessName = "Business Name";
  const adminId = user?.adminId || "N/A";

  /* ================= DARK MODE ================= */
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  /* ================= ONLINE / OFFLINE ================= */
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

  /* ================= MENU ITEMS ================= */
  const menuItems = [
    { name: "Dashboard", icon: FaTachometerAlt, key: "dashboard" },
    { name: "Staff Management", icon: FaUsers, key: "staff" },
    { name: "Restaurant Management", icon: FaUtensils, key: "restaurant" },
    { name: "Subscription", icon: FaClipboardList, key: "subscription" },
    { name: "Inventory", icon: FaBox, key: "inventory" },
    { name: "Vendor Management", icon: FaHandshake, key: "vendor" },
    { name: "Menu Management", icon: FaClipboardList, key: "menu" },
    { name: "Table Management", icon: FaUtensils, key: "table" },
    { name: "Account", icon: FaUserCircle, key: "account" },
    { name: "Analytics", icon: FaChartBar, key: "analytics" },
    { name: "Notes", icon: FaStickyNote, key: "notes" },
  ];

  /* ================= LOGOUT ================= */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("theme");
    navigate("/admin-login");
  };

  return (
    <>
      {/* MOBILE TOP BAR */}
      <div className="lg:hidden bg-green-100 dark:bg-gray-800 text-green-800 dark:text-gray-200 flex items-center justify-between px-4 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              navigate("/");
              setIsOpen(false);
            }}
            className="p-2 rounded-full bg-green-600 text-white"
          >
            <FaHome size={20} />
          </button>
          <h2 className="text-lg font-bold">Admin Panel</h2>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-full bg-green-500 text-white"
        >
          {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      </div>

      {/* SIDEBAR */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-green-100 dark:bg-gray-900 shadow-2xl flex flex-col z-50 transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* HEADER */}
        <div className="hidden lg:flex items-center gap-3 px-5 py-4 border-b dark:border-gray-700">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-full bg-green-600 text-white"
          >
            <FaHome size={18} />
          </button>
          <div>
            <h2 className="text-xl font-bold dark:text-white">
              F&B Management
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Admin Panel
            </p>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {menuItems.map(({ name, icon: Icon, key }) => {
            const isActive = active === key;

            return (
              <button
                key={key}
                onClick={() => {
                  setActive(key);
                  if (window.innerWidth < 1024) setIsOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-3 mb-2 rounded-lg text-sm font-medium border-l-4 transition-all
                  ${isActive
                    ? "bg-green-500 text-white border-green-700"
                    : "bg-white dark:bg-gray-800 text-green-700 dark:text-gray-200 border-transparent hover:bg-green-200 dark:hover:bg-gray-700"
                  }`}
              >
                <Icon className="text-lg" />
                <span>{name}</span>
              </button>
            );
          })}
        </nav>

        {/* FOOTER - ADMIN INFO */}
        <div className="border-t dark:border-gray-700 p-4 bg-green-50 dark:bg-gray-800">
          <div className="flex items-center gap-3 mb-3">
            <FaUserCircle className="text-3xl text-green-700 dark:text-green-400" />
            <div>
              <p className="text-sm font-semibold dark:text-white">
                {adminName}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {businessName}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                ID: {adminId}
              </p>

              <div className="flex items-center gap-1 text-xs mt-1">
                <span
                  className={`h-2 w-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"
                    }`}
                />
                {isOnline ? "Online" : "Offline"}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800"
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        />
      )}
    </>
  );
};

export default Sidebar;
