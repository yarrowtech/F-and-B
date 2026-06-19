import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { FaShieldAlt, FaSignOutAlt, FaStickyNote, FaTachometerAlt, FaUsers, FaEnvelope } from "react-icons/fa";
import { Moon, Sun } from "lucide-react";

import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";
import UserManagement from "./UserManagement";
import AdminManagement from "./AdminManagement";
import Notepad from "./Notepad";
import ContactInquiries from "./ContactInquiries";

/* ─── Profile Popup ─── */
function SuperAdminProfileButton() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const user = JSON.parse(localStorage.getItem("user")) || {};
  const email = user?.email || localStorage.getItem("superAdminEmail") || "";
  const name = email ? email.split("@")[0].replace(/\./g, " ") : "Super Admin";

  useEffect(() => {
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online",  on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online",  on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("theme");
    localStorage.removeItem("superAdminEmail");
    navigate("/superadmin-login");
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
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
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
                <p className="text-xl font-bold text-gray-800 dark:text-white capitalize">{name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Super Administrator</p>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-3 mb-6">
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
const BOTTOM_NAV = [
  { key: "dashboard",          label: "Dashboard", icon: FaTachometerAlt },
  { key: "user-management",    label: "Users",     icon: FaUsers },
  { key: "admin-management",   label: "Admins",    icon: FaShieldAlt },
  { key: "contact-inquiries",  label: "Inquiries", icon: FaEnvelope },
  { key: "notepad",            label: "Notes",     icon: FaStickyNote },
];

const getInitialDarkMode = () => {
  const savedIsDark = localStorage.getItem("isDark");
  if (savedIsDark !== null) return savedIsDark === "true";

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) return savedTheme === "dark";

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const SuperAdmin = () => {
  const [active, setActive] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);

  const mainRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("isDark", String(darkMode));
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [active]);

  const handleModeChange = () => {
    setDarkMode((current) => !current);
  };

  const handleSetActive = useCallback((section) => {
    setActive(section);
  }, []);

  const renderContent = () => {
    switch (active) {
      case "dashboard":        return <Dashboard />;
      case "user-management":  return <UserManagement />;
      case "admin-management": return <AdminManagement />;
      case "contact-inquiries": return <ContactInquiries />;
      case "notepad":           return <Notepad />;
      default:                  return <div className="p-4">Page not found</div>;
    }
  };

  return (
    <div className="h-screen w-full bg-green-50 dark:bg-neutral-900">
      {/* ===== Mobile Header ===== */}
      <div className="2xl:hidden sticky top-0 z-40 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-base font-bold text-green-700 dark:text-green-400 capitalize">
            {BOTTOM_NAV.find((n) => n.key === active)?.label ?? "Super Admin"}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={handleModeChange}
              className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-700"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <SuperAdminProfileButton />
          </div>
        </div>
      </div>

      <div className="flex h-full">
        {/* ===== Sidebar (desktop) ===== */}
        <aside className="hidden 2xl:block shrink-0">
          <Sidebar active={active} setActive={handleSetActive} />
        </aside>

        {/* ===== Right Column ===== */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* ── Top Bar (desktop) ── */}
          <div className="hidden 2xl:flex items-center justify-between px-6 py-3 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">
              {active.replace(/-/g, " ")}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleModeChange}
                className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-700"
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                aria-label="Toggle theme"
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <SuperAdminProfileButton />
            </div>
          </div>

          {/* ===== Main Content ===== */}
          <main
            ref={mainRef}
            className="flex-1 overflow-y-auto bg-white dark:bg-neutral-800 p-3 sm:p-4 2xl:p-6 pb-24 2xl:pb-6"
          >
            {renderContent()}
          </main>
        </div>
      </div>

      {/* ===== Bottom Navigation (mobile & tablet only) ===== */}
      <nav className="2xl:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-neutral-800 border-t border-gray-200 dark:border-gray-700 flex items-stretch shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
        {BOTTOM_NAV.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => handleSetActive(key)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold transition-colors
                ${isActive
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-400 dark:text-gray-500 hover:text-green-500 dark:hover:text-green-400"
                }`}
            >
              <span className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors
                ${isActive ? "bg-green-100 dark:bg-green-900/40" : ""}`}>
                {React.createElement(Icon, { size: 18 })}
              </span>
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default SuperAdmin;
