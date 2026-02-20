import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaBars, FaCogs, FaEnvelope, FaBell, FaHome } from "react-icons/fa";
import { Moon, Sun } from "lucide-react";

import ManagerSidebar from "./ManagerSidebar";
import EmployeeManagement from "./ManagerEmployeeManagement";
import ManagerInventoryManagement from "./ManagerInventoryManagement";
import ManagerVendorManagement from "./ManagerVendorManagement";
import ManagerMenuManagement from "./ManagerMenuManagement";
import ManagerAccount from "./ManagerAccount";
import ManagerMessage from "./ManagerMessage";
import ManagerNotes from "./ManagerNotes";
import ManagerNotification from "./ManagerNotification";
import ManagerSettings from "./ManagerSettings";
import ManagerDashboard from "./ManagerDashboard";
import ManagerAnalytics from "./ManagerAnalytics";
import ManagerAttendancePage from "./ManagerAttendence"; // keep same if your file name is this

const Placeholder = ({ title }) => (
  <div className="p-6 text-green-800 dark:text-green-200">
    <h2 className="text-2xl font-bold">{title}</h2>
    <p className="mt-2">This page is under development.</p>
  </div>
);

const ManagerPanel = () => {

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

  const [unreadNotifications, setUnreadNotifications] = useState(5);
  const [unreadMessages, setUnreadMessages] = useState(3);

  const mainRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("isDark", String(darkMode));
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "auto";
  }, [sidebarOpen]);

  useEffect(() => {
    const pretty = active.replace(/-/g, " ");
    document.title = `Manager - ${pretty.charAt(0).toUpperCase() + pretty.slice(1)}`;
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [active]);

  const handleModeChange = () => setDarkMode((v) => !v);

  const handleSetActive = useCallback((section) => {
    setActive(section);
    setSidebarOpen(false);
    if (section === "notification") setUnreadNotifications(0);
    if (section === "message") setUnreadMessages(0);
  }, []);

  /* ✅ FIXED SPELLING HERE */
  const renderContent = () => {
    switch (active) {
      case "dashboard": return <ManagerDashboard />;
      case "staff-management": return <EmployeeManagement />;
      case "inventory": return <ManagerInventoryManagement />;
      case "vendor-management": return <ManagerVendorManagement />;
      case "menu-management": return <ManagerMenuManagement />;
      case "account": return <ManagerAccount />;
      case "analytics": return <ManagerAnalytics />;
      case "notes": return <ManagerNotes />;
      case "message": return <ManagerMessage />;
      case "notification": return <ManagerNotification />;
      case "settings": return <ManagerSettings />;
      case "attendance": return <ManagerAttendancePage />; // ✅ CORRECTED
      default: return <Placeholder title="Coming Soon" />;
    }
  };

  return (
    <div className="h-screen w-full bg-green-50 dark:bg-neutral-900 text-gray-800 dark:text-gray-200">
      <div className="flex h-screen gap-6 px-4 py-4 overflow-hidden">
        <aside className="hidden lg:block w-64 shrink-0">
          <ManagerSidebar
            activeSection={active}
            setActiveSection={handleSetActive}
          />
        </aside>

        <div className="flex-1 flex flex-col gap-6">
          <main
            ref={mainRef}
            className="flex-1 overflow-y-auto bg-white dark:bg-neutral-800 rounded-xl shadow p-6"
          >
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default ManagerPanel;
