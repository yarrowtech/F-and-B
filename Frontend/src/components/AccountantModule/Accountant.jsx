import React, { useState, useRef, useLayoutEffect } from "react";
import { FaBars, FaCogs, FaEnvelope, FaBell } from "react-icons/fa";
import { Moon, Sun } from "lucide-react";
import Sidebar from "../AccountantModule/AccountantSidebar";
import SettingsPage from "../AccountantModule/AccountantSettings";
import AccountantProfile from "../AccountantModule/AccountantProfile";
import AccountantNotes from "../AccountantModule/AccountantNotes";
import AccountantAttendance from "../AccountantModule/AccountantAttendance";
import AccountantOtherPayments from "../AccountantModule/AccountantOtherPayments";
import AccountantVendorBilling from "../AccountantModule/AccountantVendorBilling";
import AccountantOrderBilling from "../AccountantModule/AccountantOrderBilling";
import AccountantDashboard from "../AccountantModule/AccountantDashboard";
import AccountantMessage from "../AccountantModule/AccountantMessage";
import AccountantNotification from "../AccountantModule/AccountantNotification";


const Accountant = () => {
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [unreadNotifications, setUnreadNotifications] = useState(5);
  const [unreadMessages, setUnreadMessages] = useState(2);

  const mainRef = useRef(null);

  useLayoutEffect(() => {
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
      case "orderbilling":
        return <AccountantOrderBilling />;
      case "vendorbilling":
        return <AccountantVendorBilling />;
      case "otherpayment":
        return <AccountantOtherPayments />;
      case "dashboard":
        return <AccountantDashboard />;
      case "attendance":
        return <AccountantAttendance />;
      case "notes":
        return <AccountantNotes />;
      case "profile":
        return <AccountantProfile />;
      case "messages":
        return <AccountantMessage />;
      case "settings":
        return <SettingsPage />;
      case "notifications":
        return <AccountantNotification />;  
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
    <header className="sticky top-0 z-20 bg-white dark:bg-neutral-800 shadow px-4 py-3 rounded-xl flex items-center justify-between flex-wrap gap-6">
      <div>
        <h1 className="text-xl font-bold text-black-800 dark:text-green-100">Accountant Panel</h1>
        <p className="text-sm capitalize text-gray-500 dark:text-gray-300">{active}</p>
      </div>
      <div className="flex gap-4 items-center text-gray-600 dark:text-gray-300 text-lg relative">
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 hover:text-yellow-500 dark:hover:text-yellow-400 transition"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
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

        <button
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

        <button
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
    <div className="flex h-screen bg-green-50 dark:bg-neutral-900 text-gray-800 dark:text-gray-200 overflow-hidden gap-6 px-4 py-4">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 bg-white dark:bg-neutral-800 shadow rounded-xl">
        <Sidebar activeSection={active} setActiveSection={handleSetActive} />
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 left-0 z-[1001] w-64 h-full bg-white dark:bg-neutral-800 shadow-lg transform transition-transform duration-300 rounded-r-xl lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar activeSection={active} setActiveSection={handleSetActive} />
      </div>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-[1000] cursor-pointer lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Toggle */}
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
          className="flex-1 flex flex-col gap-6 overflow-y-auto bg-white dark:bg-neutral-800 rounded-xl shadow p-6 transition-colors"
        >
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Accountant;

