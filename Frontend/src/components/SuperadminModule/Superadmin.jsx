import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaBars, FaSignOutAlt } from "react-icons/fa";
import { Moon, Sun } from "lucide-react";

import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";
import UserManagement from "./UserManagement";
import AdminManagement from "./AdminManagement";
import Notepad from "./Notepad";

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
const SuperAdmin = () => {
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("isDark") === "true"
  );

  const mainRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [active]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [sidebarOpen]);

  const handleModeChange = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("isDark", String(next));
  };

  const handleSetActive = (section) => {
    setActive(section);
    setSidebarOpen(false);
  };

  const renderContent = () => {
    switch (active) {
      case "dashboard":        return <Dashboard />;
      case "user-management":  return <UserManagement />;
      case "admin-management": return <AdminManagement />;
      case "notepad":          return <Notepad />;
      default:                 return <div className="p-4">Page not found</div>;
    }
  };

  return (
    <div className="h-screen w-full bg-green-50 dark:bg-neutral-900">
      {/* ===== Mobile Header ===== */}
      <div className="lg:hidden sticky top-0 z-40 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => setSidebarOpen(true)}>
            <FaBars />
          </button>
          <div className="flex items-center gap-3">
            <button onClick={handleModeChange}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <SuperAdminProfileButton />
          </div>
        </div>
      </div>

      <div className="flex h-full">
        {/* ===== Sidebar (desktop) ===== */}
        <aside className="hidden lg:block shrink-0">
          <Sidebar active={active} setActive={handleSetActive} />
        </aside>

        {/* ===== Mobile Sidebar Drawer ===== */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-[1000] lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed top-0 left-0 h-full z-[1001] lg:hidden">
              <Sidebar active={active} setActive={handleSetActive} />
            </div>
          </>
        )}

        {/* ===== Right Column ===== */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* ── Top Bar (desktop) ── */}
          <div className="hidden lg:flex items-center justify-between px-6 py-3 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">
              {active.replace(/-/g, " ")}
            </p>
            <div className="flex items-center gap-3">
              <button onClick={handleModeChange}>
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <SuperAdminProfileButton />
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

export default SuperAdmin;
