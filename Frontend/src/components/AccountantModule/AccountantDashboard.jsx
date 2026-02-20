import React, { useEffect, useState, useMemo } from "react";
import {
  getBillingInbox,
  getBillingHistory,
} from "../../services/billing.service";
import {
  getMonthlyStats,
  getMonthlyChart,
} from "../../services/attendance.service";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const COLORS = ["#4CAF50", "#FFC107", "#2196F3", "#F44336"];

const AccountantDashboard = () => {
  const [range, setRange] = useState(14);
  const [inbox, setInbox] = useState([]);
  const [history, setHistory] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({});
  const [attendanceChart, setAttendanceChart] = useState([]);

  const currentMonth = new Date().toISOString().slice(0, 7);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    const loadData = async () => {
      try {
        const unpaid = await getBillingInbox();
        const paid = await getBillingHistory();

        setInbox(unpaid || []);
        setHistory(paid || []);

        // Attendance
        const statsRes = await getMonthlyStats(currentMonth, "restaurant");
        setAttendanceStats(statsRes?.data || statsRes || {});

        const chartRes = await getMonthlyChart(currentMonth, "restaurant");
        setAttendanceChart(chartRes?.data || []);
      } catch (err) {
        console.error("Dashboard error:", err);
      }
    };

    loadData();
  }, [currentMonth]);

  /* ================= DATE FILTER ================= */
  const filteredHistory = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - range);

    return history.filter((bill) => {
      const billDate = new Date(bill.createdAt);
      return billDate >= start && billDate <= end;
    });
  }, [history, range]);

  /* ================= BILLING CALC ================= */
  const totalRevenue = filteredHistory.reduce(
    (sum, bill) => sum + (bill.totalAmount || 0),
    0
  );

  const totalPending = inbox.reduce(
    (sum, bill) => sum + (bill.totalAmount || 0),
    0
  );

  const paymentMethodData = useMemo(() => {
    const methodMap = {};

    filteredHistory.forEach((bill) => {
      const method = bill.paymentMethod || "UNKNOWN";
      methodMap[method] = (methodMap[method] || 0) + bill.totalAmount;
    });

    return Object.entries(methodMap).map(([name, value]) => ({
      name,
      value,
    }));
  }, [filteredHistory]);

  /* ================= ATTENDANCE CALC ================= */
  const totalDays = attendanceStats?.totalDays || 0;
  const totalPresent = attendanceStats?.totalPresent || 0;
  const attendancePercent = attendanceStats?.attendancePercent || 0;

  const attendanceBarData = attendanceChart.map((d) => ({
    date: new Date(d.date).getDate(),
    present: d.status === "PRESENT" ? 1 : 0,
  }));

  const attendancePie = [
    { name: "Present", value: totalPresent },
    { name: "Absent", value: totalDays - totalPresent },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">
        Accountant ERP Dashboard
      </h1>

      {/* ===== RANGE SELECT ===== */}
      <div className="mb-6">
        <select
          value={range}
          onChange={(e) => setRange(Number(e.target.value))}
          className="px-4 py-2 border rounded"
        >
          <option value={7}>Last 7 Days</option>
          <option value={14}>Last 14 Days</option>
          <option value={30}>Last 30 Days</option>
        </select>
      </div>

      {/* ===== KPI CARDS ===== */}
      <div className="grid grid-cols-4 gap-6 mb-10">

        <div className="bg-white p-6 rounded-xl shadow">
          <h3>Total Revenue</h3>
          <p className="text-2xl font-bold text-green-600">
            ₹{totalRevenue.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h3>Pending Amount</h3>
          <p className="text-2xl font-bold text-yellow-600">
            ₹{totalPending.toLocaleString("en-IN")}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h3>Attendance %</h3>
          <p className="text-2xl font-bold text-blue-600">
            {attendancePercent}%
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h3>Total Working Days</h3>
          <p className="text-2xl font-bold">
            {totalDays}
          </p>
        </div>

      </div>

      {/* ===== PAYMENT METHOD PIE ===== */}
      <div className="grid grid-cols-2 gap-6 mb-10">

        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-xl font-semibold mb-4">
            Revenue by Payment Method
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={paymentMethodData} dataKey="value" outerRadius={100} label>
                {paymentMethodData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-xl font-semibold mb-4">
            Attendance Overview
          </h3>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={attendancePie} dataKey="value" outerRadius={100} label>
                {attendancePie.map((_, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* ===== DAILY ATTENDANCE CHART ===== */}
      <div className="bg-white p-6 rounded-xl shadow mb-10">
        <h3 className="text-xl font-semibold mb-4">
          Daily Attendance (This Month)
        </h3>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={attendanceBarData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="present" fill="#4CAF50" />
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};

export default AccountantDashboard;