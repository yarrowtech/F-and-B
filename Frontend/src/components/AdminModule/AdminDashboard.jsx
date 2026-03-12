import React, { useEffect, useMemo, useState } from "react";
import {
  FaUserFriends,
  FaBuilding,
  FaShoppingBasket,
  FaCalendarAlt,
  FaRupeeSign,
  FaBell,
} from "react-icons/fa";
import {
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from "recharts";
import axios from "axios";
import { io } from "socket.io-client";

/* ================= SOCKET ================= */
const socket = io("http://localhost:5000");

/* ================= HELPERS ================= */
const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const GraphBlock = ({ title, height = 300, children }) => (
  <div className="bg-white/20 dark:bg-white/10 backdrop-blur-md border border-white/30 dark:border-white/10 rounded-2xl shadow-lg p-5">
    <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">
      {title}
    </h3>
    <ResponsiveContainer width="100%" height={height}>
      {children}
    </ResponsiveContainer>
  </div>
);

const Dashboard = () => {
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
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= INITIAL LOAD + SOCKET ================= */
  useEffect(() => {
    fetchDashboard();

    socket.on("dashboardUpdate", () => {
      fetchDashboard();
    });

    return () => {
      socket.off("dashboardUpdate");
    };
  }, []);

  /* ================= KPI VALUES ================= */
  const totalTodayRevenue = todayData.reduce(
    (sum, r) => sum + r.totalRevenue,
    0
  );

  const totalTodayOrders = todayData.reduce(
    (sum, r) => sum + r.totalOrders,
    0
  );

  const totalMonthlyRevenue = monthlyData.reduce(
    (sum, r) => sum + r.totalRevenue,
    0
  );

  const KPIs = useMemo(
    () => [
      { title: "Orders Today", value: totalTodayOrders, Icon: FaShoppingBasket, color: "text-orange-500" },
      { title: "Daily Revenue", value: totalTodayRevenue, Icon: FaRupeeSign, color: "text-emerald-500" },
      { title: "Monthly Revenue", value: totalMonthlyRevenue, Icon: FaRupeeSign, color: "text-teal-500" },
      { title: "Top Items", value: topItems.length, Icon: FaBuilding, color: "text-blue-500" },
    ],
    [totalTodayOrders, totalTodayRevenue, totalMonthlyRevenue, topItems]
  );

  if (loading) {
    return <div className="p-10 text-center">Loading dashboard...</div>;
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {KPIs.map(({ title, value, Icon, color }, i) => (
          <div
            key={i}
            className="bg-white/20 backdrop-blur-md rounded-2xl shadow p-4 flex items-center gap-4"
          >
            <Icon size={26} className={color} />
            <div>
              <p className="text-sm text-gray-500">{title}</p>
              <h2 className="text-xl font-semibold">
                {title.includes("Revenue")
                  ? formatCurrency(value)
                  : value}
              </h2>
            </div>
          </div>
        ))}
      </div>

      {/* ================= TOP ITEMS CHART ================= */}
      <GraphBlock title="Top Selling Items Today">
        <BarChart data={topItems}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="quantity" fill="#10B981" />
        </BarChart>
      </GraphBlock>

      {/* ================= MONTHLY REVENUE CHART ================= */}
      <GraphBlock title="Monthly Revenue Overview">
        <LineChart data={monthlyData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(v) => formatCurrency(v)} />
          <Legend />
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
