// src/components/ManagerModule/ManagerDashboard.jsx
import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid
} from "recharts";
import {
  FaUsers, FaBoxes, FaTruck, FaUtensils, FaChartLine,
  FaEnvelope, FaBell
} from "react-icons/fa";

// KPI Stats
const stats = [
  { title: "Total Staff", icon: <FaUsers />, value: 42, color: "bg-blue-500" },
  { title: "Inventory Items", icon: <FaBoxes />, value: 127, color: "bg-orange-500" },
  { title: "Vendors", icon: <FaTruck />, value: 9, color: "bg-green-600" },
  { title: "Menu Items", icon: <FaUtensils />, value: 34, color: "bg-purple-600" },
  { title: "Monthly Sales", icon: <FaChartLine />, value: "₹78,450", color: "bg-yellow-500" },
  { title: "Messages", icon: <FaEnvelope />, value: 56, color: "bg-cyan-600" },
  { title: "Notifications", icon: <FaBell />, value: 18, color: "bg-red-600" },
];

// Data
const dailySalesData = [
  { day: "Mon", sales: 2200 },
  { day: "Tue", sales: 1850 },
  { day: "Wed", sales: 2400 },
  { day: "Thu", sales: 1950 },
  { day: "Fri", sales: 2600 },
  { day: "Sat", sales: 3100 },
  { day: "Sun", sales: 1300 },
];

const weeklySalesData = [
  { week: "Week 1", sales: 47000 },
  { week: "Week 2", sales: 52500 },
  { week: "Week 3", sales: 49500 },
  { week: "Week 4", sales: 54000 },
];

const topSellingItems = [
  { name: "Burger", sales: 1200 },
  { name: "Pizza", sales: 950 },
  { name: "Pasta", sales: 780 },
  { name: "Fries", sales: 700 },
  { name: "Salad", sales: 620 },
];

const profitLossData = [
  { month: "Jan", profit: 12000, loss: 3000 },
  { month: "Feb", profit: 10000, loss: 2000 },
  { month: "Mar", profit: 14000, loss: 4000 },
  { month: "Apr", profit: 9000, loss: 1000 },
  { month: "May", profit: 16000, loss: 5000 },
  { month: "Jun", profit: 18000, loss: 4500 },
];

const staffPerformanceData = [
  { name: "John", performance: 85 },
  { name: "Priya", performance: 92 },
  { name: "Ali", performance: 78 },
  { name: "Sara", performance: 95 },
  { name: "David", performance: 88 },
  { name: "Neha", performance: 91 },
];

const attendanceData = [
  { name: "John", attendance: 94 },
  { name: "Priya", attendance: 89 },
  { name: "Ali", attendance: 76 },
  { name: "Sara", attendance: 98 },
  { name: "David", attendance: 88 },
  { name: "Neha", attendance: 92 },
];

const overallPerformanceData = [
  { month: "Jan", score: 78 },
  { month: "Feb", score: 82 },
  { month: "Mar", score: 85 },
  { month: "Apr", score: 80 },
  { month: "May", score: 88 },
  { month: "Jun", score: 91 },
];

const ManagerDashboard = () => {
  return (
    <div className="space-y-12">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Manager Dashboard Overview</h2>

    
      <div>
        
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-7">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-neutral-800 shadow rounded-xl p-4 flex items-center justify-between hover:shadow-md transition"
            >
              <div className={`p-3 rounded-full text-white text-xl ${stat.color}`}>
                {stat.icon}
              </div>
              <div className="text-right">
                <h4 className="text-sm text-gray-500 dark:text-gray-300">{stat.title}</h4>
                <p className="text-xl font-semibold text-gray-900 dark:text-white">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Daily & Weekly Sales Charts */}
      <div>
        <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-white">📅 Daily & Weekly Sales Charts</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow">
            <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">📅 Daily Sales</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailySalesData}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="sales" fill="#34d399" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow">
            <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">📆 Weekly Sales</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklySalesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="sales" stroke="#60a5fa" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ✅ Top-Selling Items */}
      <div>
        <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-white">🛒 Top-Selling Items</h3>
        <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topSellingItems}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="sales" fill="#fbbf24" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ✅ Attendance Performance */}
      <div>
        <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-white">📋 Attendance Performance</h3>
        <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar
                dataKey="attendance"
                name="Attendance (%)"
                fill="#f87171"
                label={{ position: "top", fill: "#374151", fontSize: 12 }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ✅ Profit vs Loss */}
      <div>
        <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-white">📉 Profit vs Loss</h3>
        <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={profitLossData}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="profit" fill="#10b981" name="Profit" />
              <Bar dataKey="loss" fill="#ef4444" name="Loss" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ✅ Overall Performance */}
      <div>
        <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-white">📈 Overall Performance</h3>
        <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={overallPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={3} name="Performance Score" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ✅ Staff Performance */}
      <div>
        <h3 className="text-xl font-semibold mb-4 text-gray-700 dark:text-white">👥 Staff Performance</h3>
        <div className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={staffPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="performance" fill="#3b82f6" name="Performance (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
