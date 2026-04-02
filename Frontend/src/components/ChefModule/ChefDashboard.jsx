import React, { useEffect, useState, useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

import {
  getChefOrders,
} from "../../services/order.service";

import {
  getMonthlyStats,
  getMonthlyChart,
} from "../../services/attendance.service";

/* ================= COLORS ================= */
const ORDER_COLORS = ["#4CAF50", "#2196F3", "#FF9800", "#F44336"];

const CheifDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({});
  const [attendanceChart, setAttendanceChart] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentMonth = new Date().toISOString().slice(0, 7);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [ordersRes, statsRes, chartRes] = await Promise.all([
          getChefOrders("all"), // 🔥 kitchen orders
          getMonthlyStats(currentMonth, "own"),
          getMonthlyChart(currentMonth, "own"),
        ]);

        setOrders(ordersRes || []);
        setAttendanceStats(statsRes || {});
        setAttendanceChart(chartRes?.data || []);
      } catch (err) {
        console.error("Chef Dashboard Error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [currentMonth]);

  /* ================= ORDER CALC ================= */
  const totalOrders = orders.length;

  const ready = useMemo(
    () => orders.filter((o) => o.status === "READY").length,
    [orders]
  );

  const pending = useMemo(
    () => orders.filter((o) => o.status === "PENDING").length,
    [orders]
  );

  const preparing = useMemo(
    () => orders.filter((o) => o.status === "PREPARING").length,
    [orders]
  );

  const accepted = useMemo(
    () => orders.filter((o) => o.status === "ACCEPTED").length,
    [orders]
  );

  const orderPie = [
    { name: "Accepted", value: accepted },
    { name: "Preparing", value: preparing },
    { name: "Ready", value: ready },
    { name: "Pending", value: pending },
  ];

  /* ================= ATTENDANCE CALC ================= */
  const totalDays = attendanceStats.totalDays || 0;
  const presentDays = attendanceStats.totalPresent || 0;
  const attendancePercent = attendanceStats.attendancePercent || 0;

  const attendancePie = [
    { name: "Present", value: presentDays },
    { name: "Absent", value: totalDays - presentDays },
  ];

  const attendanceTrend = useMemo(() => {
    return attendanceChart.map((d) => ({
      date: new Date(d.date).getDate(),
      status: d.status === "PRESENT" ? 1 : 0,
    }));
  }, [attendanceChart]);

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="p-6 text-center text-gray-600">
        Loading Chef Dashboard...
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">
        Chef Dashboard (Live ERP)
      </h1>

      {/* ================= ORDER KPIs ================= */}
      <div className="grid grid-cols-4 gap-6 mb-10">
        <KpiCard title="Total Orders" value={totalOrders} />
        <KpiCard title="Accepted" value={accepted} color="text-blue-600" />
        <KpiCard title="Preparing" value={preparing} color="text-yellow-600" />
        <KpiCard title="Ready" value={ready} color="text-green-600" />
      </div>

      {/* ================= ATTENDANCE KPIs ================= */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        <KpiCard title="Total Working Days" value={totalDays} />
        <KpiCard title="Present Days" value={presentDays} color="text-green-600" />
        <KpiCard
          title="Attendance %"
          value={`${attendancePercent}%`}
          color="text-blue-600"
        />
      </div>

      {/* ================= ORDER PIE ================= */}
      <div className="bg-white p-6 rounded-xl shadow mb-10">
        <h3 className="text-xl font-semibold mb-4">
          Order Status Distribution
        </h3>

        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={orderPie} dataKey="value" outerRadius={100}>
              {orderPie.map((_, index) => (
                <Cell key={index} fill={ORDER_COLORS[index]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* ================= ATTENDANCE TREND ================= */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-xl font-semibold mb-4">
          Daily Attendance (This Month)
        </h3>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={attendanceTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[0, 1]} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="status"
              stroke="#4CAF50"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

/* ================= REUSABLE KPI CARD ================= */

const KpiCard = ({ title, value, color = "text-gray-900" }) => (
  <div className="bg-white p-6 rounded-xl shadow">
    <h3 className="text-gray-600">{title}</h3>
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
  </div>
);

export default CheifDashboard;