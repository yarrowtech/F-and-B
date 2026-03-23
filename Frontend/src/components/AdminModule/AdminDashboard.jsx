import React, { useEffect, useMemo, useState } from "react";
import { FaShoppingBasket, FaRupeeSign } from "react-icons/fa";

import {
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from "recharts";

import {
  getAdminSummary,
  getMonthlyChart,
  getTopItems
} from "../../services/adminDashboard.service";

/* ================= HELPERS ================= */
const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

/* ================= GRAPH BLOCK ================= */
const GraphBlock = ({ title, children }) => (
  <div className="bg-white/20 backdrop-blur-md rounded-2xl shadow p-5">
    <h3 className="mb-4 font-semibold">{title}</h3>
    <ResponsiveContainer width="100%" height={300}>
      {children}
    </ResponsiveContainer>
  </div>
);

/* ================= MAIN COMPONENT ================= */
const AdminDashboard = () => {
  const user = JSON.parse(localStorage.getItem("user"));

  const [summary, setSummary] = useState({});
  const [monthlyData, setMonthlyData] = useState([]);
  const [topItems, setTopItems] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ================= FILTER STATE ================= */
  const [restaurantId, setRestaurantId] = useState(user?.restaurant || "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  /* ================= FETCH ================= */
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {
        restaurantId,
        startDate,
        endDate,
      };

      const [s, m, t] = await Promise.all([
        getAdminSummary(params),
        getMonthlyChart(params),
        getTopItems(params),
      ]);

      setSummary(s.data.data || {});
      setMonthlyData(m.data.data || []);
      setTopItems(t.data.data || []);

    } catch (err) {
      console.error("Dashboard Error:", err);
      setError(err.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [restaurantId, startDate, endDate]);

  /* ================= KPI ================= */
  const KPIs = useMemo(() => [
    {
      title: "Total Orders",
      value: summary.totalOrders || 0,
      Icon: FaShoppingBasket
    },
    {
      title: "Total Revenue",
      value: summary.totalRevenue || 0,
      Icon: FaRupeeSign
    },
    {
      title: "Restaurants",
      value: summary.totalRestaurants || 0,
      Icon: FaShoppingBasket
    },
  ], [summary]);

  /* ================= LOADING ================= */
  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  /* ================= ERROR ================= */
  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  /* ================= UI ================= */
  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {/* ================= FILTERS ================= */}
      <div className="flex flex-wrap gap-4 items-center bg-white/20 p-4 rounded-xl">
        
        {/* Date Filters */}
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="p-2 rounded border"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="p-2 rounded border"
        />

        <button
          onClick={fetchDashboard}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Apply
        </button>

        <button
          onClick={() => {
            setStartDate("");
            setEndDate("");
          }}
          className="px-4 py-2 bg-gray-400 text-white rounded"
        >
          Reset
        </button>
      </div>

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {KPIs.map(({ title, value, Icon }, i) => (
          <div key={i} className="bg-white/20 p-4 rounded-xl flex gap-3">
            <Icon size={20} />
            <div>
              <p className="text-sm">{title}</p>
              <h2 className="text-lg font-semibold">
                {title.includes("Revenue")
                  ? formatCurrency(value)
                  : value}
              </h2>
            </div>
          </div>
        ))}
      </div>

      {/* ================= TOP ITEMS ================= */}
      <GraphBlock title="Top Selling Items">
        {topItems.length === 0 ? (
          <p className="text-center text-gray-500">No data available</p>
        ) : (
          <BarChart data={topItems}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="_id" />
            <YAxis />
            <Tooltip formatter={(v) => `${v} units`} />
            <Bar dataKey="totalSold" fill="#10B981" />
          </BarChart>
        )}
      </GraphBlock>

      {/* ================= MONTHLY REVENUE ================= */}
      <GraphBlock title="Monthly Revenue">
        {monthlyData.length === 0 ? (
          <p className="text-center text-gray-500">No data available</p>
        ) : (
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(v) => formatCurrency(v)} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#4F46E5"
              strokeWidth={3}
            />
          </LineChart>
        )}
      </GraphBlock>

    </div>
  );
};

export default AdminDashboard;