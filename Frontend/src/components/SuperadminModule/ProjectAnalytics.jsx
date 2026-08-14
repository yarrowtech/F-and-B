import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  CalendarRange,
  Clock3,
  Download,
  LayoutTemplate,
  LogIn,
  LogOut,
  MonitorSmartphone,
  Store,
  UsersRound,
} from "lucide-react";
import API from "../../services/api";

void motion;

const shellCard =
  "rounded-xl border border-white/50 bg-white/80 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.45)] backdrop-blur dark:border-white/10 dark:bg-[#171c25]";

const formatDuration = (seconds = 0) => {
  const total = Math.max(0, Number(seconds) || 0);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};

const formatDateTime = (value) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
};

const SummaryCard = ({ title, value, subtext, icon: Icon, accent }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35 }}
    className={`${shellCard} overflow-hidden`}
  >
    <div className="flex items-start justify-between gap-4 bg-gradient-to-br from-white/60 via-white/95 to-white/70 p-5 dark:from-white/5 dark:via-white/[0.07] dark:to-white/[0.03]">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className="mt-3 text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          {value}
        </p>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{subtext}</p>
      </div>
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${accent}`}>
        {React.createElement(Icon, { size: 22 })}
      </div>
    </div>
  </motion.div>
);

const BreakdownList = ({ title, items, emptyLabel }) => (
  <div className={`${shellCard} p-5`}>
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
        Breakdown
      </span>
    </div>

    <div className="mt-5 space-y-3">
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{emptyLabel}</p>
      ) : (
        items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between rounded-lg border border-gray-100 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]"
          >
            <span className="text-sm font-medium capitalize text-gray-700 dark:text-gray-200">
              {item.label}
            </span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.count}</span>
          </div>
        ))
      )}
    </div>
  </div>
);

const RecentAuthList = ({ items }) => (
  <div className={`${shellCard} p-5`}>
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Login / Logout</h3>
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
        Auth log
      </span>
    </div>

    <div className="mt-5 space-y-3">
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No auth activity yet.</p>
      ) : (
        items.map((item, index) => (
          <div
            key={`${item.sessionId}-${item.eventType}-${item.occurredAt}-${index}`}
            className="rounded-lg border border-gray-100 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {item.eventType === "LOGIN" ? "Login" : "Logout"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDateTime(item.occurredAt)}
              </p>
            </div>
            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
              {item.displayName || "Unknown"} ({item.displayId || "N/A"})
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {item.roleLabel || item.role || "Guest"}
              {item.restaurantName ? ` • ${item.restaurantName}` : ""}
            </p>
          </div>
        ))
      )}
    </div>
  </div>
);

const UserActivityTable = ({ title, items, emptyLabel }) => (
  <div className={`${shellCard} p-5`}>
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
        User wise
      </span>
    </div>

    {items.length === 0 ? (
      <p className="mt-5 text-sm text-gray-500 dark:text-gray-400">{emptyLabel}</p>
    ) : (
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-left dark:divide-white/10">
          <thead>
            <tr className="text-xs uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
              <th className="px-3 py-3 font-semibold">User</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-3 py-3 font-semibold">Logins</th>
              <th className="px-3 py-3 font-semibold">Logouts</th>
              <th className="px-3 py-3 font-semibold">Last Login</th>
              <th className="px-3 py-3 font-semibold">Last Logout</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/10">
            {items.map((item) => (
              <tr key={`${item.userType}-${item.userId || item.displayId}`}>
                <td className="px-3 py-3 align-top">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {item.displayName || "Unknown"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {item.displayId || "N/A"} • {item.roleLabel || item.role}
                  </p>
                  {item.restaurantName ? (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {item.restaurantName}
                    </p>
                  ) : null}
                </td>
                <td className="px-3 py-3 align-top">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      item.currentlyLoggedIn
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200"
                    }`}
                  >
                    {item.currentlyLoggedIn ? "Logged in now" : "Logged out"}
                  </span>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {item.sessionCount} sessions • {item.totalPageViews} views
                  </p>
                </td>
                <td className="px-3 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                  {item.loginCount || 0}
                </td>
                <td className="px-3 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                  {item.logoutCount || 0}
                </td>
                <td className="px-3 py-3 text-xs text-gray-500 dark:text-gray-400">
                  {formatDateTime(item.lastLoginAt)}
                </td>
                <td className="px-3 py-3 text-xs text-gray-500 dark:text-gray-400">
                  {formatDateTime(item.lastLogoutAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

const AdminRestaurantEmployees = ({ items }) => (
  <div className={`${shellCard} p-5`}>
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Admin Restaurants & Employees
      </h3>
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
        Restaurant wise
      </span>
    </div>

    <div className="mt-5 space-y-4">
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No admin restaurant employee data yet.
        </p>
      ) : (
        items.map((admin) => (
          <div
            key={admin.adminObjectId || admin.adminId}
            className="rounded-xl border border-gray-100 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.03]"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {admin.adminName}
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {admin.adminId} • {admin.restaurantCount} restaurants • {admin.employeeCount} employees
                </p>
              </div>
              <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                Admin wise
              </span>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              {admin.restaurants.map((restaurant) => (
                <div
                  key={restaurant.restaurantObjectId || restaurant.restaurantId}
                  className="rounded-lg border border-gray-100 bg-white/90 p-4 dark:border-white/10 dark:bg-white/[0.02]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {restaurant.restaurantName}
                      </p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {restaurant.restaurantId} • {restaurant.employeeCount} employees
                      </p>
                    </div>
                    <Store size={16} className="text-gray-400 dark:text-gray-500" />
                  </div>

                  <div className="mt-4 space-y-2">
                    {restaurant.employees.length === 0 ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        No employees assigned.
                      </p>
                    ) : (
                      restaurant.employees.map((employee) => (
                        <div
                          key={employee.employeeObjectId || employee.employeeId}
                          className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                              {employee.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {employee.employeeId} • {employee.roleLabel}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              employee.isActive
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                                : "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200"
                            }`}
                          >
                            {employee.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

const ProjectAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [days, setDays] = useState(7);
  const [rangeMode, setRangeMode] = useState("preset");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const buildQuery = () => {
    const params = new URLSearchParams();

    if (rangeMode === "custom" && startDate && endDate) {
      params.set("startDate", startDate);
      params.set("endDate", endDate);
    } else {
      params.set("days", String(days));
    }

    return params.toString();
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/project-analytics/summary?${buildQuery()}`);
        setAnalytics(res.data?.data || null);
      } catch (error) {
        console.error("Failed to load project analytics", error);
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [days, rangeMode, startDate, endDate]);

  const cards = useMemo(() => {
    const totals = analytics?.totals || {};
    const liveStatus = analytics?.liveStatus || {};

    return [
      {
        title: "Total Sessions",
        value: totals.totalSessions || 0,
        subtext: "Tracked visits across the full project",
        icon: UsersRound,
        accent:
          "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
      },
      {
        title: "Page Views",
        value: totals.totalPageViews || 0,
        subtext: "All tracked page visits in the selected range",
        icon: LayoutTemplate,
        accent: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
      },
      {
        title: "Home Page Visits",
        value: totals.homePageVisits || 0,
        subtext: "Visits recorded on the public home page",
        icon: MonitorSmartphone,
        accent:
          "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
      },
      {
        title: "Avg Session Duration",
        value: formatDuration(totals.avgDurationSeconds || 0),
        subtext: "Average active session time",
        icon: Clock3,
        accent: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
      },
      {
        title: "Logged In Now",
        value: liveStatus.totalLoggedInNow || 0,
        subtext: "Current users still active in this range",
        icon: LogIn,
        accent:
          "bg-lime-50 text-lime-700 dark:bg-lime-500/10 dark:text-lime-300",
      },
      {
        title: "Logged Out",
        value: liveStatus.totalLoggedOut || 0,
        subtext: "Users whose tracked sessions are closed",
        icon: LogOut,
        accent:
          "bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300",
      },
    ];
  }, [analytics]);

  const trend = analytics?.recentTrend || [];
  const maxTrend = Math.max(1, ...trend.map((item) => item.pageViews || 0));

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const res = await API.get(`/project-analytics/export?${buildQuery()}`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/vnd.ms-excel" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateLabel = new Date().toISOString().slice(0, 10);
      const rangeLabel =
        rangeMode === "custom" && startDate && endDate
          ? `${startDate}-to-${endDate}`
          : `${days}d`;

      link.href = url;
      link.download = `project-analytics-${rangeLabel}-${dateLabel}.xls`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download project analytics", error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className={`${shellCard} overflow-hidden`}>
        <div className="grid gap-6 bg-gradient-to-br from-emerald-100 via-sky-50 to-indigo-100 px-5 py-6 lg:grid-cols-[1.25fr_0.75fr] lg:px-6 dark:from-[#1a2230] dark:via-[#182129] dark:to-[#1d1d2b]">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
              Full Project Analytics
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              Sessions, devices, page traffic, and user activity across EFNBMMS
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300">
              This view aggregates full-project analytics for super admin, including admin-wise,
              vendor-wise, and restaurant-wise employee visibility with Excel export.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-xl bg-white/60 p-5 shadow-sm dark:bg-white/[0.04]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
              Range
            </p>
            <div className="flex gap-2">
              {[7, 14, 30].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setRangeMode("preset");
                    setDays(value);
                  }}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                    rangeMode === "preset" && days === value
                      ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                      : "bg-white text-gray-700 hover:bg-gray-100 dark:bg-white/[0.06] dark:text-gray-200 dark:hover:bg-white/[0.12]"
                  }`}
                >
                  Last {value} days
                </button>
              ))}
            </div>
            <div className="rounded-lg border border-gray-200 bg-white/80 p-3 dark:border-white/10 dark:bg-white/[0.03]">
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                <CalendarRange size={14} />
                Custom date range
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">From</span>
                  <input
                    type="date"
                    max={endDate || undefined}
                    value={startDate}
                    onChange={(event) => {
                      setRangeMode("custom");
                      setStartDate(event.target.value);
                    }}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-gray-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:focus:border-white"
                  />
                </label>
                <label className="grid gap-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">To</span>
                  <input
                    type="date"
                    min={startDate || undefined}
                    value={endDate}
                    onChange={(event) => {
                      setRangeMode("custom");
                      setEndDate(event.target.value);
                    }}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-gray-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:focus:border-white"
                  />
                </label>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (startDate && endDate) {
                      setRangeMode("custom");
                    }
                  }}
                  disabled={!startDate || !endDate}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Apply range
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRangeMode("preset");
                    setStartDate("");
                    setEndDate("");
                    setDays(7);
                  }}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08]"
                >
                  Reset
                </button>
              </div>
            </div>
            <div className="rounded-lg bg-gradient-to-r from-indigo-500 to-sky-500 px-4 py-3 text-white">
              <p className="text-xs uppercase tracking-[0.18em] text-white/80">Live status</p>
              <p className="mt-2 text-lg font-semibold">
                {analytics?.liveStatus?.totalLoggedInNow || 0} online / {analytics?.liveStatus?.totalLoggedOut || 0} offline
              </p>
              <p className="mt-2 text-sm text-white/80">
                {analytics?.totals?.totalLogins || 0} logins / {analytics?.totals?.totalLogouts || 0} logouts
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading || loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              <Download size={16} />
              {downloading ? "Downloading..." : "Download Excel"}
            </button>
          </div>
        </div>
      </section>

      {loading ? (
        <div className={`${shellCard} p-5`}>
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading project analytics...</p>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            {cards.map((card) => (
              <SummaryCard key={card.title} {...card} />
            ))}
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr_0.8fr]">
            <div className={`${shellCard} p-5`}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Pages</h3>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                  Page Views
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {(analytics?.topPages || []).length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No page view data yet.</p>
                ) : (
                  analytics.topPages.map((page) => (
                    <div
                      key={page.path}
                      className="rounded-lg border border-gray-100 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                          {page.path}
                        </p>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                          {page.views}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {page.uniqueSessions} unique sessions
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <BreakdownList
              title="Devices"
              items={analytics?.breakdowns?.devices || []}
              emptyLabel="No device data yet."
            />

            <BreakdownList
              title="Browsers"
              items={analytics?.breakdowns?.browsers || []}
              emptyLabel="No browser data yet."
            />
          </section>

          <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <BreakdownList
              title="Role Mix"
              items={analytics?.breakdowns?.roles || []}
              emptyLabel="No role usage data yet."
            />

            <div className={`${shellCard} p-5`}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Traffic Trend</h3>
                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                  <MonitorSmartphone size={14} />
                  Daily page views
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {trend.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No recent trend data yet.</p>
                ) : (
                  trend.map((item) => (
                    <div key={item.date} className="rounded-lg border border-gray-100 bg-white/70 p-4 dark:border-white/10 dark:bg-white/[0.03]">
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                            {item.date}
                          </p>
                          <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                            {item.pageViews}
                          </p>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {item.sessions} sessions
                          </p>
                        </div>
                        <div className="flex h-24 w-8 items-end rounded-full bg-slate-100 p-1 dark:bg-slate-800">
                          <div
                            className="w-full rounded-full bg-gradient-to-t from-emerald-500 to-sky-500"
                            style={{ height: `${Math.max(10, Math.round((item.pageViews / maxTrend) * 100))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[0.8fr_0.8fr_0.8fr_1.2fr]">
            <div className={`${shellCard} p-5`}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Admin Usage</h3>
              <div className="mt-5 space-y-3">
                <div className="rounded-lg border border-gray-100 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">Sessions</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                    {analytics?.roleTotals?.admin?.sessions || 0}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">Avg Duration</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                    {formatDuration(analytics?.roleTotals?.admin?.avgDurationSeconds || 0)}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">Logged In Now</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                    {analytics?.liveStatus?.adminLoggedInNow || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className={`${shellCard} p-5`}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Vendor Usage</h3>
              <div className="mt-5 space-y-3">
                <div className="rounded-lg border border-gray-100 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">Sessions</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                    {analytics?.roleTotals?.vendor?.sessions || 0}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">Avg Duration</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                    {formatDuration(analytics?.roleTotals?.vendor?.avgDurationSeconds || 0)}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">Logged In Now</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                    {analytics?.liveStatus?.vendorLoggedInNow || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className={`${shellCard} p-5`}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Employee Usage</h3>
              <div className="mt-5 space-y-3">
                <div className="rounded-lg border border-gray-100 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">Sessions</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                    {analytics?.roleTotals?.employee?.sessions || 0}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">Avg Duration</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                    {formatDuration(analytics?.roleTotals?.employee?.avgDurationSeconds || 0)}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-100 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">Logged In Now</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
                    {analytics?.liveStatus?.employeeLoggedInNow || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className={`${shellCard} p-5`}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Features Used</h3>
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                  Feature usage
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {(analytics?.topFeatures || []).length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No feature usage data yet.</p>
                ) : (
                  analytics.topFeatures.map((feature) => (
                    <div
                      key={feature.featureKey}
                      className="rounded-lg border border-gray-100 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {feature.featureLabel}
                        </p>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                          {feature.count}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Roles: {(feature.roles || []).join(", ") || "N/A"}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-2">
            <UserActivityTable
              title="Admin Wise Activity"
              items={analytics?.adminUsers || []}
              emptyLabel="No admin activity data yet."
            />
            <UserActivityTable
              title="Vendor Wise Activity"
              items={analytics?.vendorUsers || []}
              emptyLabel="No vendor activity data yet."
            />
          </section>

          <AdminRestaurantEmployees items={analytics?.adminRestaurantEmployees || []} />

          <section className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <UserActivityTable
              title="Employee Wise Activity"
              items={analytics?.employeeUsers || []}
              emptyLabel="No employee activity data yet."
            />
            <RecentAuthList items={analytics?.recentAuthEvents || []} />
          </section>
        </>
      )}
    </div>
  );
};

export default ProjectAnalytics;
