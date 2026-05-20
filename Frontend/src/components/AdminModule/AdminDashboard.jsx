import React, { useEffect, useState, useCallback } from "react";
import { getAdminSummary, getRestaurantBreakdown } from "../../services/adminDashboard.service";

/* ── currency formatter ── */
const fmt = (v) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

const formatRole = (role = "") =>
  role
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

/* ── quick filter presets ── */
const PRESETS = [
  { label: "All Time",    key: "all" },
  { label: "Today",       key: "today" },
  { label: "Last 7 Days", key: "7days" },
  { label: "This Week",   key: "week" },
  { label: "Last Month",  key: "lastmonth" },
];

const getDateRange = (key) => {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (key) {
    case "today":
      return { startDate: today.toISOString().slice(0, 10), endDate: now.toISOString().slice(0, 10) };
    case "7days": {
      const s = new Date(today); s.setDate(s.getDate() - 6);
      return { startDate: s.toISOString().slice(0, 10), endDate: now.toISOString().slice(0, 10) };
    }
    case "week": {
      const s = new Date(today); s.setDate(s.getDate() - today.getDay());
      return { startDate: s.toISOString().slice(0, 10), endDate: now.toISOString().slice(0, 10) };
    }
    case "lastmonth": {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: s.toISOString().slice(0, 10), endDate: e.toISOString().slice(0, 10) };
    }
    default:
      return { startDate: "", endDate: "" };
  }
};

/* ── row accent colours cycling per restaurant ── */
const ROW_COLORS = [
  "border-l-4 border-l-violet-500",
  "border-l-4 border-l-sky-500",
  "border-l-4 border-l-emerald-500",
  "border-l-4 border-l-amber-500",
  "border-l-4 border-l-rose-500",
  "border-l-4 border-l-pink-500",
  "border-l-4 border-l-cyan-500",
  "border-l-4 border-l-orange-500",
];

/* ══════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════ */
const AdminDashboard = () => {
  const [summary,   setSummary]   = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");

  const [activePreset, setActivePreset] = useState("all");
  const [startDate,    setStartDate]    = useState("");
  const [endDate,      setEndDate]      = useState("");
  const [customActive, setCustomActive] = useState(false);

  const fetchData = useCallback(async (params) => {
    try {
      setLoading(true);
      setError("");
      const [s, b] = await Promise.all([
        getAdminSummary(params),
        getRestaurantBreakdown(params),
      ]);
      setSummary(s.data?.data   || {});
      setBreakdown(b.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData({}); }, [fetchData]);

  const applyPreset = (key) => {
    setActivePreset(key);
    setCustomActive(false);
    setStartDate("");
    setEndDate("");
    fetchData(getDateRange(key));
  };

  const applyCustom = () => {
    if (!startDate && !endDate) return;
    setActivePreset("");
    setCustomActive(true);
    fetchData({ startDate, endDate });
  };

  const reset = () => {
    setActivePreset("all");
    setCustomActive(false);
    setStartDate("");
    setEndDate("");
    fetchData({});
  };

  const totalOrders      = summary?.totalOrders      ?? 0;
  const totalRevenue     = summary?.totalRevenue     ?? 0;
  const totalRestaurants = summary?.totalRestaurants ?? 0;
  const totalEmployees   = summary?.totalEmployees   ?? 0;

  return (
    <div className="min-h-screen space-y-8 bg-gradient-to-br from-slate-100 to-blue-50 p-4 dark:from-gray-900 dark:to-gray-800 sm:p-6">

      {/* ── HEADER ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white sm:text-3xl">Admin Dashboard</h1>
        <p className="text-base text-gray-500 dark:text-gray-400 mt-1">Restaurant performance overview</p>
      </div>

      {/* ── FILTERS ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 space-y-4 border border-gray-100 dark:border-gray-700">

        {/* preset chips */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(({ label, key }) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className={`px-5 py-2.5 rounded-xl text-base font-semibold transition-all ${
                activePreset === key && !customActive
                  ? "bg-violet-600 text-white shadow-md shadow-violet-200 dark:shadow-violet-900"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-violet-50 dark:hover:bg-gray-600 hover:text-violet-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* custom date range */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <button
            onClick={applyCustom}
            disabled={!startDate && !endDate}
            className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-xl text-base font-semibold transition-colors shadow-sm"
          >
            Apply
          </button>
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-xl text-base font-semibold transition-colors"
          >
            Reset
          </button>
        </div>

        {customActive && startDate && (
          <p className="text-sm text-violet-600 dark:text-violet-400 font-medium">
            Showing: {startDate} → {endDate || "now"}
          </p>
        )}
      </div>

      {/* ── CONTENT ── */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <p className="text-lg text-gray-400 dark:text-gray-500 animate-pulse">Loading dashboard…</p>
        </div>
      ) : error ? (
        <p className="text-lg text-red-500 bg-red-50 dark:bg-red-900/20 px-5 py-4 rounded-xl">{error}</p>
      ) : (
        <>
          {/* ── STAT CARDS ── */}
          <section>
            <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-4">Overall Summary</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

              {/* Orders */}
              <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg shadow-violet-200 dark:shadow-violet-900">
                <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
                <div className="absolute -right-2 bottom-2 w-16 h-16 rounded-full bg-white/10" />
                <p className="text-base font-medium text-violet-100 mb-2">Total Orders</p>
                <p className="text-4xl font-extrabold sm:text-5xl">{totalOrders}</p>
              </div>

              {/* Revenue */}
              <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900">
                <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
                <div className="absolute -right-2 bottom-2 w-16 h-16 rounded-full bg-white/10" />
                <p className="text-base font-medium text-emerald-100 mb-2">Total Revenue</p>
                <p className="text-3xl font-extrabold sm:text-4xl">{fmt(totalRevenue)}</p>
              </div>

              {/* Restaurants */}
              <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-200 dark:shadow-amber-900">
                <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
                <div className="absolute -right-2 bottom-2 w-16 h-16 rounded-full bg-white/10" />
                <p className="text-base font-medium text-amber-100 mb-2">Total Restaurants</p>
                <p className="text-4xl font-extrabold sm:text-5xl">{totalRestaurants}</p>
              </div>

              {/* Employees */}
              <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-sky-500 to-cyan-600 text-white shadow-lg shadow-sky-200 dark:shadow-sky-900">
                <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10" />
                <div className="absolute -right-2 bottom-2 w-16 h-16 rounded-full bg-white/10" />
                <p className="text-base font-medium text-sky-100 mb-2">Total Employees</p>
                <p className="text-4xl font-extrabold sm:text-5xl">{totalEmployees}</p>
              </div>

            </div>
          </section>

          {/* ── RESTAURANT BREAKDOWN ── */}
          <section>
            <h2 className="text-lg font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-4">Restaurant-wise Summary</h2>

            {breakdown.length === 0 ? (
              <p className="text-lg text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 rounded-2xl px-6 py-10 text-center shadow-sm">
                No data for this period.
              </p>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {breakdown.map((r, idx) => {
                  const color = ROW_COLORS[idx % ROW_COLORS.length];
                  return (
                    <div
                      key={r._id}
                      className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow px-6 py-5 space-y-5 ${color}`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 text-white flex items-center justify-center text-base font-bold shrink-0">
                            {idx + 1}
                          </div>
                          <p className="text-lg font-bold text-gray-800 dark:text-white truncate">{r.name}</p>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-right">
                          <div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">Orders</p>
                            <p className="text-2xl font-extrabold text-violet-600 dark:text-violet-400">{r.totalOrders}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">Revenue</p>
                            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{fmt(r.totalRevenue)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">Employees</p>
                            <p className="text-2xl font-extrabold text-sky-600 dark:text-sky-400">{r.totalEmployees || 0}</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="rounded-xl bg-gray-50 dark:bg-gray-900/40 p-4">
                          <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide mb-3">Employee Roles</p>
                          {r.employeeRoles?.length ? (
                            <div className="flex flex-wrap gap-2">
                              {r.employeeRoles.map((role) => (
                                <span
                                  key={role.role}
                                  className="rounded-full bg-white dark:bg-gray-800 px-3 py-1 text-sm font-semibold text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-700"
                                >
                                  {formatRole(role.role)}: {role.count}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 dark:text-gray-500">No active employees.</p>
                          )}
                        </div>

                        <div className="rounded-xl bg-gray-50 dark:bg-gray-900/40 p-4">
                          <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide mb-3">Top 5 Items</p>
                          {r.topItems?.length ? (
                            <div className="space-y-2">
                              {r.topItems.map((item, itemIdx) => (
                                <div key={item._id || `${r._id}-${itemIdx}`} className="flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">
                                      {itemIdx + 1}. {item.name}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">{fmt(item.revenue || 0)}</p>
                                  </div>
                                  <span className="shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                                    {item.totalSold || 0} sold
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400 dark:text-gray-500">No paid item sales yet.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
