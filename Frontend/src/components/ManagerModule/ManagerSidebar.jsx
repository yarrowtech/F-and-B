import React, { useState, useEffect } from "react";
import {
  FaHome,
  FaTachometerAlt,
  FaUsers,
  FaBoxes,
  FaUserTie,
  FaUtensils,
  FaUserCircle,
  FaChartLine,
  FaStickyNote,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaClipboardCheck,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const ManagerSidebar = ({ activeSection, setActiveSection }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const navigate = useNavigate();

  // ✅ USE REAL USER
  const user = JSON.parse(localStorage.getItem("user"));

  const managerName = user?.name || "Manager";
  const managerId = user?.employeeId || user?.id?.slice(-6) || "N/A";

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
    { id: "attendance", label: "Attendance", icon: <FaClipboardCheck /> },
    { id: "staff-management", label: "Staff Management", icon: <FaUsers /> },
    { id: "inventory", label: "Inventory", icon: <FaBoxes /> },
    { id: "vendor-management", label: "Vendor Management", icon: <FaUserTie /> },
    { id: "menu-management", label: "Menu Management", icon: <FaUtensils /> },
    { id: "account", label: "Account", icon: <FaUserCircle /> },
    { id: "analytics", label: "Analytics", icon: <FaChartLine /> },
    { id: "notes", label: "Notes", icon: <FaStickyNote /> },
  ];

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

  /* ================= LOGOUT ================= */
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/manager-login");
  };

  const handleHomeClick = () => {
    navigate("/manager");
    if (window.innerWidth < 1024) setIsOpen(false);
  };

  if (!user) return null;

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-[1002] p-2 bg-green-600 text-white rounded-full shadow-lg"
      >
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-[1000] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed z-[1001] top-0 left-0 h-full w-72 bg-green-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 shadow-2xl p-6 border-r rounded-r-2xl transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">

          {/* HEADER */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={handleHomeClick}
              className="text-green-700 dark:text-green-400 text-2xl"
            >
              <FaHome />
            </button>

            <h2 className="text-xl font-bold text-green-800 dark:text-green-300">
              F&B Management
            </h2>
          </div>

          {/* NAVIGATION */}
          <ul className="flex-grow space-y-3 overflow-y-auto">
            {navItems.map(({ id, label, icon }) => (
              <li key={id}>
                <button
                  onClick={() => {
                    setActiveSection(id);
                    if (window.innerWidth < 1024) setIsOpen(false);
                  }}
                  className={`flex items-center gap-4 w-full px-5 py-3 rounded-xl transition ${
                    activeSection === id
                      ? "bg-green-500 text-white"
                      : "bg-white dark:bg-gray-700 hover:bg-green-200 dark:hover:bg-gray-600 text-green-800 dark:text-green-100"
                  }`}
                >
                  <span className="text-lg">{icon}</span>
                  <span className="text-md font-medium">{label}</span>
                </button>
              </li>
            ))}
          </ul>

          {/* USER INFO */}
          <div className="pt-6 border-t border-green-300 dark:border-gray-700 text-sm">
            <div className="flex items-center gap-3 mb-2">
              <FaUserCircle className="text-2xl text-green-700 dark:text-green-400" />
              <div>
                <p className="font-semibold text-green-800 dark:text-green-300">
                  {managerName}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  ID: {managerId}
                </p>
                <p className="flex items-center gap-1 text-xs">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isOnline ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  {isOnline ? "Online" : "Offline"}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
            >
              <FaSignOutAlt />
              Logout
            </button>
          </div>

        </div>
      </aside>
    </>
  );
};

export default ManagerSidebar;

