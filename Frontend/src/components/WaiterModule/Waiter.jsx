import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaBars, FaCogs, FaEnvelope, FaBell } from "react-icons/fa";
import { Moon, Sun } from "lucide-react";
import WaiterSidebar from "../WaiterModule/WaiterSidebar";
import WaiterManagement from "../WaiterModule/WaiterManagement"
import WaiterAttendancePage from "../WaiterModule/WaiterAttendance";
import WaiterProfile from "../WaiterModule/WaiterProfile";
import WaiterNotes from "../WaiterModule/WaiterNotes";
import SettingsPage from "../WaiterModule/WaiterSettings";
import WaiterMessage from "../WaiterModule/WaiterMessages";
import WaiterNotifications from "../WaiterModule/WaiterNotification";
import WaiterDashboard from "../WaiterModule/WaiterDashboard";


const Placeholder = ({ title }) => (
  <div className="p-6 text-green-800 dark:text-green-200">
    <h2 className="text-2xl font-bold">{title}</h2>
    <p className="mt-2">This page is under development.</p>
  </div>
);

const Waiter = () => {
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [unreadNotifications, setUnreadNotifications] = useState(5);
  const [unreadMessages, setUnreadMessages] = useState(2);
  const mainRef = useRef(null);

  /* ----------------- THEME HANDLING ----------------- */
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  /* ----------------- DYNAMIC PAGE TITLE ----------------- */
  useEffect(() => {
    document.title = `Waiter - ${active.charAt(0).toUpperCase() + active.slice(1)}`;
  }, [active]);

  /* ----------------- ACTIVE SECTION HANDLER ----------------- */
  const handleSetActive = useCallback((section) => {
    setActive(section);
    setSidebarOpen(false);

    if (section === "notifications") setUnreadNotifications(0);
    if (section === "messages") setUnreadMessages(0);

    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  /* ----------------- MAIN CONTENT RENDERER ----------------- */
  const renderContent = () => {
    switch (active) {
      case "dashboard":
        return <WaiterDashboard />;
      case "management":
        return <WaiterManagement  />;
      case "attendance":
        return <WaiterAttendancePage  />;
      case "notes":
        return <WaiterNotes />;
      case "profile":
        return <WaiterProfile />;
      case "messages":
        return <WaiterMessage  />;
      case "settings":
        return <SettingsPage  />;
      case "notifications":
        return <WaiterNotifications />;
      default:
        return <Placeholder title="Coming Soon" />;
    }
  };

  /* ----------------- HEADER ----------------- */
  const Header = () => (
    <header className="sticky top-0 z-20 bg-white dark:bg-neutral-800 shadow px-4 py-3 rounded-xl flex items-center justify-between flex-wrap gap-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-green-100">
          Waiter Panel
        </h1>
        <p className="text-sm capitalize text-gray-500 dark:text-gray-300">
          {active.replace("-", " ")}
        </p>
      </div>
      <div className="flex gap-4 items-center text-gray-600 dark:text-gray-300 text-lg relative">
        {/* Dark/Light Mode Toggle */}
        <button
          aria-label="Toggle Dark Mode"
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 hover:text-yellow-500 dark:hover:text-yellow-400 transition"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <button
          aria-label="Notifications"
          title="Notifications"
          className="p-2 hover:text-yellow-500 relative"
          onClick={() => handleSetActive("notifications")}
        >
          <FaBell />
          {unreadNotifications > 0 && (
            <span className="absolute -top-1 -right-2 text-[10px] bg-red-600 text-white rounded-full px-1.5 animate-pulse">
              {unreadNotifications}
            </span>
          )}
        </button>

        {/* Messages */}
        <button
          aria-label="Messages"
          title="Messages"
          className="p-2 hover:text-green-600 transition relative"
          onClick={() => handleSetActive("messages")}
        >
          <FaEnvelope />
          {unreadMessages > 0 && (
            <span className="absolute -top-1 -right-2 text-[10px] bg-blue-600 text-white rounded-full px-1.5 animate-pulse">
              {unreadMessages}
            </span>
          )}
        </button>

        {/* Settings */}
        <button
          aria-label="Settings"
          title="Settings"
          className="p-2 hover:text-green-600 transition"
          onClick={() => handleSetActive("settings")}
        >
          <FaCogs />
        </button>
      </div>
    </header>
  );

  return (
    <div className="flex h-screen bg-green-50 dark:bg-neutral-900 text-gray-800 dark:text-gray-200 overflow-hidden gap-6 p-4">
      {/* Desktop Sidebar */}
      <nav className="hidden lg:block w-64 bg-white dark:bg-neutral-800 shadow rounded-xl">
        <WaiterSidebar activeSection={active} setActiveSection={handleSetActive} />
      </nav>

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 left-0 z-[1001] w-64 h-full bg-white dark:bg-neutral-700 shadow-lg transform transition-transform duration-300 rounded-r-xl lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <WaiterSidebar activeSection={active} setActiveSection={handleSetActive} />
      </div>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-[1000] cursor-pointer lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-[1002] p-2 bg-white dark:bg-neutral-800 shadow-md rounded-md"
      >
        <FaBars size={18} />
      </button>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-6">
        <Header />
        <main
          ref={mainRef}
          className="flex-1 flex flex-col gap-6 overflow-y-auto bg-white dark:bg-neutral-800 rounded-xl shadow p-6 transition-colors"
        >
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Waiter;
