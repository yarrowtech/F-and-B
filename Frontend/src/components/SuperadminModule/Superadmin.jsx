import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Sun,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";
import UserManagement from "./UserManagement";
import AdminManagement from "./AdminManagement";
import Notepad from "./Notepad";

function SuperAdminProfileButton() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const user = JSON.parse(localStorage.getItem("user")) || {};
  const email = user?.email || localStorage.getItem("superAdminEmail") || "";
  const name = email ? email.split("@")[0].replace(/\./g, " ") : "Super Admin";

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
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
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 text-sm font-bold text-white shadow-sm transition hover:from-emerald-600 hover:to-cyan-600"
        title={name}
      >
        {name.charAt(0).toUpperCase()}
      </button>

      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4">
          <button
            aria-label="Close profile"
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-xl border border-white/20 bg-gradient-to-br from-white via-emerald-50 to-sky-50 shadow-2xl dark:border-neutral-700 dark:bg-gradient-to-br dark:from-[#1b222c] dark:via-[#182028] dark:to-[#231b20]">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-neutral-800">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Account
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Super admin session
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-neutral-800 dark:hover:text-gray-200"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 text-2xl font-bold text-white">
                  {name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold capitalize text-gray-900 dark:text-white">
                    {name}
                  </p>
                  <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                    {email || "N/A"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-white/70 p-4 dark:bg-white/5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Status</span>
                  <span
                    className={`inline-flex items-center gap-2 font-medium ${
                      isOnline ? "text-emerald-600" : "text-rose-500"
                    }`}
                  >
                    {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                    {isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="w-full rounded-lg bg-gradient-to-r from-rose-500 to-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:from-rose-600 hover:to-orange-600"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const sectionMeta = {
  dashboard: {
    title: "Dashboard",
    subtitle: "System health, growth, and control in one place.",
  },
  "user-management": {
    title: "User Management",
    subtitle: "Create, review, and secure platform accounts.",
  },
  "admin-management": {
    title: "Admin Management",
    subtitle: "Track business accounts and operational ownership.",
  },
  notepad: {
    title: "Notes",
    subtitle: "Keep operational reminders and decisions close by.",
  },
};

const SuperAdmin = () => {
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsedSidebar, setCollapsedSidebar] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("theme") === "dark"
  );

  const mainRef = useRef(null);

  const user = JSON.parse(localStorage.getItem("user")) || {};
  const email = user?.email || localStorage.getItem("superAdminEmail") || "";
  const adminName = useMemo(() => {
    const raw = email ? email.split("@")[0] : "Super Admin";
    return raw.replace(/\./g, " ");
  }, [email]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const handleSetActive = (section) => {
    setActive(section);
    setSidebarOpen(false);

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
      case "admin-management":
        return <AdminManagement />;
      case "notepad":
        return <Notepad />;
      default:
        return null;
    }
  };

  const currentMeta = sectionMeta[active] || sectionMeta.dashboard;

  return (
    <div className="flex h-[100dvh] w-full bg-gradient-to-br from-emerald-50 via-sky-50 to-amber-50 text-gray-900 dark:bg-gradient-to-br dark:from-[#10151d] dark:via-[#131a23] dark:to-[#1f1820] dark:text-white">
      <Sidebar
        activeSection={active}
        setActiveSection={handleSetActive}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1">
        <aside
          className={`hidden border-r border-white/30 bg-gradient-to-b from-white/90 via-emerald-50/80 to-sky-50/80 backdrop-blur xl:block dark:border-white/10 dark:bg-gradient-to-b dark:from-[#141b24] dark:via-[#151d24] dark:to-[#1d1821] ${
            collapsedSidebar ? "w-24" : "w-72"
          } transition-all duration-300`}
        >
          <Sidebar
            activeSection={active}
            setActiveSection={handleSetActive}
            collapsed={collapsedSidebar}
          />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/30 bg-gradient-to-r from-white/80 via-emerald-50/80 to-sky-50/80 backdrop-blur dark:border-white/10 dark:bg-gradient-to-r dark:from-[#151b23]/95 dark:via-[#18202a]/95 dark:to-[#211a21]/95">
            <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="rounded-lg border border-white/60 bg-white/80 p-2.5 text-gray-700 transition hover:bg-white xl:hidden dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-200 dark:hover:bg-neutral-800"
                  aria-label="Open menu"
                >
                  <Menu size={18} />
                </button>

                <button
                  onClick={() => setCollapsedSidebar((value) => !value)}
                  className="hidden rounded-lg border border-white/60 bg-white/80 p-2.5 text-gray-700 transition hover:bg-white xl:inline-flex dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-200 dark:hover:bg-neutral-800"
                  aria-label="Toggle sidebar width"
                >
                  {collapsedSidebar ? (
                    <PanelLeftOpen size={18} />
                  ) : (
                    <PanelLeftClose size={18} />
                  )}
                </button>

                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-rose-500 dark:text-rose-300">
                    Super Admin
                  </p>
                  <h1 className="truncate text-lg font-semibold sm:text-2xl">
                    {currentMeta.title}
                  </h1>
                </div>
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden items-center gap-3 rounded-lg border border-white/60 bg-white/80 px-3 py-2 text-sm text-gray-500 lg:flex dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-400">
                  <Search size={16} />
                  <span className="max-w-44 truncate">Search panels, users, and notes</span>
                </div>

                <button
                  className="rounded-lg border border-white/60 bg-white/80 p-2.5 text-gray-600 transition hover:bg-white dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-300 dark:hover:bg-neutral-800"
                  aria-label="Notifications"
                >
                  <Bell size={18} />
                </button>

                <button
                  onClick={() => setDarkMode((value) => !value)}
                  className="rounded-lg border border-white/60 bg-white/80 p-2.5 text-gray-600 transition hover:bg-white dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-300 dark:hover:bg-neutral-800"
                  aria-label="Toggle theme"
                >
                  {darkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <SuperAdminProfileButton />
              </div>
            </div>
          </header>

          <main
            ref={mainRef}
            className="min-h-0 flex-1 overflow-y-auto bg-transparent px-4 py-4 sm:px-6 sm:py-6"
          >
            <div className="mb-6 rounded-xl border border-white/40 bg-gradient-to-r from-white via-emerald-50/80 to-amber-50/80 px-5 py-5 shadow-[0_18px_40px_-28px_rgba(14,165,233,0.45)] dark:border-white/10 dark:bg-gradient-to-r dark:from-[#181f28] dark:via-[#172129] dark:to-[#231d22]">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {currentMeta.subtitle}
                  </p>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    Signed in as <span className="font-semibold capitalize">{adminName}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-medium">
                  <span className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1.5 text-white">
                    Live session
                  </span>
                  <span className="rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 px-3 py-1.5 text-white">
                    Control center
                  </span>
                </div>
              </div>
            </div>

            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SuperAdmin;
