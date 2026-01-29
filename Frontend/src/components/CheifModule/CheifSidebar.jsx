// CheifSidebar.jsx
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

const CheifSidebar = ({ activeSection, setActiveSection }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Build display name from login ID
  const generateName = (loginId) => {
    const namePart = (loginId || "").replace(/\./g, " ");
    return namePart ? namePart.charAt(0).toUpperCase() + namePart.slice(1) : "Cheif";
  };

  const [cheifLoginId, setCheifLoginId] = useState(
    localStorage.getItem("cheifLoginId") || "cheif123"
  );
  const [cheifName, setCheifName] = useState(generateName(cheifLoginId));

  const navigate = useNavigate();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
    { id: "management", label: "Management", icon: <FaUserTie /> },
    { id: "attendance", label: "Attendance", icon: <FaClipboardCheck /> },
    { id: "inventory", label: "Inventory", icon: <FaBoxes /> },
    { id: "profile", label: "Profile", icon: <FaUserCircle /> },
    { id: "notes", label: "Notes", icon: <FaStickyNote /> },
  ];

  // Online/offline indicator
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // React to login ID changes from anywhere
  useEffect(() => {
    const handleStorage = () => {
      const loginId = localStorage.getItem("cheifLoginId") || "cheif123";
      setCheifLoginId(loginId);
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    setCheifName(generateName(cheifLoginId));
  }, [cheifLoginId]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/cheif-login");
  };

  const handleHomeClick = () => navigate("/");

  return (
    // NOTE: no fixed positioning, no drawer state, no green X button.
    <div className="h-full w-full bg-green-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 p-6 border-r border-green-300 dark:border-gray-700">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={handleHomeClick}
            className="text-green-700 dark:text-green-400 hover:text-green-900 dark:hover:text-green-200 transition text-2xl"
            title="Go to Home"
          >
            <FaHome />
          </button>
          <h2 className="text-xl font-bold text-green-800 dark:text-green-300">
            F&amp;B Management
          </h2>
        </div>

        {/* Nav */}
        <ul className="flex-grow space-y-3 overflow-y-auto">
          {navItems.map(({ id, label, icon }) => (
            <li key={id}>
              <button
                onClick={() => setActiveSection(id)}
                className={`flex items-center gap-4 w-full px-5 py-3 rounded-xl transition-all shadow-sm ${
                  activeSection === id
                    ? "bg-green-500 text-white border-l-4 border-green-700"
                    : "bg-white dark:bg-gray-700 hover:bg-green-200 dark:hover:bg-gray-600 text-green-800 dark:text-green-100"
                }`}
              >
                <span className="text-lg">{icon}</span>
                <span className="text-md font-medium">{label}</span>
              </button>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="pt-6 border-t border-green-300 dark:border-gray-700 text-sm">
          <div className="flex items-center gap-3 mb-2">
            <FaUserCircle className="text-2xl text-green-700 dark:text-green-400" />
            <div>
              <p className="font-semibold text-green-800 dark:text-green-300">{cheifName}</p>
              <p className="text-xs text-green-600 dark:text-green-400">ID: {cheifLoginId}</p>
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
            <FaSignOutAlt className="text-lg" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheifSidebar;
