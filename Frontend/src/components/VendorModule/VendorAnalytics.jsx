import React from "react";
import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { FaChartLine } from "react-icons/fa";

const weeklyStats = {
  sales: 64500,
  profit: 21000,
  loss: 3500,
};

const salesData = [
  { week: "Week 1", sales: 15000 },
  { week: "Week 2", sales: 17000 },
  { week: "Week 3", sales: 14500 },
  { week: "Week 4", sales: 18000 },
];

const topProducts = [
  { name: "Burger", orders: 160 },
  { name: "Cold Coffee", orders: 120 },
  { name: "Pizza", orders: 95 },
  { name: "Apple Juice", orders: 80 },
];

const orderStatus = [
  { name: "Pending", value: 12 },
  { name: "Shipped", value: 18 },
  { name: "Delivered", value: 38 },
  { name: "Cancelled", value: 7 },
];

const revenueVsExpense = [
  { month: "Jan", revenue: 30000, expenses: 18000 },
  { month: "Feb", revenue: 35000, expenses: 22000 },
  { month: "Mar", revenue: 40000, expenses: 25000 },
  { month: "Apr", revenue: 37000, expenses: 24000 },
];

const categorySales = [
  { name: "Fast Food", value: 45000 },
  { name: "Beverages", value: 22000 },
  { name: "Desserts", value: 15000 },
];

const monthlyTransactions = [
  { month: "Jan", count: 320 },
  { month: "Feb", count: 410 },
  { month: "Mar", count: 390 },
  { month: "Apr", count: 470 },
];

const customerGrowth = [
  { month: "Jan", customers: 80 },
  { month: "Feb", customers: 120 },
  { month: "Mar", customers: 150 },
  { month: "Apr", customers: 180 },
];

const COLORS = ["#FFBB28", "#00C49F", "#0088FE", "#FF4D4D", "#845EC2", "#F9C80E"];

const VendorAnalytics = () => {
  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100 transition-colors">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FaChartLine className="text-purple-500" />
        Vendor Analytics Dashboard
      </h1>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-300 mb-1">Weekly Sales</h4>
          <p className="text-2xl font-bold text-green-600 dark:text-green-300">₹{weeklyStats.sales.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-300 mb-1">Profit</h4>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">₹{weeklyStats.profit.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-300 mb-1">Loss</h4>
          <p className="text-2xl font-bold text-red-600 dark:text-red-300">₹{weeklyStats.loss.toLocaleString()}</p>
        </div>
      </div>

      {/* Grid Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Line Chart */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h2 className="text-lg font-bold mb-4">Sales Overview</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h2 className="text-lg font-bold mb-4">Top Ordered Products</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="orders" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h2 className="text-lg font-bold mb-4">Order Status</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={orderStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {orderStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Area Chart */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h2 className="text-lg font-bold mb-4">Revenue vs Expenses</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenueVsExpense}>
              <defs>
                <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00C49F" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#00C49F" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="expenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF4D4D" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#FF4D4D" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke="#00C49F" fillOpacity={1} fill="url(#revenue)" />
              <Area type="monotone" dataKey="expenses" stroke="#FF4D4D" fillOpacity={1} fill="url(#expenses)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Donut Chart */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h2 className="text-lg font-bold mb-4">Category-wise Sales</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={categorySales} cx="50%" cy="50%" innerRadius={50} outerRadius={80} fill="#8884d8" dataKey="value" label>
                {categorySales.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Transactions Bar Chart */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h2 className="text-lg font-bold mb-4">Monthly Transactions</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyTransactions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#845EC2" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Customer Growth Line Chart */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
          <h2 className="text-lg font-bold mb-4">Customer Growth</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={customerGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="customers" stroke="#F9C80E" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default VendorAnalytics;
