import React, { useState, useEffect } from "react";
import {
  FaHome,
  FaTachometerAlt,
  FaClipboardCheck,
  FaUserTie,
  FaUserCircle,
  FaStickyNote,
  FaSignOutAlt,
  FaBars, // ⬅ keep only bars
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const InventoryManagerSidebar = ({ activeSection, setActiveSection }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Generate name dynamically from login ID
  const generateName = (loginId) => {
    const namePart = loginId.replace(/\./g, " ");
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  };

  const [inventoryManagerLoginId, setInventoryManagerLoginId] = useState(
    localStorage.getItem("InventoryManagerLoginId") || "inventorymanager123"
  );
  const [inventoryManagerName, setInventoryManagerName] = useState(
    generateName(localStorage.getItem("InventoryManagerLoginId") || "inventorymanager123")
  );

  const navigate = useNavigate();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
    { id: "management", label: "Management", icon: <FaUserTie /> },
    { id: "attendance", label: "Attendance", icon: <FaClipboardCheck /> },
    { id: "profile", label: "Profile", icon: <FaUserCircle /> },
    { id: "notes", label: "Notes", icon: <FaStickyNote /> },
  ];

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

  useEffect(() => {
    const handleStorageChange = () => {
      const loginId =
        localStorage.getItem("InventoryManagerLoginId") || "inventorymanager123";
      setInventoryManagerLoginId(loginId);
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Update name when ID changes
  useEffect(() => {
    setInventoryManagerName(generateName(inventoryManagerLoginId));
  }, [inventoryManagerLoginId]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/inventory-manager-login");
  };

  const handleHomeClick = () => {
    navigate("/");
    if (window.innerWidth < 1024) setIsOpen(false);
  };

  return (
    <>
      {/* Mobile toggle: show ONLY when sidebar is CLOSED (no green X when open) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-[1002] p-2 bg-green-600 dark:bg-gray-800 text-white rounded-full shadow-lg"
          aria-label="Open Sidebar"
        >
          <FaBars />
        </button>
      )}

      {/* Backdrop for mobile, click to close */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-[1000] lg:hidden"
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
          {/* Header */}
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

          {/* Nav */}
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
                  {inventoryManagerName}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  ID: {inventoryManagerLoginId}
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
              <FaSignOutAlt className="text-lg" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default InventoryManagerSidebar;
