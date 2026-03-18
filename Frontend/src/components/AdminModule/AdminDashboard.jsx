import React, { useEffect, useMemo, useState } from "react";
import {
  FaShoppingBasket,
  FaRupeeSign,
  FaBuilding,
} from "react-icons/fa";

import {
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from "recharts";

import axios from "axios";
// import { io } from "socket.io-client"; ❌ disabled for now

/* ================= CONFIG ================= */
const BASE = "http://localhost:5000/api/admin-dashboard";

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
const Dashboard = () => {
  const token = localStorage.getItem("token");

  const [summary, setSummary] = useState({});
  const [monthlyData, setMonthlyData] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH ================= */
  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [summaryRes, monthlyRes, topRes] = await Promise.all([
        axios.get(`${BASE}/dashboard`, { headers }),
        axios.get(`${BASE}/dashboard/monthly`, { headers }),
        axios.get(`${BASE}/dashboard/top-items`, { headers }),
      ]);

      console.log("Dashboard Data:", {
        summary: summaryRes.data,
        monthly: monthlyRes.data,
        top: topRes.data,
      });

      setSummary(summaryRes.data || {});
      setMonthlyData(monthlyRes.data?.data || []);
      setTopItems(topRes.data?.data || []);

    } catch (err) {
      console.error("Dashboard Error:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ================= LOAD ================= */
  useEffect(() => {
    fetchDashboard();

    // ✅ Enable later when socket works
    /*
    const socket = io("http://localhost:5000", {
      auth: { token }
    });

    socket.on("dashboardUpdate", fetchDashboard);

    return () => socket.disconnect();
    */

  }, [token]);

  /* ================= KPI ================= */
  const KPIs = useMemo(() => [
    {
      title: "Orders Today",
      value: summary.todayOrders || 0,
      Icon: FaShoppingBasket
    },
    {
      title: "Daily Revenue",
      value: summary.todayRevenue || 0,
      Icon: FaRupeeSign
    },
    {
      title: "Monthly Revenue",
      value: summary.monthlyRevenue || 0,
      Icon: FaRupeeSign
    },
    {
      title: "Top Items",
      value: topItems.length,
      Icon: FaBuilding
    },
  ], [summary, topItems]);

  /* ================= LOADING ================= */
  if (loading) {
    return <div className="p-10 text-center">Loading dashboard...</div>;
  }

  /* ================= UI ================= */
  return (
    <div className="p-6 space-y-6">

      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

      {/* TOP ITEMS */}
      <GraphBlock title="Top Selling Items">
        <BarChart data={topItems}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="quantity" fill="#10B981" />
        </BarChart>
      </GraphBlock>

      {/* MONTHLY REVENUE */}
      <GraphBlock title="Monthly Revenue">
        <LineChart data={monthlyData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(v) => formatCurrency(v)} />
          <Line
            type="monotone"
            dataKey="totalRevenue"
            stroke="#4F46E5"
          />
        </LineChart>
      </GraphBlock>

    </div>
  );
};

export default Dashboard;