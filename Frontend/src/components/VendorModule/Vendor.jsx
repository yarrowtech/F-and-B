// src/VendorPanel.jsx
import React, { useState, useEffect, useRef } from "react";
import { FaBars, FaCogs, FaEnvelope, FaBell, FaMoon, FaSun } from "react-icons/fa";

import Sidebar from "./VendorSidebar";
import VendorInventory from "./VendorInventory";
import VendorManagement from "./VendorManagement";
import VendorAccounts from "./VendorAccounts";
import VendorNotes from "./VendorNotes";
import VendorSettings from "./VendorSettings";
import VendorMessages from "./VendorMessages";
import VendorDashboard from "./VendorDashboard";
import VendorNotification from "./VendorNotification";
import VendorAnalytics from "./VendorAnalytics";

// -------- Header Component --------
const Header = ({ active, darkMode, setDarkMode, messageCount, notificationCount }) => (
  <header className="sticky top-0 z-20 bg-white dark:bg-neutral-800 rounded-xl shadow px-4 py-3 mb-4">
    <div className="flex items-center justify-between flex-wrap gap-6">
      <div>
        <h1 className="text-xl font-bold text-black-800 dark:text-green-100">Vendor Panel</h1>
        <p className="text-sm capitalize text-gray-500 dark:text-gray-300">
          {active?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
        </p>
      </div>
      <div className="flex gap-4 items-center text-gray-600 dark:text-gray-300 text-lg">
        <button
          onClick={() => setDarkMode((current) => !current)}
          className="rounded-lg p-2 transition hover:bg-gray-100 hover:text-yellow-500 dark:hover:bg-neutral-700 dark:hover:text-yellow-400"
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label="Toggle theme"
        >
          {darkMode ? <FaSun className="text-yellow-400" /> : <FaMoon className="text-gray-600" />}
        </button>

        {/* Notifications with badge */}
        <div className="relative">
          <FaBell
            title="Notifications"
            className="cursor-pointer hover:text-yellow-600"
            onClick={() => window.dispatchEvent(new CustomEvent("open-notifications"))}
          />
          {notificationCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {notificationCount}
            </span>
          )}
        </div>

        {/* Messages with badge */}
        <div className="relative">
          <FaEnvelope
            title="Messages"
            className="cursor-pointer hover:text-indigo-600"
            onClick={() => window.dispatchEvent(new CustomEvent("open-messages"))}
          />
          {messageCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {messageCount}
            </span>
          )}
        </div>

        <FaCogs
          title="Settings"
          className="cursor-pointer hover:text-teal-600"
          onClick={() => window.dispatchEvent(new CustomEvent("open-settings"))}
        />
      </div>
    </div>
  </header>
);

// -------- Main Vendor Panel Component --------
const VendorPanel = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [active, setActive] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(() => {
    const savedIsDark = localStorage.getItem("isDark");
    if (savedIsDark !== null) return savedIsDark === "true";

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return savedTheme === "dark";

    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Real-time counters
  const [messageCount, setMessageCount] = useState(3); // Example: 3 unread messages
  const [notificationCount, setNotificationCount] = useState(5); // Example: 5 unread notifications

  const mainRef = useRef(null);

  // Apply dark mode
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("isDark", String(darkMode));
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Listen for custom events
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const openSettings = () => setActive("settings");
    const openMessages = () => {
      setActive("messages");
      setMessageCount(0); // Clear unread count when opening messages
    };
    const openNotifications = () => {
      setActive("notifications");
      setNotificationCount(0); // Clear unread count when opening notifications
    };

    const updateMessages = (e) => setMessageCount(e.detail || 0);
    const updateNotifications = (e) => setNotificationCount(e.detail || 0);

    window.addEventListener("open-settings", openSettings, { signal });
    window.addEventListener("open-messages", openMessages, { signal });
    window.addEventListener("open-notifications", openNotifications, { signal });

    window.addEventListener("update-messages", updateMessages, { signal });
    window.addEventListener("update-notifications", updateNotifications, { signal });

    return () => controller.abort();
  }, []);

  // Optional: simulate real-time updates (can replace with API)
  useEffect(() => {
    const interval = setInterval(() => {
      setNotificationCount((prev) => prev + Math.floor(Math.random() * 2));
      setMessageCount((prev) => prev + Math.floor(Math.random() * 1));
    }, 15000); // every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const handleSetActive = (section) => {
    setActive(section);
    if (window.innerWidth < 1024) setSidebarOpen(false);
    requestAnimationFrame(() => mainRef.current?.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const renderContent = () => {
    switch (active) {
      case "inventory":
        return <VendorInventory />;
      case "vendor-management":
        return <VendorManagement />;
      case "account":
        return <VendorAccounts />;
      case "notes":
        return <VendorNotes />;
      case "settings":
        return <VendorSettings />;
      case "messages":
        return <VendorMessages />;
      case "dashboard":
        return <VendorDashboard />;
      case "notifications":
        return <VendorNotification />;
      case "analytics":
        return <VendorAnalytics />;
      default:
        return (
          <div className="p-6 text-center text-red-500 font-semibold">
            Unknown section: "{active}" — please select a valid panel.
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-green-50 dark:bg-neutral-900 text-gray-800 dark:text-gray-200 overflow-hidden gap-6 px-4 py-4">
      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-30 z-[1000] cursor-pointer"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed top-0 left-0 z-[1001] w-64 h-full bg-white dark:bg-neutral-800 shadow-lg transition-transform transform translate-x-0 rounded-r-xl">
            <Sidebar activeSection={active} setActiveSection={handleSetActive} />
          </div>
        </>
      )}

      {/* Mobile Hamburger */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-[1002] p-2 bg-white dark:bg-neutral-800 shadow-md rounded-md"
        aria-label="Open Sidebar"
      >
        <FaBars size={18} />
      </button>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-64 bg-white dark:bg-neutral-800 shadow rounded-xl">
        <Sidebar activeSection={active} setActiveSection={handleSetActive} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-6">
        <Header
          active={active}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          messageCount={messageCount}
          notificationCount={notificationCount}
        />
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto bg-white dark:bg-neutral-800 rounded-xl shadow p-6"
        >
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default VendorPanel;
