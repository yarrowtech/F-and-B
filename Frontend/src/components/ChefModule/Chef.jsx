import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSignOutAlt,
  FaTachometerAlt,
  FaUserTie,
  FaClipboardCheck,
  FaUserCircle,
  FaStickyNote,
  FaBell,
} from "react-icons/fa";
import { Moon, Printer, RefreshCw, Sun } from "lucide-react";

import ChefSidebar from "./ChefSidebar";
import ChefSettings from "./ChefSettings";
import ChefNotes from "./ChefNotes";
import ChefProfile from "./ChefProfile";
import ChefAttendance from "./ChefAttendance";
import ChefInventory from "./ChefInventory";
import ChefManagement from "./ChefManagement";
import ChefDashboard from "./ChefDashboard";
import ChefMessage from "./ChefMessage";
import ChefNotifications from "./ChefNotification";
import { getUser, logout } from "../../services/auth.service";
import { getMyKotPrintJobs, markMyKotPrintJobPrinted } from "../../services/kotPrint.service";
import { printOnThisDevice } from "../../services/localPrint.service";
import socket from "../../socket/socket";

function ChefProfileButton() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const user = getUser() || {};
  const name = user?.name || "Chef";
  const employeeId = user?.employeeId || user?.id?.slice(-6) || "N/A";
  const email = user?.email || "";

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
    logout();
    navigate("/chef-login");
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
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-7 z-10">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none"
            >
              x
            </button>

            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="w-20 h-20 rounded-full bg-green-600 text-white flex items-center justify-center text-4xl font-bold">
                {name.charAt(0).toUpperCase()}
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-800 dark:text-white">{name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Chef</p>
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
                  {isOnline ? "Online" : "Offline"}
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

const BOTTOM_NAV = [
  { key: "dashboard", label: "Dashboard", icon: FaTachometerAlt },
  { key: "management", label: "Orders", icon: FaUserTie },
  { key: "attendance", label: "Attendance", icon: FaClipboardCheck },
  { key: "profile", label: "Profile", icon: FaUserCircle },
  { key: "notes", label: "Notes", icon: FaStickyNote },
  { key: "notification", label: "Alerts", icon: FaBell },
];

const getInitialDarkMode = () => {
  const savedIsDark = localStorage.getItem("isDark");
  if (savedIsDark !== null) return savedIsDark === "true";

  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) return savedTheme === "dark";

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const Chef = () => {
  const [active, setActive] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);
  const [notificationOrderIds, setNotificationOrderIds] = useState([]);
  const [printNotice, setPrintNotice] = useState("");
  const [kotPrintJobs, setKotPrintJobs] = useState([]);
  const [kotLoading, setKotLoading] = useState(false);
  const [kotPrintingId, setKotPrintingId] = useState("");
  const mainRef = useRef(null);

  const chefRestaurantId = (() => {
    try {
      const user =
        JSON.parse(localStorage.getItem("employee")) ||
        JSON.parse(localStorage.getItem("user"));
      return String(user?.restaurant?._id || user?.restaurant || "");
    } catch {
      return "";
    }
  })();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("isDark", String(darkMode));
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
  }, [active]);

  useEffect(() => {
    const handleNewOrder = (payload) => {
      if (
        chefRestaurantId &&
        payload?.restaurant &&
        String(payload.restaurant) !== chefRestaurantId
      ) {
        return;
      }

      setNotificationOrderIds((prev) => {
        const orderId = payload?.orderId || "";
        if (!orderId || prev.includes(orderId)) return prev;
        return [orderId, ...prev];
      });
    };

    const handleOrderAccepted = (payload) => {
      const orderId = payload?.orderId || payload?.detail?.orderId;
      setNotificationOrderIds((prev) =>
        prev.filter((item) => item !== orderId)
      );
    };

    socket.on("chef:new-order", handleNewOrder);
    socket.on("chef:order-accepted", handleOrderAccepted);
    window.addEventListener("chef-notification-dismissed", handleOrderAccepted);
    return () => {
      socket.off("chef:new-order", handleNewOrder);
      socket.off("chef:order-accepted", handleOrderAccepted);
      window.removeEventListener("chef-notification-dismissed", handleOrderAccepted);
    };
  }, [chefRestaurantId]);

  const loadKotPrintJobs = useCallback(async ({ showLoading = false } = {}) => {
    try {
      if (showLoading) setKotLoading(true);
      const jobs = await getMyKotPrintJobs();
      setKotPrintJobs(jobs);
      if (jobs.length > 0) {
        setPrintNotice(`Pending KOT print job${jobs.length === 1 ? "" : "s"}: ${jobs.length}`);
      }
    } catch (err) {
      console.error("Failed to load KOT print jobs", err);
    } finally {
      if (showLoading) setKotLoading(false);
    }
  }, []);

  useEffect(() => {
    loadKotPrintJobs();
    const timer = setInterval(() => loadKotPrintJobs(), 2500);
    return () => clearInterval(timer);
  }, [loadKotPrintJobs]);

  const handlePrintKotJob = async (job) => {
    if (!job?._id || !job.receiptText) return;

    try {
      setKotPrintingId(job._id);
      await printOnThisDevice({
        receiptText: job.receiptText,
        printerName: "",
      });
      await markMyKotPrintJobPrinted(job._id);
      setPrintNotice(`KOT printed: ${job.cuisine || "Kitchen"}`);
      await loadKotPrintJobs();
    } catch (err) {
      setPrintNotice(
        `KOT print failed. Start printer helper on this billing machine: npm run local:print-agent`
      );
      console.error("KOT print failed", err);
    } finally {
      setKotPrintingId("");
    }
  };

  const handleSetActive = useCallback((section) => {
    setActive(section);
    if (section === "notification") {
      setNotificationOrderIds([]);
    }
  }, []);

  const renderContent = () => {
    switch (active) {
      case "dashboard":
        return <ChefDashboard />;
      case "management":
        return <ChefManagement />;
      case "inventory":
        return <ChefInventory />;
      case "attendance":
        return <ChefAttendance />;
      case "notes":
        return <ChefNotes />;
      case "profile":
        return <ChefProfile />;
      case "settings":
        return <ChefSettings />;
      case "message":
        return <ChefMessage />;
      case "notification":
        return <ChefNotifications />;
      default:
        return <div className="p-4">Page not found</div>;
    }
  };

  const renderKotPrintQueue = () => {
    if (kotPrintJobs.length === 0) return null;

    return (
      <section className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/60 dark:bg-amber-950/30">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-black uppercase text-amber-900 dark:text-amber-100">
              KOT Queue
            </p>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-200">
              Cuisine matched tickets waiting for chef print
            </p>
          </div>
          <button
            type="button"
            onClick={() => loadKotPrintJobs({ showLoading: true })}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-amber-300 bg-white px-3 text-xs font-bold text-amber-900 transition hover:bg-amber-100 disabled:opacity-60 dark:border-amber-800 dark:bg-neutral-900 dark:text-amber-100 dark:hover:bg-amber-950"
            disabled={kotLoading}
            title="Refresh KOT queue"
          >
            <RefreshCw size={15} className={kotLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {kotPrintJobs.map((job) => (
            <article
              key={job._id}
              className="rounded-lg border border-amber-200 bg-white p-3 shadow-sm dark:border-amber-900/50 dark:bg-neutral-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-gray-900 dark:text-white">
                    {job.payload?.kotNo || "Kitchen KOT"}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400">
                    {job.cuisine || "Kitchen"} - Table {job.payload?.tableNumber || "N/A"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handlePrintKotJob(job)}
                  disabled={kotPrintingId === job._id}
                  className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md bg-green-700 px-3 text-xs font-bold text-white transition hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                  title="Print KOT from this billing machine"
                >
                  <Printer size={15} />
                  {kotPrintingId === job._id ? "Printing" : "Print"}
                </button>
              </div>
              <pre className="mt-3 max-h-36 overflow-auto whitespace-pre-wrap rounded-md bg-gray-50 p-2 font-mono text-[11px] leading-4 text-gray-700 dark:bg-neutral-800 dark:text-gray-200">
                {job.receiptText}
              </pre>
            </article>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="h-screen w-full bg-green-50 dark:bg-neutral-900">
      <div className="lg:hidden sticky top-0 z-40 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-base font-bold text-green-700 dark:text-green-400 capitalize">
            {BOTTOM_NAV.find((item) => item.key === active)?.label ?? "Chef"}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode((value) => !value)}
              className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-700"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <ChefProfileButton />
          </div>
        </div>
      </div>

      <div className="flex h-full">
        <aside className="hidden lg:block w-72 shrink-0">
          <ChefSidebar
            active={active}
            setActive={handleSetActive}
            notificationCount={notificationOrderIds.length}
          />
        </aside>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="hidden lg:flex items-center justify-between px-6 py-3 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">
              {active.replace(/-/g, " ")}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDarkMode((value) => !value)}
                className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-neutral-700"
                title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                aria-label="Toggle theme"
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <ChefProfileButton />
            </div>
          </div>

          <main
            ref={mainRef}
            className="flex-1 overflow-y-auto bg-white p-3 pb-24 dark:bg-neutral-800 sm:p-4 lg:p-6 lg:pb-6"
          >
            {printNotice && (
              <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
                {printNotice}
              </div>
            )}
            {renderKotPrintQueue()}
            {renderContent()}
          </main>
        </div>
      </div>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-neutral-800 border-t border-gray-200 dark:border-gray-700 flex items-stretch shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
        {BOTTOM_NAV.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => handleSetActive(key)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold transition-colors ${
                isActive
                  ? "text-green-600 dark:text-green-400"
                  : "text-gray-400 dark:text-gray-500 hover:text-green-500 dark:hover:text-green-400"
              }`}
            >
              <span
                className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                  isActive ? "bg-green-100 dark:bg-green-900/40" : ""
                }`}
              >
                {React.createElement(Icon, { size: 18 })}
                {key === "notification" && notificationOrderIds.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-black text-white">
                    {notificationOrderIds.length > 9 ? "9+" : notificationOrderIds.length}
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

export default Chef;
