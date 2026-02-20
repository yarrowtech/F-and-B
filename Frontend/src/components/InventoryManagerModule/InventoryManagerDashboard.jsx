import React, { useEffect, useState } from "react";
import {
  getMonthlyStats,
  getMonthlyChart,
} from "../../services/attendance.service";
import { getInventory } from "../../services/inventory.service";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const COLORS = ["#28a745", "#ffc107", "#dc3545"];

const InventoryManagerDashboard = () => {
  const [inventory, setInventory] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({});
  const [attendanceChart, setAttendanceChart] = useState([]);

  const currentMonth = new Date().toISOString().slice(0, 7);

  /* ================= LOAD DATA ================= */

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user"));
        const restaurantId = user?.restaurant;

        if (!restaurantId) {
          console.error("Restaurant ID not found");
          return;
        }

        /* ===== LOAD INVENTORY ===== */
        const inventoryRes = await getInventory(restaurantId);
        setInventory(inventoryRes || []);

        /* ===== LOAD ATTENDANCE STATS ===== */
        const statsRes = await getMonthlyStats(currentMonth, "own");
        setAttendanceStats(statsRes?.data || statsRes || {});

        /* ===== LOAD ATTENDANCE CHART ===== */
        const chartRes = await getMonthlyChart(currentMonth, "own");
        setAttendanceChart(chartRes?.data || []);

      } catch (err) {
        console.error("Dashboard load error:", err);
      }
    };

    loadData();
  }, [currentMonth]);

  /* ================= INVENTORY CALCULATIONS ================= */

  const totalItems = inventory.length;

  const inStock = inventory.filter(
    (i) => i.stockStatus === "InStock"
  ).length;

  const lowStock = inventory.filter(
    (i) => i.stockStatus === "LowStock"
  ).length;

  const outOfStock = inventory.filter(
    (i) => i.stockStatus === "OutOfStock"
  ).length;

  const stockPieData = [
    { name: "In Stock", value: inStock },
    { name: "Low Stock", value: lowStock },
    { name: "Out of Stock", value: outOfStock },
  ];

  /* ================= ATTENDANCE CALCULATIONS ================= */

  const attendancePercent = attendanceStats?.attendancePercent || 0;
  const totalDays = attendanceStats?.totalDays || 0;
  const presentDays = attendanceStats?.totalPresent || 0;

  const attendanceBarData = attendanceChart.map((d) => ({
    date: new Date(d.date).getDate(),
    present: d.status === "PRESENT" ? 1 : 0,
  }));

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8">
        Inventory Manager Dashboard
      </h1>

      {/* ================= INVENTORY KPI ================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-gray-500">Total Items</h3>
          <p className="text-2xl font-bold">{totalItems}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-gray-500">In Stock</h3>
          <p className="text-2xl font-bold text-green-600">{inStock}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-gray-500">Low Stock</h3>
          <p className="text-2xl font-bold text-yellow-600">{lowStock}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-gray-500">Out of Stock</h3>
          <p className="text-2xl font-bold text-red-600">{outOfStock}</p>
        </div>
      </div>

      {/* ================= INVENTORY PIE ================= */}
      <div className="bg-white p-6 rounded-xl shadow mb-10">
        <h3 className="text-xl font-semibold mb-4">
          Stock Distribution
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={stockPieData} dataKey="value" outerRadius={100}>
              {stockPieData.map((entry, index) => (
                <Cell key={index} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* ================= ATTENDANCE KPI ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-gray-500">Total Working Days</h3>
          <p className="text-2xl font-bold">{totalDays}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-gray-500">Present Days</h3>
          <p className="text-2xl font-bold text-green-600">
            {presentDays}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-gray-500">Attendance %</h3>
          <p className="text-2xl font-bold text-blue-600">
            {attendancePercent}%
          </p>
        </div>
      </div>

      {/* ================= ATTENDANCE BAR CHART ================= */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-xl font-semibold mb-4">
          Daily Attendance (This Month)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={attendanceBarData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="present" fill="#28a745" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default InventoryManagerDashboard;