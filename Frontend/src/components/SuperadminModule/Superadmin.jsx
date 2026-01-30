import React, { useState, useEffect, useRef } from "react";
import {
  FaBars,
  FaCogs,
  FaEnvelope,
  FaBell,
  FaExclamationTriangle,
} from "react-icons/fa";
import { Moon, Sun } from "lucide-react";

import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";
import UserManagement from "./UserManagement";
import Subscription from "./Subscription";
import Analytics from "./Analytics";
import Message from "./Message";
import Settings from "./Settings";
import Notepad from "./Notepad";
import Alerts from "./Alearts";
import Notifications from "./Notifications";

const SuperAdmin = () => {
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );

  const [unreadNotifications, setUnreadNotifications] = useState(5);
  const [unreadMessages, setUnreadMessages] = useState(2);

  const mainRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const handleSetActive = (section) => {
    setActive(section);
    setSidebarOpen(false);

    if (section === "notifications") setUnreadNotifications(0);
    if (section === "messages") setUnreadMessages(0);

    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const renderContent = () => {
    switch (active) {
      case "dashboard":
        return <Dashboard />;
      case "user-management":
        return <UserManagement />;
      case "subscription":
        return <Subscription />;
      case "analytics":
        return <Analytics />;
      case "messages":
        return <Message />;
      case "settings":
        return <Settings />;
      case "notepad":
        return <Notepad />;
      case "alerts":
        return <Alerts />;
      case "notifications":
        return <Notifications />;
      default:
        return (
          <div className="p-6 text-green-800 dark:text-green-200">
            <h2 className="text-xl font-bold capitalize">{active}</h2>
            <p className="mt-2">Content for {active} will go here.</p>
          </div>
        );
    }
  };

  const Header = () => (
    <header className="sticky top-0 z-20 bg-white dark:bg-neutral-800 shadow px-4 py-3 rounded-xl">
      <div className="flex items-center justify-between flex-wrap gap-6">
        <div>
          <h1 className="text-xl font-bold text-black-800 dark:text-green-100">
            Super Admin Panel
          </h1>
          <p className="text-sm capitalize text-gray-500 dark:text-gray-300">
            {active}
          </p>
        </div>
        <div className="flex gap-4 items-center text-gray-600 dark:text-gray-300 text-lg relative">
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 hover:text-yellow-500 dark:hover:text-yellow-400"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Alerts */}
          <button
            title="Alerts"
            className="p-2 hover:text-green-600"
            onClick={() => handleSetActive("alerts")}
          >
            <FaExclamationTriangle />
          </button>

          {/* Notifications with counter */}
          <div className="relative">
            <button
              title="Notifications"
              className="p-2 hover:text-yellow-500"
              onClick={() => handleSetActive("notifications")}
            >
              <FaBell />
            </button>
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-2 text-[10px] bg-red-600 text-white rounded-full px-1.5">
                {unreadNotifications}
              </span>
            )}
          </div>

          {/* Messages with counter */}
          <div className="relative">
            <button
              title="Messages"
              className="p-2 hover:text-green-600"
              onClick={() => handleSetActive("messages")}
            >
              <FaEnvelope />
            </button>
            {unreadMessages > 0 && (
              <span className="absolute -top-1 -right-2 text-[10px] bg-blue-600 text-white rounded-full px-1.5">
                {unreadMessages}
              </span>
            )}
          </div>

          {/* Settings */}
          <button
            title="Settings"
            className="p-2 hover:text-green-600"
            onClick={() => handleSetActive("settings")}
          >
            <FaCogs />
          </button>
        </div>
      </div>
    </header>
  );

  return (
    <div className="flex h-screen bg-green-50 dark:bg-neutral-900 text-gray-800 dark:text-gray-200 overflow-hidden gap-6 px-4 py-4">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 bg-white dark:bg-neutral-800 shadow rounded-xl">
        <Sidebar activeSection={active} setActiveSection={handleSetActive} />
      </div>

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

      {/* Hamburger Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-[1002] p-2 bg-white dark:bg-neutral-800 shadow-md rounded-md"
      >
        <FaBars size={18} />
      </button>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-6">
        <Header />
        <main
          ref={mainRef}
          className="flex-1 flex flex-col gap-6 overflow-y-auto bg-white dark:bg-neutral-800 rounded-xl shadow p-6"
        >
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default SuperAdmin;
