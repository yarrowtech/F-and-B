import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Moon, Sun } from "lucide-react";

import Sidebar from "./VendorSidebar";
import { VENDOR_NAV_ITEMS } from "./vendorNavItems";
import VendorInventory from "./VendorInventory";
import VendorStockInventory from "./VendorStockInventory";
import VendorManagement from "./VendorManagement";
import VendorAccounts from "./VendorAccounts";
import VendorNotes from "./VendorNotes";
import VendorSettings from "./VendorSettings";
import VendorMessages from "./VendorMessages";
import VendorDashboard from "./VendorDashboard";
import VendorNotification from "./VendorNotification";
import VendorAnalytics from "./VendorAnalytics";
import VendorUpgradeRequest from "./VendorUpgradeRequest";
import API from "../../services/api";

const PAGE_LABELS = {
  dashboard: "Dashboard",
  "my-products": "My Products",
  inventory: "Inventory",
  "vendor-management": "Management",
  account: "Account",
  analytics: "Analytics",
  "upgrade-request": "Upgrade",
  notes: "Notes",
  settings: "Settings",
  messages: "Messages",
  notifications: "Notifications",
};

const getVendorId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return user?.id || user?._id || "";
  } catch {
    return "";
  }
};

function VendorProfileButton() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const user = JSON.parse(localStorage.getItem("user") || "null") || {};
  const name = user?.name || (user?.email || "vendor").split("@")[0];
  const vendorId = user?.vendorId || "N/A";
  const email = user?.email || "";
  const initial = name.charAt(0).toUpperCase();

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-600 text-sm font-bold text-white shadow transition hover:bg-green-700"
        title={name}
      >
        {initial}
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative z-10 mx-4 w-80 rounded-2xl bg-white p-7 shadow-2xl dark:bg-neutral-800">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 text-2xl leading-none text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              &times;
            </button>

            <div className="mb-6 flex flex-col items-center gap-3">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-600 text-4xl font-bold text-white">
                {initial}
              </div>
              <div className="text-center">
                <p className="text-xl font-bold capitalize text-gray-800 dark:text-white">{name}</p>
                <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">Vendor</p>
              </div>
            </div>

            <div className="mb-6 space-y-3 rounded-xl bg-gray-50 p-4 dark:bg-neutral-700">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-500 dark:text-gray-400">Vendor ID</span>
                <span className="font-semibold text-gray-800 dark:text-white">{vendorId}</span>
              </div>
              {email && (
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-500 dark:text-gray-400">Email</span>
                  <span className="max-w-[160px] truncate font-semibold text-gray-800 dark:text-white">
                    {email}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-500 dark:text-gray-400">Status</span>
                <span className={`font-semibold ${isOnline ? "text-green-600" : "text-red-500"}`}>
                  {isOnline ? "● Online" : "● Offline"}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3 text-base font-semibold text-white transition-colors hover:bg-red-700"
            >
              <LogOut size={17} />
              Logout
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const VendorPanel = () => {
  const [active, setActive] = useState("dashboard");
  const [requestCount, setRequestCount] = useState(0);
  const [darkMode, setDarkMode] = useState(() => {
    const savedIsDark = localStorage.getItem("isDark");
    if (savedIsDark !== null) return savedIsDark === "true";

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return savedTheme === "dark";

    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const mainRef = useRef(null);
  const vendorId = getVendorId();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("isDark", String(darkMode));
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    if (!vendorId) return undefined;

    let ignore = false;

    const loadRequestCount = async () => {
      try {
        const res = await API.get(`/vendor/${vendorId}/orders`);
        const orders = Array.isArray(res.data?.orders) ? res.data.orders : [];
        const count = orders.filter((order) => order.status === "processing").length;
        if (!ignore) setRequestCount(count);
      } catch {
        if (!ignore) setRequestCount(0);
      }
    };

    loadRequestCount();
    const intervalId = window.setInterval(loadRequestCount, 30000);

    return () => {
      ignore = true;
      window.clearInterval(intervalId);
    };
  }, [vendorId, active]);

  const handleSetActive = (section) => {
    setActive(section);
    requestAnimationFrame(() => mainRef.current?.scrollTo({ top: 0, behavior: "smooth" }));
  };

  const renderContent = () => {
    switch (active) {
      case "inventory":
        return <VendorStockInventory />;
      case "my-products":
        return <VendorInventory />;
      case "vendor-management":
        return <VendorManagement />;
      case "account":
        return <VendorAccounts />;
      case "notes":
        return <VendorNotes />;
      case "settings":
        return <VendorSettings />;
      case "messages":
        return <VendorMessages />;
      case "dashboard":
        return <VendorDashboard />;
      case "notifications":
        return <VendorNotification />;
      case "analytics":
        return <VendorAnalytics />;
      case "upgrade-request":
        return <VendorUpgradeRequest />;
      default:
        return (
          <div className="p-6 text-center font-semibold text-red-500">
            Unknown section: "{active}" - please select a valid panel.
          </div>
        );
    }
  };

  return (
    <div className="h-screen w-full bg-green-50 dark:bg-neutral-900">
      {/* ===== Mobile Header ===== */}
      <div className="2xl:hidden sticky top-0 z-40 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-base font-bold text-green-700 dark:text-green-400 capitalize">
            {PAGE_LABELS[active] ?? "Vendor"}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode((current) => !current)}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <VendorProfileButton />
          </div>
        </div>
      </div>

      <div className="flex h-full">
        {/* ===== Sidebar ===== */}
        <aside className="hidden 2xl:block w-72 shrink-0">
          <Sidebar activeSection={active} setActiveSection={handleSetActive} requestCount={requestCount} />
        </aside>

        {/* ===== Right Column ===== */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* ── Top Bar (desktop) ── */}
          <div className="hidden 2xl:flex items-center justify-between px-6 py-3 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">
              {PAGE_LABELS[active] ?? active}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDarkMode((current) => !current)}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <VendorProfileButton />
            </div>
          </div>

          {/* ===== Main Content ===== */}
          <main
            ref={mainRef}
            className="flex-1 overflow-y-auto bg-white dark:bg-neutral-800 p-4 sm:p-6 pb-24 2xl:pb-6"
          >
            {renderContent()}
          </main>
        </div>
      </div>

      {/* ===== Bottom Navigation (mobile & tablet only) ===== */}
      <nav className="2xl:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-neutral-800 border-t border-gray-200 dark:border-gray-700 flex items-stretch overflow-x-auto shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
        {VENDOR_NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          const badgeCount = id === "vendor-management" ? requestCount : 0;
          const iconNode = React.createElement(Icon, { size: 18 });
          return (
            <button
              key={id}
              onClick={() => handleSetActive(id)}
              className={`min-w-[72px] flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold transition-colors
                ${isActive
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-400 dark:text-gray-500 hover:text-green-500 dark:hover:text-green-400"
                }`}
            >
              <span className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-colors
                ${isActive ? "bg-green-100 dark:bg-green-900/40" : ""}`}>
                {iconNode}
                {badgeCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold leading-none text-white">
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                )}
              </span>
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default VendorPanel;
