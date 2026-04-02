import React, { useState, useEffect, useRef } from "react";
import { FaBars, FaEnvelope, FaBell, FaCogs, FaHome } from "react-icons/fa";
import { Moon, Sun } from "lucide-react";

import ChefSidebar from "../ChefModule/ChefSidebar";
import ChefSettings from "../ChefModule/ChefSettings";
import ChefNotes from "../ChefModule/ChefNotes";
import ChefProfile from "../ChefModule/ChefProfile";
import ChefAttendance from "../ChefModule/ChefAttendance";
import ChefInventory from "../ChefModule/ChefInventory";
import ChefManagement from "../ChefModule/ChefManagement";
import ChefDashboard from "../ChefModule/ChefDashboard";
import ChefMessage from "./ChefMessage";
import ChefNotifications from "./ChefNotification";

const Chef = () => {
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("isDark") === "true");

  // Counters
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [unreadMessages, setUnreadMessages] = useState(2);

  const mainRef = useRef(null);

  // Sync html.dark on first mount
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) root.classList.add("dark");
    else root.classList.remove("dark");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleModeChange = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("isDark", String(next));
    const root = document.documentElement;
    if (next) root.classList.add("dark");
    else root.classList.remove("dark");
  };

  // Scroll to top on section change
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [active]);

  // Lock scroll when drawer open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "auto";
  }, [sidebarOpen]);

  // HIDE common chat widget bubbles (removes the green "X" button)
  useEffect(() => {
    const style = document.createElement("style");
    style.setAttribute("data-hide-chat-widgets", "true");
    style.innerHTML = `
      /* Crisp */
      .crisp-client, #crisp-chatbox { display: none !important; }
      /* Tawk.to */
      #tawkchat-container, iframe[src*="tawk.to"] { display: none !important; }
      /* Intercom */
      .intercom-lightweight-app, iframe[name^="intercom-"] { display: none !important; }
      /* Tidio */
      #tidio-chat, #tidio-chat iframe { display: none !important; }
      /* WhatsApp common widgets */
      #wh-widget-send-button, .wa-widget, .wa-chat-box, [id*="whatsapp-widget"] { display: none !important; }
      /* Zoho SalesIQ */
      .zsiq_floatmain, #zsiqwidget { display: none !important; }
      /* Drift */
      #drift-widget, .drift-widget-container { display: none !important; }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  const handleSetActive = (section) => {
    setActive(section);
    setSidebarOpen(false);
    if (section === "notification") setUnreadNotifications(0);
    if (section === "message") setUnreadMessages(0);
  };

  const renderContent = () => {
    switch (active) {
      case "dashboard": return <ChefDashboard />;
      case "management": return <ChefManagement />;
      case "inventory": return <ChefInventory />;
      case "attendance": return <ChefAttendance />;
      case "notes": return <ChefNotes />;
      case "profile": return <ChefProfile />;
      case "settings": return <ChefSettings />;
      case "message": return <ChefMessage />;
      case "notification": return <ChefNotifications />;
      default:
        return (
          <div className="p-4 text-green-800 dark:text-green-200">
            <h2 className="text-xl font-bold capitalize">{active}</h2>
            <p className="mt-2 text-sm">Content for {active} will go here.</p>
          </div>
        );
    }
  };

  return (
    <div className="h-screen w-full bg-green-50 dark:bg-neutral-900 text-gray-800 dark:text-gray-200">
      {/* Mobile Top Bar */}
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
            <h1 className="text-base font-semibold text-black dark:text-green-100">Cheif Panel</h1>
            <p className="text-xs capitalize text-gray-500 dark:text-gray-300">{active}</p>
          </div>

          {/* Right actions: theme + settings */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleModeChange}
              className="p-2 rounded-md bg-white dark:bg-neutral-700 shadow-sm"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              onClick={() => handleSetActive("settings")}
              className="p-2 rounded-md bg-white dark:bg-neutral-700 shadow-sm"
              title="Settings"
              aria-label="Open settings"
            >
              <FaCogs size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="flex h-[calc(100vh-0px)] lg:h-screen gap-0 lg:gap-6 px-0 lg:px-4 py-0 lg:py-4 overflow-hidden">
        {/* Sidebar (Desktop) */}
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="h-full bg-white dark:bg-neutral-800 shadow rounded-xl overflow-hidden">
            <ChefSidebar activeSection={active} setActiveSection={handleSetActive} />
          </div>
        </aside>

        {/* Sidebar (Mobile Drawer) */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-[1000]"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed top-0 left-0 h-full w-72 z-[1001] bg-white dark:bg-neutral-800 shadow-2xl rounded-r-xl overflow-y-auto">
              <ChefSidebar activeSection={active} setActiveSection={handleSetActive} />
            </div>
          </>
        )}

        {/* Main */}
        <div className="flex-1 min-w-0 flex flex-col gap-4 lg:gap-6">
          {/* Desktop Header */}
          <header className="hidden lg:block sticky top-4 z-30 mx-4 lg:mx-0 bg-white dark:bg-neutral-800 shadow px-4 py-3 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-black dark:text-green-100">Cheif Panel</h1>
                <p className="text-sm capitalize text-gray-500 dark:text-gray-300">{active}</p>
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
                    onClick={() => handleSetActive("message")}
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
                    onClick={() => handleSetActive("notification")}
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

          {/* Page Content */}
          <main
            ref={mainRef}
            className="flex-1 min-h-0 overflow-y-auto bg-white dark:bg-neutral-800 rounded-none lg:rounded-xl shadow-none lg:shadow p-4 lg:p-6"
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
                label="Stock"
                icon={<span className="font-bold text-xs">S</span>}
                active={active === "inventory"}
                onClick={() => handleSetActive("inventory")}
              />
              <TabItem
                label="Msg"
                icon={<FaEnvelope size={16} />}
                badge={unreadMessages}
                active={active === "message"}
                onClick={() => handleSetActive("message")}
              />
              <TabItem
                label="Notify"
                icon={<FaBell size={16} />}
                badge={unreadNotifications}
                active={active === "notification"}
                onClick={() => handleSetActive("notification")}
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
      className={`relative flex flex-col items-center justify-center py-2.5 text-xs ${active ? "text-green-700 dark:text-green-300 font-semibold" : "text-gray-600 dark:text-gray-300"
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

export default Chef;
