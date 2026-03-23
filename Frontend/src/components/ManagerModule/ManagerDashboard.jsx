import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, LineChart, Line, CartesianGrid
} from "recharts";
import {
  FaShoppingCart,
  FaRupeeSign,
  FaUsers,
  FaChartLine
} from "react-icons/fa";

import { getManagerDashboard } from "../../services/managerDashboard.service";

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const ManagerDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await getManagerDashboard();
      setDashboard(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  /* ================= KPI ================= */
  const stats = useMemo(() => [
    {
      title: "Today's Orders",
      icon: <FaShoppingCart />,
      value: dashboard?.todayOrders || 0,
      color: "bg-blue-500",
    },
    {
      title: "Monthly Orders",
      icon: <FaShoppingCart />,
      value: dashboard?.monthlyOrders || 0,
      color: "bg-indigo-500",
    },
    {
      title: "Today's Revenue",
      icon: <FaRupeeSign />,
      value: formatCurrency(dashboard?.todayRevenue),
      color: "bg-green-600",
    },
    {
      title: "Total Revenue",
      icon: <FaChartLine />,
      value: formatCurrency(dashboard?.totalRevenue),
      color: "bg-yellow-500",
    },
    {
      title: "Staff Present",
      icon: <FaUsers />,
      value: `${dashboard?.todayPresentStaff || 0}/${dashboard?.totalStaff || 0}`,
      color: "bg-purple-600",
    },
  ], [dashboard]);

  if (loading) {
    return <div className="p-10 text-center text-lg">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-10">
      <h2 className="text-2xl font-bold">Manager Dashboard</h2>

      {/* ================= KPI CARDS ================= */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-neutral-800 shadow-lg rounded-xl p-5 flex items-center justify-between hover:scale-105 transition"
          >
            <div className={`p-4 rounded-full text-white text-xl ${stat.color}`}>
              {stat.icon}
            </div>
            <div className="text-right">
              <h4 className="text-sm text-gray-500">{stat.title}</h4>
              <p className="text-xl font-semibold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ================= REVENUE CHART ================= */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Last 7 Days Revenue</h3>

        <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow">
          {dashboard?.last7Days?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboard.last7Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip formatter={(v) => formatCurrency(v)} />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-20 text-gray-400">
              No revenue data available
            </div>
          )}
        </div>
      </div>

      {/* ================= ORDER STATUS ================= */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Order Status</h3>

        <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow">
          {dashboard?.orderStatusStats?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboard.orderStatusStats}>
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-20 text-gray-400">
              No order data available
            </div>
          )}
        </div>
      </div>

      {/* ================= ATTENDANCE ================= */}
      <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow">
        <h3 className="text-xl font-semibold mb-2">Staff Attendance</h3>
        <p className="text-lg">
          Present: <strong>{dashboard?.todayPresentStaff || 0}</strong> / {dashboard?.totalStaff || 0}
        </p>
        <p className="text-sm text-gray-500">
          Attendance Rate: {dashboard?.attendanceRate || 0}%
        </p>
      </div>
    </div>
  );
};

export default ManagerDashboard;