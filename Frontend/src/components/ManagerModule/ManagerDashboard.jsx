import React, { useEffect, useMemo, useState } from "react";
import {
  FaShoppingCart,
  FaRupeeSign,
  FaUsers,
  FaCalendarAlt,
} from "react-icons/fa";

import { getManagerDashboard } from "../../services/managerDashboard.service";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const PRESETS = [
  { label: "Today", key: "today" },
  { label: "Last 7 Days", key: "7days" },
  { label: "This Week", key: "week" },
  { label: "Last Month", key: "lastmonth" },
  { label: "All Time", key: "all" },
];

const getDateRange = (key) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (key) {
    case "today":
      return {
        startDate: today.toISOString().slice(0, 10),
        endDate: now.toISOString().slice(0, 10),
      };
    case "7days": {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return {
        startDate: start.toISOString().slice(0, 10),
        endDate: now.toISOString().slice(0, 10),
      };
    }
    case "week": {
      const start = new Date(today);
      start.setDate(start.getDate() - start.getDay());
      return {
        startDate: start.toISOString().slice(0, 10),
        endDate: now.toISOString().slice(0, 10),
      };
    }
    case "lastmonth": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return {
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
      };
    }
    default:
      return {};
  }
};

const ManagerDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activePreset, setActivePreset] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customActive, setCustomActive] = useState(false);

  const fetchDashboard = async (params = {}) => {
    try {
      setLoading(true);
      const res = await getManagerDashboard(params);
      setDashboard(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const applyPreset = (key) => {
    setActivePreset(key);
    setCustomActive(false);
    setStartDate("");
    setEndDate("");
    fetchDashboard(getDateRange(key));
  };

  const applyCustom = () => {
    if (!startDate && !endDate) return;
    setActivePreset("");
    setCustomActive(true);
    fetchDashboard({ startDate, endDate });
  };

  const resetFilters = () => {
    setActivePreset("all");
    setCustomActive(false);
    setStartDate("");
    setEndDate("");
    fetchDashboard();
  };

  const periodRows = useMemo(
    () => {
      const rows = [
        {
          label: "Today",
          orders: dashboard?.todayOrders || 0,
          revenue: dashboard?.todayRevenue || 0,
        },
        {
          label: "Last 7 Days",
          orders: dashboard?.lastWeekOrders || 0,
          revenue: dashboard?.lastWeekRevenue || 0,
        },
        {
          label: "Last 30 Days",
          orders: dashboard?.lastMonthOrders || 0,
          revenue: dashboard?.lastMonthRevenue || 0,
        },
      ];

      if (dashboard?.selectedStartDate || dashboard?.selectedEndDate) {
        rows.unshift({
          label: "Selected Range",
          orders: dashboard?.selectedOrders || 0,
          revenue: dashboard?.selectedRevenue || 0,
        });
      }

      return rows;
    },
    [dashboard]
  );

  const stats = useMemo(
    () => [
      {
        title:
          dashboard?.selectedStartDate || dashboard?.selectedEndDate
            ? "Selected Orders"
            : "Today Orders",
        icon: <FaShoppingCart />,
        value:
          dashboard?.selectedStartDate || dashboard?.selectedEndDate
            ? dashboard?.selectedOrders || 0
            : dashboard?.todayOrders || 0,
        color: "from-blue-500 to-cyan-500",
      },
      {
        title:
          dashboard?.selectedStartDate || dashboard?.selectedEndDate
            ? "Selected Revenue"
            : "Today Revenue",
        icon: <FaRupeeSign />,
        value: formatCurrency(
          dashboard?.selectedStartDate || dashboard?.selectedEndDate
            ? dashboard?.selectedRevenue
            : dashboard?.todayRevenue
        ),
        color: "from-emerald-500 to-teal-500",
      },
      {
        title: "Last 30 Days Orders",
        icon: <FaCalendarAlt />,
        value: dashboard?.lastMonthOrders || 0,
        color: "from-indigo-500 to-violet-500",
      },
      {
        title: "Today's Attendance",
        icon: <FaUsers />,
        value: `${dashboard?.todayPresentStaff || 0}/${dashboard?.totalStaff || 0}`,
        color: "from-amber-400 to-orange-500",
      },
    ],
    [dashboard]
  );

  if (loading) {
    return <div className="p-10 text-center text-lg">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-6 space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
          Manager Dashboard
        </h2>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Restaurant orders, paid revenue, and today&apos;s attendance
        </p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-md dark:border-neutral-700 dark:bg-neutral-800">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(({ label, key }) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                activePreset === key && !customActive
                  ? "bg-emerald-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              From
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              To
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
            />
          </div>
          <button
            onClick={applyCustom}
            disabled={!startDate && !endDate}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40"
          >
            Apply
          </button>
          <button
            onClick={resetFilters}
            className="rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-200 dark:bg-neutral-700 dark:text-gray-300 dark:hover:bg-neutral-600"
          >
            Reset
          </button>
        </div>

        {customActive && (dashboard?.selectedStartDate || dashboard?.selectedEndDate) ? (
          <p className="mt-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Showing: {dashboard?.selectedStartDate || "Beginning"} to{" "}
            {dashboard?.selectedEndDate || "Today"}
          </p>
        ) : null}
      </div>

      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-md dark:bg-neutral-800"
          >
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-black/5 dark:bg-white/5" />
            <div className="relative flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {stat.title}
                </p>
                <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
              <div className={`rounded-2xl bg-gradient-to-br ${stat.color} p-4 text-xl text-white shadow-lg`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="rounded-2xl border border-gray-100 bg-white shadow-md dark:border-neutral-700 dark:bg-neutral-800">
          <div className="border-b border-gray-100 px-6 py-5 dark:border-neutral-700">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
              Date-wise Orders and Revenue
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Revenue is based on paid bills of the assigned restaurant.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-neutral-900/60">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-300">
                    Period
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-500 dark:text-gray-300">
                    Orders
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-500 dark:text-gray-300">
                    Revenue
                  </th>
                </tr>
              </thead>
              <tbody>
                {periodRows.map((row) => (
                  <tr
                    key={row.label}
                    className="border-t border-gray-100 dark:border-neutral-700"
                  >
                    <td className="px-6 py-4 font-semibold text-gray-800 dark:text-white">
                      {row.label}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-700 dark:text-gray-200">
                      {row.orders}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(row.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-md dark:border-neutral-700 dark:bg-neutral-800">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
            Today's Attendance
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Only today&apos;s present employees are shown here.
          </p>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl bg-gray-50 p-4 dark:bg-neutral-700/40">
              <p className="text-sm text-gray-500 dark:text-gray-300">Total Staff</p>
              <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {dashboard?.totalStaff || 0}
              </p>
            </div>
            <div className="rounded-2xl bg-green-50 p-4 dark:bg-green-900/20">
              <p className="text-sm text-gray-500 dark:text-gray-300">Present Today</p>
              <p className="mt-2 text-3xl font-bold text-green-700 dark:text-green-400">
                {dashboard?.todayPresentStaff || 0}
              </p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-4 dark:bg-blue-900/20">
              <p className="text-sm text-gray-500 dark:text-gray-300">Attendance Rate</p>
              <p className="mt-2 text-3xl font-bold text-blue-700 dark:text-blue-400">
                {dashboard?.attendanceRate || 0}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
