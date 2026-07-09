import React from "react";
import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

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

const COLORS = ["#16a34a", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#eab308"];

function ChartCard({ title, children }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
      <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
      {children}
    </div>
  );
}

const VendorAnalytics = () => {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-600 dark:text-green-400">
          Vendor
        </p>
        <h1 className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">
          Analytics
        </h1>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <h4 className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Weekly Sales</h4>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            Rs. {weeklyStats.sales.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <h4 className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Profit</h4>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            Rs. {weeklyStats.profit.toLocaleString()}
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <h4 className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Loss</h4>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            Rs. {weeklyStats.loss.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Grid Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard title="Sales Overview">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sales" stroke={COLORS[0]} strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Ordered Products">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="orders" fill={COLORS[0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Order Status">
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
        </ChartCard>

        <ChartCard title="Revenue vs Expenses">
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={revenueVsExpense}>
              <defs>
                <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS[3]} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={COLORS[3]} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="revenue" stroke={COLORS[0]} fillOpacity={1} fill="url(#revenue)" />
              <Area type="monotone" dataKey="expenses" stroke={COLORS[3]} fillOpacity={1} fill="url(#expenses)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Category-wise Sales">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={categorySales} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label>
                {categorySales.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Transactions">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyTransactions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill={COLORS[4]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Customer Growth">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={customerGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="customers" stroke={COLORS[1]} strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};

export default VendorAnalytics;

