import React, { useMemo, useState, useEffect } from "react";
import {
  FaCalendarCheck,
  FaCalendarTimes,
  FaUtensils,
  FaHourglassHalf,
  FaCheckCircle,
  FaConciergeBell,
  FaExclamationTriangle,
} from "react-icons/fa";

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

import { getMonthlyStats, getMonthlyChart } from "../../services/attendance.service";
import { getWaiterOrders } from "../../services/order.service";

/* ================= COLORS ================= */
const COLORS = ["#4CAF50", "#F44336", "#FFC107"];
const ORDER_COLORS = ["#2196F3", "#4CAF50", "#F44336"];

/* ================= COMPONENT ================= */
const WaiterDashboard = () => {
  const [range, setRange] = useState(14);

  const [attendanceStats, setAttendanceStats] = useState({});
  const [attendanceChart, setAttendanceChart] = useState([]);
  const [orders, setOrders] = useState([]);

  const currentMonth = new Date().toISOString().slice(0, 7);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsRes, chartRes, orderRes] = await Promise.all([
          getMonthlyStats(currentMonth, "own"),
          getMonthlyChart(currentMonth, "own"),
          getWaiterOrders(),
        ]);

        setAttendanceStats(statsRes || {});
        setAttendanceChart(chartRes?.data || []);
        setOrders(orderRes || []);
      } catch (err) {
        console.error("Dashboard load error:", err);
      }
    };

    loadData();
  }, []);

  /* ================= ATTENDANCE CALC ================= */
  const totalDays = attendanceStats.totalDays || 0;
  const presentDays = attendanceStats.totalPresent || 0;
  const attendancePercent = attendanceStats.attendancePercent || 0;

  const attendancePie = [
    { name: "Present", value: presentDays },
    { name: "Absent", value: totalDays - presentDays },
  ];

  const attendanceTrend = attendanceChart.map((d) => ({
    date: new Date(d.date).getDate(),
    status: d.status === "PRESENT" ? 1 : 0,
  }));

  /* ================= ORDER CALC ================= */
  const totalOrders = orders.length;
  const served = orders.filter((o) => o.status === "SERVED").length;
  const accepted = orders.filter((o) => o.status === "ACCEPTED").length;
  const delayed = orders.filter((o) => o.status === "DELAYED").length;

  const orderPie = [
    { name: "Accepted", value: accepted },
    { name: "Served", value: served },
    { name: "Delayed", value: delayed },
  ];

  /* ================= RENDER ================= */
  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      <h1 className="text-3xl font-bold mb-8">
        Waiter Dashboard 
      </h1>

      {/* ================= ORDER KPIs ================= */}
      <div className="grid grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow">
          <h3>Total Orders</h3>
          <p className="text-2xl font-bold">{totalOrders}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h3>Accepted</h3>
          <p className="text-2xl font-bold text-blue-600">{accepted}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h3>Served</h3>
          <p className="text-2xl font-bold text-green-600">{served}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h3>Delayed</h3>
          <p className="text-2xl font-bold text-red-600">{delayed}</p>
        </div>
      </div>

      {/* ================= ATTENDANCE KPIs ================= */}
      <div className="grid grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow">
          <h3>Total Working Days</h3>
          <p className="text-2xl font-bold">{totalDays}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h3>Present Days</h3>
          <p className="text-2xl font-bold text-green-600">{presentDays}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h3>Attendance %</h3>
          <p className="text-2xl font-bold text-blue-600">
            {attendancePercent}%
          </p>
        </div>
      </div>

      {/* ================= ATTENDANCE PIE ================= */}
      <div className="bg-white p-6 rounded-xl shadow mb-10">
        <h3 className="text-xl font-semibold mb-4">
          Attendance Distribution
        </h3>

        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={attendancePie} dataKey="value" outerRadius={100}>
              {attendancePie.map((_, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
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
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="status" stroke="#4CAF50" />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};

export default WaiterDashboard;