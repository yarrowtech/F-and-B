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
  const [managerLoginId, setManagerLoginId] = useState(
    localStorage.getItem("managerLoginId") || "manager123"
  );
  const [managerName, setManagerName] = useState(
    generateName(localStorage.getItem("managerLoginId") || "manager123")
  );

  const navigate = useNavigate();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
    { id: "attendence", label: "Attendence", icon: <FaClipboardCheck /> },
    { id: "staff-management", label: "Staff Management", icon: <FaUsers /> },
    { id: "inventory", label: "Inventory", icon: <FaBoxes /> },
    { id: "vendor-management", label: "Vendor Management", icon: <FaUserTie /> },
    { id: "menu-management", label: "Menu Management", icon: <FaUtensils /> },
    { id: "account", label: "Account", icon: <FaUserCircle /> },
    { id: "analytics", label: "Analytics", icon: <FaChartLine /> },
    { id: "notes", label: "Notes", icon: <FaStickyNote /> },
  ];

  // Generate name dynamically from email
  // Generate name dynamically from login ID
  function generateName(loginId) {
    const namePart = loginId.replace(/\./g, " ");
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  }

  // Detect online/offline
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

  // Listen for localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      const loginId = localStorage.getItem("managerLoginId") || "manager123";
      setManagerLoginId(loginId);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Update managerName whenever managerEmail changes
  // Update managerName whenever managerLoginId changes
  useEffect(() => {
    setManagerName(generateName(managerLoginId));
  }, [managerLoginId]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/manager-login");
  };

  const handleHomeClick = () => {
    navigate("/");
    if (window.innerWidth < 1024) setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-[1002] p-2 bg-green-600 dark:bg-gray-800 text-white rounded-full shadow-lg"
        aria-label="Toggle Sidebar"
      >
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-[1000] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed z-[1001] top-0 left-0 h-full w-72 bg-green-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 shadow-2xl p-6 border-r border-green-300 dark:border-gray-700 rounded-r-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Top Section */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={handleHomeClick}
              className="text-green-700 dark:text-green-400 hover:text-green-900 dark:hover:text-green-200 transition text-2xl"
              title="Go to Dashboard"
            >
              <FaHome />
            </button>
            <h2 className="text-xl font-bold text-green-800 dark:text-green-300">
              F&B Management
            </h2>
          </div>

          {/* Nav Items */}
          <ul className="flex-grow space-y-3 overflow-y-auto">
            {navItems.map(({ id, label, icon }) => (
              <li key={id}>
                <button
                  onClick={() => {
                    setActiveSection(id);
                    if (window.innerWidth < 1024) setIsOpen(false);
                  }}
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
                <p className="font-semibold text-green-800 dark:text-green-300">
                  {managerName}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  ID: {managerLoginId}
                </p>
                {/* Online/Offline Status */}
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
      </aside>
    </>
  );
};

export default ManagerSidebar;
