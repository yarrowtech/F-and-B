import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaBars, FaSignOutAlt } from "react-icons/fa";
import { Moon, Sun } from "lucide-react";

import AccountantSidebar from "./AccountantSidebar";
import SettingsPage from "./AccountantSettings";
import AccountantProfile from "./AccountantProfile";
import AccountantNotes from "./AccountantNotes";
import AccountantAttendance from "./AccountantAttendance";
import AccountantVendorBilling from "./AccountantVendorBilling";
import AccountantOrderBilling from "./AccountantOrderBilling";
import AccountantDashboard from "./AccountantDashboard";
import AccountantMessage from "./AccountantMessage";
import AccountantNotification from "./AccountantNotification";

/* ─── Profile Popup ─── */
function AccountantProfileButton() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const user = JSON.parse(localStorage.getItem("user")) || {};
  const name       = user?.name       || "Accountant";
  const employeeId = user?.employeeId || user?.id?.slice(-6) || "N/A";
  const email      = user?.email      || "";

  useEffect(() => {
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online",  on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full bg-green-600 hover:bg-green-700 text-white shadow flex items-center justify-center text-lg font-bold transition-colors shrink-0"
        style={{ width: 42, height: 42 }}
        title={name}
      >
        {name.charAt(0).toUpperCase()}
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-80 mx-4 p-7 z-10">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none"
            >
              ×
            </button>

            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="w-20 h-20 rounded-full bg-green-600 text-white flex items-center justify-center text-4xl font-bold">
                {name.charAt(0).toUpperCase()}
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-800 dark:text-white">{name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Accountant</p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Employee ID</span>
                <span className="font-semibold text-gray-800 dark:text-white">{employeeId}</span>
              </div>
              {email && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">Email</span>
                  <span className="font-semibold text-gray-800 dark:text-white truncate max-w-[160px]">{email}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Status</span>
                <span className={`font-semibold ${isOnline ? "text-green-600" : "text-red-500"}`}>
                  {isOnline ? "● Online" : "● Offline"}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold text-base transition-colors"
            >
              <FaSignOutAlt />
              Logout
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Main Layout ─── */
const Accountant = () => {
  const [active, setActive] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("isDark") === "true");
  const mainRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("isDark", String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
  }, [active]);

  const renderContent = () => {
    switch (active) {
      case "dashboard":    return <AccountantDashboard />;
      case "orderbilling": return <AccountantOrderBilling />;
      case "vendorbilling":return <AccountantVendorBilling />;
      case "attendance":   return <AccountantAttendance />;
      case "notes":        return <AccountantNotes />;
      case "profile":      return <AccountantProfile />;
      case "messages":     return <AccountantMessage />;
      case "settings":     return <SettingsPage />;
      case "notifications":return <AccountantNotification />;
      default:             return <div className="p-4">Page not found</div>;
    }
  };

  return (
    <div className="h-screen w-full bg-green-50 dark:bg-neutral-900">
      {/* ===== Mobile Header ===== */}
      <div className="lg:hidden sticky top-0 z-40 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <FaBars className="text-gray-600 dark:text-gray-300" />
          <div className="flex items-center gap-3">
            <button onClick={() => setDarkMode((v) => !v)}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <AccountantProfileButton />
          </div>
        </div>
      </div>

      <div className="flex h-full">
        {/* ===== Sidebar (desktop) ===== */}
        <aside className="hidden lg:block w-72 shrink-0">
          <AccountantSidebar active={active} setActive={setActive} />
        </aside>

        {/* ===== Right Column ===== */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* ── Top Bar (desktop) ── */}
          <div className="hidden lg:flex items-center justify-between px-6 py-3 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">
              {active.replace(/-/g, " ")}
            </p>
            <div className="flex items-center gap-3">
              <button onClick={() => setDarkMode((v) => !v)}>
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <AccountantProfileButton />
            </div>
          </div>

          {/* ===== Main Content ===== */}
          <main
            ref={mainRef}
            className="flex-1 overflow-y-auto bg-white dark:bg-neutral-800 p-6"
          >
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Accountant;
