import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CircleDollarSign,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  getAdminSummary,
  getDailySales,
  getMonthlyChart,
  getRestaurantBreakdown,
  getTopItems,
} from "../../services/adminDashboard.service";
import { getAdminReportRestaurants } from "../../services/adminReports.service";

const COLORS = ["#059669", "#2563eb", "#f59e0b", "#e11d48", "#7c3aed", "#0891b2"];

const PRESETS = [
  { label: "All Time", key: "all" },
  { label: "Today", key: "today" },
  { label: "Last 7 Days", key: "7days" },
  { label: "This Month", key: "month" },
  { label: "Last Month", key: "lastmonth" },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatNumber = (value) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(value || 0));

const formatRole = (role = "") =>
  String(role || "Staff")
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const toDateInput = (date) => date.toISOString().slice(0, 10);

const getDateRange = (key) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (key) {
    case "today":
      return { startDate: toDateInput(today), endDate: toDateInput(today) };
    case "7days": {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { startDate: toDateInput(start), endDate: toDateInput(today) };
    }
    case "month": {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: toDateInput(start), endDate: toDateInput(today) };
    }
    case "lastmonth": {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      return { startDate: toDateInput(start), endDate: toDateInput(end) };
    }
    default:
      return { startDate: "", endDate: "" };
  }
};

const getResponseData = (response, fallback) => response?.data?.data ?? response?.data ?? fallback;

const EmptyState = ({ label = "No data for this selection." }) => (
  <div className="flex h-full min-h-[220px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 text-center text-sm font-semibold text-slate-400 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-500">
    {label}
  </div>
);

const MetricCard = ({ label, value, helper, tone = "emerald" }) => {
  const tones = {
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300",
    blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300",
    amber: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300",
    rose: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300",
  };

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${tones[tone]}`}>
      <p className="text-xs font-bold uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-3 text-2xl font-black text-slate-950 dark:text-white">{value}</p>
      {helper && <p className="mt-1 text-xs font-semibold opacity-75">{helper}</p>}
    </div>
  );
};

const ChartCard = ({ title, subtitle, children, fullWidth = false, data = [] }) => (
  <section
    className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 ${
      fullWidth ? "xl:col-span-2" : ""
    }`}
  >
    <div className="mb-4">
      <h3 className="text-base font-bold text-slate-950 dark:text-white">{title}</h3>
      {subtitle && <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">{subtitle}</p>}
    </div>
    {data.length === 0 ? (
      <EmptyState />
    ) : (
      <div className="h-[290px] sm:h-[330px]">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    )}
  </section>
);

export default function AdminAnalytics() {
  const [summary, setSummary] = useState({});
  const [monthlyData, setMonthlyData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [preset, setPreset] = useState("month");
  const [restaurantId, setRestaurantId] = useState("");
  const [startDate, setStartDate] = useState(getDateRange("month").startDate);
  const [endDate, setEndDate] = useState(getDateRange("month").endDate);

  const loadRestaurants = useCallback(async () => {
    try {
      const data = await getAdminReportRestaurants();
      setRestaurants(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("FETCH RESTAURANTS ERROR:", err);
      setRestaurants([]);
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = {
        restaurantId: restaurantId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };

      const [summaryRes, monthlyRes, dailyRes, topItemsRes, breakdownRes] = await Promise.all([
        getAdminSummary(params),
        getMonthlyChart(params),
        getDailySales(params),
        getTopItems(params),
        getRestaurantBreakdown(params),
      ]);

      setSummary(getResponseData(summaryRes, {}));
      setMonthlyData(Array.isArray(getResponseData(monthlyRes, [])) ? getResponseData(monthlyRes, []) : []);
      setDailyData(Array.isArray(getResponseData(dailyRes, [])) ? getResponseData(dailyRes, []) : []);
      setTopItems(Array.isArray(getResponseData(topItemsRes, [])) ? getResponseData(topItemsRes, []) : []);
      setBreakdown(Array.isArray(getResponseData(breakdownRes, [])) ? getResponseData(breakdownRes, []) : []);
    } catch (err) {
      console.error("FETCH ANALYTICS ERROR:", err);
      setError(err.response?.data?.message || err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [endDate, restaurantId, startDate]);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const applyPreset = (key) => {
    const range = getDateRange(key);
    setPreset(key);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
  };

  const applyCustomRange = () => {
    setPreset("custom");
    loadAnalytics();
  };

  const selectedRestaurantName =
    restaurants.find((restaurant) => restaurant._id === restaurantId)?.name || "All Restaurants";

  const averageBill = summary.totalOrders
    ? Number(summary.totalRevenue || 0) / Number(summary.totalOrders || 1)
    : 0;

  const restaurantChartData = useMemo(
    () =>
      breakdown
        .map((item) => ({
          name: item.name || "Restaurant",
          revenue: Number(item.totalRevenue || 0),
          orders: Number(item.totalOrders || 0),
          employees: Number(item.totalEmployees || 0),
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8),
    [breakdown]
  );

  const roleData = useMemo(() => {
    const roles = new Map();
    breakdown.forEach((restaurant) => {
      (restaurant.employeeRoles || []).forEach((entry) => {
        const key = formatRole(entry.role);
        roles.set(key, (roles.get(key) || 0) + Number(entry.count || 0));
      });
    });
    return Array.from(roles, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [breakdown]);

  const topItemsChartData = topItems.map((item) => ({
    name: item.name || "Item",
    sold: Number(item.totalSold || 0),
    revenue: Number(item.revenue || 0),
  }));

  const vendorChartData = useMemo(
    () =>
      breakdown
        .map((item) => ({
          name: item.name || "Restaurant",
          spend: Number(item.vendorSpend || 0),
          outstanding: Number(item.vendorOutstanding || 0),
          vendorOrders: Number(item.vendorOrders || 0),
          activeVendors: Number(item.activeVendorCount || 0),
        }))
        .filter(
          (item) =>
            item.spend > 0 ||
            item.outstanding > 0 ||
            item.vendorOrders > 0 ||
            item.activeVendors > 0
        )
        .sort((a, b) => b.spend - a.spend)
        .slice(0, 8),
    [breakdown]
  );

  const topVendorsData = useMemo(() => {
    const vendors = new Map();
    breakdown.forEach((restaurant) => {
      (restaurant.topVendors || []).forEach((vendor) => {
        const key = String(vendor._id || vendor.vendorCode || vendor.name);
        const current = vendors.get(key) || {
          name: vendor.name || "Vendor",
          vendorCode: vendor.vendorCode || "-",
          spend: 0,
          orders: 0,
          outstanding: 0,
          restaurants: 0,
        };
        current.spend += Number(vendor.spend || 0);
        current.orders += Number(vendor.orders || 0);
        current.outstanding += Number(vendor.outstanding || 0);
        current.restaurants += 1;
        vendors.set(key, current);
      });
    });
    return Array.from(vendors.values())
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 6);
  }, [breakdown]);

  const hasAnyData =
    Number(summary.totalOrders || 0) > 0 ||
    Number(summary.totalRevenue || 0) > 0 ||
    monthlyData.length > 0 ||
    dailyData.length > 0 ||
    topItems.length > 0 ||
    Number(summary.totalVendorSpend || 0) > 0 ||
    topVendorsData.length > 0;

  return (
    <div className="min-h-screen bg-slate-50 p-3 text-slate-950 dark:bg-slate-950 dark:text-white sm:p-5">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              Admin Analytics
            </p>
            <h1 className="mt-1 text-2xl font-black">Analytical Page</h1>
            <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
              Live sales, orders, menu, restaurant, and staff performance for {selectedRestaurantName}.
            </p>
          </div>

          <button
            type="button"
            onClick={loadAnalytics}
            className="min-h-11 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700"
          >
            Refresh
          </button>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Restaurant
                </label>
                <select
                  value={restaurantId}
                  onChange={(e) => setRestaurantId(e.target.value)}
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950"
                >
                  <option value="">All Restaurants</option>
                  {restaurants.map((restaurant) => (
                    <option key={restaurant._id} value={restaurant._id}>
                      {restaurant.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  From
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPreset("custom");
                  }}
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  To
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPreset("custom");
                  }}
                  className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={applyCustomRange}
              className="min-h-11 rounded-xl bg-slate-950 px-5 text-sm font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950"
            >
              Run Analysis
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {PRESETS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => applyPreset(item.key)}
                className={`rounded-full px-4 py-2 text-sm font-bold ${
                  preset === item.key
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="h-32 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"
              />
            ))}
          </div>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Paid Revenue" value={formatCurrency(summary.totalRevenue)} tone="emerald" />
              <MetricCard label="Orders" value={formatNumber(summary.totalOrders)} tone="blue" />
              <MetricCard label="Average Bill" value={formatCurrency(averageBill)} helper="Revenue divided by orders" tone="amber" />
              <MetricCard label="Employees" value={formatNumber(summary.totalEmployees)} helper={`${formatNumber(summary.totalRestaurants)} restaurants`} tone="rose" />
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Vendor Spend"
                value={formatCurrency(summary.totalVendorSpend)}
                helper="Total procurement amount"
                tone="emerald"
              />
              <MetricCard
                label="Vendor Outstanding"
                value={formatCurrency(summary.pendingVendorPayables)}
                helper="Unpaid vendor purchases"
                tone="rose"
              />
              <MetricCard
                label="Active Vendors"
                value={formatNumber(summary.totalActiveVendors)}
                helper={`${formatNumber(summary.totalVendorSettlements)} settlements`}
                tone="blue"
              />
              <MetricCard
                label="Settled Vendor Amount"
                value={formatCurrency(summary.settledVendorAmount)}
                helper={`${formatNumber(summary.paidVendorSettlements)} paid settlements`}
                tone="amber"
              />
            </section>

            {!hasAnyData && <EmptyState label="No analytics data found for the selected filters." />}

            <section className="grid gap-4 xl:grid-cols-2">
              <ChartCard
                title="Monthly Revenue"
                subtitle="Paid bill revenue and order count by month"
                data={monthlyData}
              >
                <LineChart data={monthlyData} margin={{ top: 12, right: 20, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value, name) => (name === "revenue" ? formatCurrency(value) : value)} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={3} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#2563eb" strokeWidth={3} dot={false} />
                </LineChart>
              </ChartCard>

              <ChartCard title="Daily Sales" subtitle="Day-wise paid revenue" data={dailyData}>
                <BarChart data={dailyData} margin={{ top: 12, right: 20, left: 0, bottom: 28 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, angle: -25, textAnchor: "end" }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value, name) => (name === "revenue" ? formatCurrency(value) : value)} />
                  <Bar dataKey="revenue" fill="#059669" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ChartCard>

              <ChartCard title="Top Selling Items" subtitle="Most sold menu items" data={topItemsChartData}>
                <BarChart data={topItemsChartData} margin={{ top: 12, right: 20, left: 0, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, angle: -25, textAnchor: "end" }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value, name) => (name === "revenue" ? formatCurrency(value) : value)} />
                  <Legend />
                  <Bar dataKey="sold" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ChartCard>

              <ChartCard title="Employee Roles" subtitle="Active staff by role" data={roleData}>
                <PieChart>
                  <Pie data={roleData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={105} label>
                    {roleData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ChartCard>

              <ChartCard
                title="Restaurant Revenue"
                subtitle="Top restaurants by paid revenue"
                data={restaurantChartData}
                fullWidth
              >
                <BarChart data={restaurantChartData} margin={{ top: 12, right: 20, left: 0, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, angle: -20, textAnchor: "end" }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value, name) => (name === "revenue" ? formatCurrency(value) : value)} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#2563eb" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="orders" fill="#7c3aed" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ChartCard>

              <ChartCard
                title="Restaurant Wise Vendor Spend"
                subtitle="Purchase value and vendor dues by restaurant"
                data={vendorChartData}
                fullWidth
              >
                <BarChart data={vendorChartData} margin={{ top: 12, right: 20, left: 0, bottom: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, angle: -20, textAnchor: "end" }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value, name) => (name === "activeVendors" || name === "vendorOrders" ? value : formatCurrency(value))} />
                  <Legend />
                  <Bar dataKey="spend" fill="#0f766e" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="outstanding" fill="#e11d48" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ChartCard>

              <ChartCard
                title="Top Vendor Partners"
                subtitle="Highest procurement vendors across selected restaurants"
                data={topVendorsData}
                fullWidth
              >
                <ScatterChart margin={{ top: 12, right: 20, left: 0, bottom: 18 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
                  <XAxis
                    type="number"
                    dataKey="orders"
                    name="Orders"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="spend"
                    name="Spend"
                    tick={{ fontSize: 11 }}
                    tickFormatter={formatNumber}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: "3 3" }}
                    formatter={(value, name) =>
                      name === "spend" || name === "outstanding"
                        ? formatCurrency(value)
                        : formatNumber(value)
                    }
                    labelFormatter={() => ""}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const vendor = payload[0]?.payload;
                      if (!vendor) return null;
                      return (
                        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-900">
                          <p className="font-bold text-slate-900 dark:text-white">{vendor.name}</p>
                          <p className="mt-1 text-slate-500 dark:text-slate-400">{vendor.vendorCode}</p>
                          <p className="mt-2 text-slate-700 dark:text-slate-200">Spend: {formatCurrency(vendor.spend)}</p>
                          <p className="text-slate-700 dark:text-slate-200">Orders: {formatNumber(vendor.orders)}</p>
                          <p className="text-slate-700 dark:text-slate-200">
                            Outstanding: {formatCurrency(vendor.outstanding)}
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Scatter data={topVendorsData} fill="#7c3aed" />
                </ScatterChart>
              </ChartCard>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                <h3 className="text-base font-bold">Restaurant Performance</h3>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Orders, revenue, employees, and top menu items from live data.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800">
                    <tr>
                      <th className="px-4 py-3">Restaurant</th>
                      <th className="px-4 py-3">Orders</th>
                      <th className="px-4 py-3">Revenue</th>
                      <th className="px-4 py-3">Employees</th>
                      <th className="px-4 py-3">Top Items</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {breakdown.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-4 py-8 text-center font-semibold text-slate-400">
                          No restaurant data found.
                        </td>
                      </tr>
                    ) : (
                      breakdown.map((restaurant) => (
                        <tr key={restaurant._id} className="align-top">
                          <td className="px-4 py-3 font-bold">{restaurant.name}</td>
                          <td className="px-4 py-3">{formatNumber(restaurant.totalOrders)}</td>
                          <td className="px-4 py-3 font-bold text-emerald-700 dark:text-emerald-300">
                            {formatCurrency(restaurant.totalRevenue)}
                          </td>
                          <td className="px-4 py-3">{formatNumber(restaurant.totalEmployees)}</td>
                          <td className="px-4 py-3">
                            {(restaurant.topItems || []).length === 0 ? (
                              <span className="text-slate-400">-</span>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {restaurant.topItems.slice(0, 4).map((item) => (
                                  <span
                                    key={`${restaurant._id}-${item._id}`}
                                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                  >
                                    {item.name} ({formatNumber(item.totalSold)})
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                <h3 className="text-base font-bold">Vendor Analytics</h3>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Restaurant-wise vendor spend, outstanding dues, and top procurement partners.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800">
                    <tr>
                      <th className="px-4 py-3">Restaurant</th>
                      <th className="px-4 py-3">Vendor Orders</th>
                      <th className="px-4 py-3">Active Vendors</th>
                      <th className="px-4 py-3">Vendor Spend</th>
                      <th className="px-4 py-3">Outstanding</th>
                      <th className="px-4 py-3">Top Vendors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {breakdown.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center font-semibold text-slate-400">
                          No vendor analytics found.
                        </td>
                      </tr>
                    ) : (
                      breakdown.map((restaurant) => (
                        <tr key={`${restaurant._id}-vendor`} className="align-top">
                          <td className="px-4 py-3 font-bold">{restaurant.name}</td>
                          <td className="px-4 py-3">{formatNumber(restaurant.vendorOrders)}</td>
                          <td className="px-4 py-3">{formatNumber(restaurant.activeVendorCount)}</td>
                          <td className="px-4 py-3 font-bold text-emerald-700 dark:text-emerald-300">
                            {formatCurrency(restaurant.vendorSpend)}
                          </td>
                          <td className="px-4 py-3 font-bold text-rose-700 dark:text-rose-300">
                            {formatCurrency(restaurant.vendorOutstanding)}
                          </td>
                          <td className="px-4 py-3">
                            {(restaurant.topVendors || []).length === 0 ? (
                              <span className="text-slate-400">-</span>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {restaurant.topVendors.slice(0, 3).map((vendor) => (
                                  <span
                                    key={`${restaurant._id}-${vendor._id || vendor.vendorCode}`}
                                    className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
                                  >
                                    {vendor.name} ({formatCurrency(vendor.spend)})
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
