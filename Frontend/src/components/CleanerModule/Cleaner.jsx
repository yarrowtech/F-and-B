import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaBars, FaCogs, FaEnvelope, FaBell, FaHome } from "react-icons/fa";
import { Moon, Sun } from "lucide-react";

import CleanerSidebar from "../CleanerModule/CleanerSidebar";
import SettingsPage from "../CleanerModule/CleanerSettings";
import CleanerMessages from "../CleanerModule/CleanerMessage";
import CleanerNotes from "../CleanerModule/CleanerNotes";
import CleanerProfile from "../CleanerModule/CleanerProfile";
import CleanerAttendancePage from "../CleanerModule/CleanerAttendence";
import CleanerManagement from "../CleanerModule/CleanerManagement";
import CleanerNotifications from "../CleanerModule/CleanerNotification";
import CleanerDashboard from "../CleanerModule/CleanerDashboard";

const Placeholder = ({ title }) => (
  <div className="p-6 text-green-800 dark:text-green-200">
    <h2 className="text-2xl font-bold">{title}</h2>
    <p className="mt-2">This page is under development.</p>
  </div>
);

const Cleaner = () => {
  // --- Theme (compatible with isDark + theme keys) ---
  const initialDark = () => {
    const isDarkLS = localStorage.getItem("isDark");
    if (isDarkLS !== null) return isDarkLS === "true";
    const theme = localStorage.getItem("theme");
    if (theme) return theme === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  };

  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(initialDark);

  // Counters
  const [unreadNotifications, setUnreadNotifications] = useState(5);
  const [unreadMessages, setUnreadMessages] = useState(2);

  const mainRef = useRef(null);

  // Apply theme on mount + when toggled
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("isDark", String(darkMode));
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Lock body scroll when the drawer is open (mobile)
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "auto";
  }, [sidebarOpen]);

  // Title & scroll to top on section change
  useEffect(() => {
    document.title = `Cleaner - ${active.charAt(0).toUpperCase() + active.slice(1)}`;
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [active]);

  const handleModeChange = () => setDarkMode((v) => !v);

  const handleSetActive = useCallback((section) => {
    setActive(section);
    setSidebarOpen(false);
    if (section === "notifications") setUnreadNotifications(0);
    if (section === "messages") setUnreadMessages(0);
  }, []);

  // Content switcher
  const renderContent = () => {
    switch (active) {
      case "dashboard": return <CleanerDashboard />;
      case "management": return <CleanerManagement />;
      case "attendance": return <CleanerAttendancePage />;
      case "notes": return <CleanerNotes />;
      case "profile": return <CleanerProfile />;
      case "messages": return <CleanerMessages />;
      case "settings": return <SettingsPage />;
      case "notifications": return <CleanerNotifications />;
      default: return <Placeholder title="Coming Soon" />;
    }
  };

  // Desktop header
  const DesktopHeader = () => (
    <header className="hidden lg:block sticky top-4 z-30 mx-4 lg:mx-0 bg-white dark:bg-neutral-800 shadow px-4 py-3 rounded-xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-black dark:text-green-100">Cleaner Panel</h1>
          <p className="text-sm capitalize text-gray-500 dark:text-gray-300">{active.replace("-", " ")}</p>
        </div>

        <div className="flex gap-4 items-center text-gray-600 dark:text-gray-200">
          <button
            onClick={handleModeChange}
            className="p-2 transition-colors duration-200 hover:text-yellow-500 dark:hover:text-yellow-400"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="relative">
            <button
              title="Messages"
              onClick={() => handleSetActive("messages")}
              className="p-2 hover:text-green-600"
            >
              <FaEnvelope />
            </button>
            {unreadMessages > 0 && (
              <span className="absolute -top-1 -right-2 text-[10px] bg-blue-600 text-white rounded-full px-1.5">
                {unreadMessages}
              </span>
            )}
          </div>

          <div className="relative">
            <button
              title="Notifications"
              onClick={() => handleSetActive("notifications")}
              className="p-2 hover:text-green-600"
            >
              <FaBell />
            </button>
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-2 text-[10px] bg-red-600 text-white rounded-full px-1.5">
                {unreadNotifications}
              </span>
            )}
          </div>

          <button
            title="Settings"
            onClick={() => handleSetActive("settings")}
            className="p-2 hover:text-green-600"
          >
            <FaCogs />
          </button>
        </div>
      </div>
    </header>
  );

  // Mobile top bar (⚡️ Settings removed here)
  const MobileTopBar = () => (
    <div className="lg:hidden sticky top-0 z-40 bg-white dark:bg-neutral-800 border-b border-black/5 dark:border-white/10">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 bg-white dark:bg-neutral-700 rounded-md shadow-sm"
          aria-label="Open sidebar"
        >
          <FaBars size={18} />
        </button>

        <div className="text-center">
          <h1 className="text-base font-semibold text-black dark:text-green-100">Cleaner Panel</h1>
          <p className="text-xs capitalize text-gray-500 dark:text-gray-300">{active.replace("-", " ")}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleModeChange}
            className="p-2 rounded-md bg-white dark:bg-neutral-700 shadow-sm"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full bg-green-50 dark:bg-neutral-900 text-gray-800 dark:text-gray-200">
      {/* Mobile Top Bar */}
      <MobileTopBar />

      {/* Layout */}
      <div className="flex h-[calc(100vh-0px)] lg:h-screen gap-0 lg:gap-6 px-0 lg:px-4 py-0 lg:py-4 overflow-hidden">
        {/* Sidebar (Desktop) */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="h-full bg-white dark:bg-neutral-800 shadow rounded-xl overflow-hidden">
            <CleanerSidebar activeSection={active} setActiveSection={handleSetActive} />
          </div>
        </aside>

        {/* Sidebar (Mobile Drawer) */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-[1000]"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed top-0 left-0 h-full w-72 max-w-[85vw] z-[1001] bg-white dark:bg-neutral-800 shadow-2xl rounded-r-xl overflow-y-auto">
              <CleanerSidebar activeSection={active} setActiveSection={handleSetActive} />
            </div>
          </>
        )}

        {/* Main */}
        <div className="flex-1 min-w-0 flex flex-col gap-4 lg:gap-6">
          {/* Desktop Header */}
          <DesktopHeader />

          {/* Page Content */}
          <main
            ref={mainRef}
            className="flex-1 min-h-0 overflow-y-auto bg-white dark:bg-neutral-800 rounded-none lg:rounded-xl shadow-none lg:shadow p-4 lg:p-6 pb-16"
          >
            {renderContent()}
          </main>

          {/* Mobile Bottom Tab Bar */}
          <nav className="lg:hidden sticky bottom-0 z-40 bg-white/95 dark:bg-neutral-800/95 backdrop-blur border-t border-black/5 dark:border-white/10">
            <div className="grid grid-cols-6">
              <TabItem
                label="Home"
                icon={<FaHome size={16} />}
                active={active === "dashboard"}
                onClick={() => handleSetActive("dashboard")}
              />
              <TabItem
                label="Manage"
                icon={<span className="font-bold text-xs">M</span>}
                active={active === "management"}
                onClick={() => handleSetActive("management")}
              />
              <TabItem
                label="Attend"
                icon={<span className="font-bold text-xs">A</span>}
                active={active === "attendance"}
                onClick={() => handleSetActive("attendance")}
              />
              <TabItem
                label="Msgs"
                icon={<FaEnvelope size={16} />}
                badge={unreadMessages}
                active={active === "messages"}
                onClick={() => handleSetActive("messages")}
              />
              <TabItem
                label="Notify"
                icon={<FaBell size={16} />}
                badge={unreadNotifications}
                active={active === "notifications"}
                onClick={() => handleSetActive("notifications")}
              />
              <TabItem
                label="Settings"
                icon={<FaCogs size={16} />}
                active={active === "settings"}
                onClick={() => handleSetActive("settings")}
              />
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
};

// Reusable mobile tab item
function TabItem({ label, icon, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center py-2.5 text-xs ${
        active ? "text-green-700 dark:text-green-300 font-semibold" : "text-gray-600 dark:text-gray-300"
      }`}
    >
      <div className="relative">
        {icon}
        {!!badge && badge > 0 && (
          <span className="absolute -top-2 -right-2 text-[10px] bg-red-600 text-white rounded-full px-1.5">
            {badge}
          </span>
        )}
      </div>
      <span className="mt-0.5">{label}</span>
    </button>
  );
}

export default Cleaner;
