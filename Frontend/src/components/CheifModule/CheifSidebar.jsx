import React, { useEffect, useState } from "react";
import {
  FaHome,
  FaTachometerAlt,
  FaClipboardCheck,
  FaBoxes,
  FaUserCircle,
  FaUserTie,
  FaStickyNote,
  FaSignOutAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  getUser,
  isAuthenticated,
  logout,
} from "../../services/auth.service";

const ChefSidebar = ({ activeSection, setActiveSection }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();

  const user = getUser(); // ✅ single source of truth

  /* ================= PROTECT SIDEBAR ================= */
  useEffect(() => {
    if (!isAuthenticated() || !user || user.role !== "chef") {
      logout();
      navigate("/chef-login");
    }
  }, [user, navigate]);

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

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
    { id: "management", label: "Orders", icon: <FaUserTie /> },
    { id: "attendance", label: "Attendance", icon: <FaClipboardCheck /> },
    { id: "inventory", label: "Inventory", icon: <FaBoxes /> },
    { id: "profile", label: "Profile", icon: <FaUserCircle /> },
    { id: "notes", label: "Notes", icon: <FaStickyNote /> },
  ];

  const handleLogout = () => {
    logout();
    navigate("/chef-login");
  };

  const handleHomeClick = () => {
    navigate("/chef");
  };

  if (!user) return null;

  return (
    <div className="h-full w-full bg-green-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 p-6 border-r border-green-300 dark:border-gray-700">
      <div className="flex flex-col h-full">

        {/* HEADER */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={handleHomeClick}
            className="text-green-700 dark:text-green-400 hover:text-green-900 dark:hover:text-green-200 transition text-2xl"
          >
            <FaHome />
          </button>

          <h2 className="text-xl font-bold text-green-800 dark:text-green-300">
            Chef Panel
          </h2>
        </div>

        {/* NAVIGATION */}
        <ul className="flex-grow space-y-3 overflow-y-auto">
          {navItems.map(({ id, label, icon }) => (
            <li key={id}>
              <button
                onClick={() => setActiveSection(id)}
                className={`flex items-center gap-4 w-full px-5 py-3 rounded-xl transition-all shadow-sm ${
                  activeSection === id
                    ? "bg-green-600 text-white"
                    : "bg-white dark:bg-gray-700 hover:bg-green-200 dark:hover:bg-gray-600 text-green-800 dark:text-green-100"
                }`}
              >
                <span className="text-lg">{icon}</span>
                <span className="text-md font-medium">{label}</span>
              </button>
            </li>
          ))}
        </ul>

        {/* USER INFO FOOTER (MATCHES ACCOUNTANT & WAITER STYLE) */}
        <div className="pt-6 border-t border-green-300 dark:border-gray-700 text-sm">
          <div className="flex items-center gap-3 mb-3">
            <FaUserCircle className="text-2xl text-green-700 dark:text-green-400" />
            <div>
              <p className="font-semibold text-green-800 dark:text-green-300">
                {user.name || "Chef"}
              </p>

              <p className="text-xs text-green-600 dark:text-green-400">
                ID: {user.employeeId || user.id?.slice(-6) || "N/A"}
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
    </div>
  );
};

export default ChefSidebar;
