
import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart, Line, CartesianGrid
} from "recharts";
import {
  FaUsers, FaBoxes, FaTruck, FaUtensils,
  FaChartLine, FaEnvelope, FaBell
} from "react-icons/fa";
import axios from "axios";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const ManagerDashboard = () => {
  const token = localStorage.getItem("token");

  const [todayData, setTodayData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH DATA ================= */
  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const todayRes = await axios.get(
        "http://localhost:5000/api/dashboard/today",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const monthlyRes = await axios.get(
        "http://localhost:5000/api/dashboard/monthly",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const topRes = await axios.get(
        "http://localhost:5000/api/dashboard/top-items?type=today",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTodayData(todayRes.data.data);
      setMonthlyData(monthlyRes.data.data);
      setTopItems(topRes.data.data);

    } catch (err) {
      console.error("Manager Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    socket.on("dashboardUpdate", () => {
      fetchDashboard();
    });

    return () => socket.off("dashboardUpdate");
  }, []);

  /* ================= KPI CALCULATIONS ================= */
  const totalOrders = todayData.reduce(
    (sum, r) => sum + r.totalOrders,
    0
  );

  const dailyRevenue = todayData.reduce(
    (sum, r) => sum + r.totalRevenue,
    0
  );

  const monthlyRevenue = monthlyData.reduce(
    (sum, r) => sum + r.totalRevenue,
    0
  );

  const stats = useMemo(() => [
    { title: "Orders Today", icon: <FaUsers />, value: totalOrders, color: "bg-blue-500" },
    { title: "Top Items", icon: <FaUtensils />, value: topItems.length, color: "bg-purple-600" },
    { title: "Monthly Revenue", icon: <FaChartLine />, value: formatCurrency(monthlyRevenue), color: "bg-yellow-500" },
    { title: "Daily Revenue", icon: <FaChartLine />, value: formatCurrency(dailyRevenue), color: "bg-green-600" },
  ], [totalOrders, monthlyRevenue, dailyRevenue, topItems]);

  if (loading) {
    return <div className="p-10 text-center">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-12">
      <h2 className="text-2xl font-bold">Manager Dashboard Overview</h2>

      {/* KPI CARDS */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-neutral-800 shadow rounded-xl p-4 flex items-center justify-between"
          >
            <div className={`p-3 rounded-full text-white text-xl ${stat.color}`}>
              {stat.icon}
            </div>
            <div className="text-right">
              <h4 className="text-sm text-gray-500">{stat.title}</h4>
              <p className="text-xl font-semibold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* TOP SELLING ITEMS */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Top-Selling Items</h3>
        <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topItems}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="quantity" fill="#fbbf24" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* MONTHLY REVENUE TREND */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Monthly Revenue Trend</h3>
        <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Line type="monotone" dataKey="totalRevenue" stroke="#60a5fa" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
