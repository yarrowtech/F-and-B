// 📁 src/components/Analytics/RestaurantAnalyticsDashboard.jsx
import React, { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell,
  AreaChart, Area, Legend,
} from "recharts";

/* -------------------- Demo fallback data -------------------- */
const demo = {
  staffData: [
    { name: "John", performance: 88 },
    { name: "Priya", performance: 95 },
    { name: "Ali", performance: 75 },
    { name: "Sara", performance: 93 },
  ],
  menuItemData: [
    { name: "Burger", orders: 120 },
    { name: "Pizza", orders: 180 },
    { name: "Pasta", orders: 80 },
    { name: "Salad", orders: 60 },
  ],
  vendorPerformanceData: [
    { vendor: "FreshFarm", quality: 85, delivery: 95 },
    { vendor: "GreenGrocer", quality: 90, delivery: 88 },
    { vendor: "MeatMart", quality: 78, delivery: 80 },
  ],
  profitLossData: [
    { month: "Jan", profit: 20000, loss: 5000 },
    { month: "Feb", profit: 18000, loss: 3000 },
    { month: "Mar", profit: 22000, loss: 4000 },
  ],
  attendanceData: [
    { day: "Mon", rate: 95 },
    { day: "Tue", rate: 92 },
    { day: "Wed", rate: 89 },
    { day: "Thu", rate: 91 },
    { day: "Fri", rate: 93 },
  ],
  dailyWeeklySalesData: [
    { day: "Mon", daily: 3000, weekly: 18000 },
    { day: "Tue", daily: 3200, weekly: 18500 },
    { day: "Wed", daily: 2800, weekly: 17000 },
    { day: "Thu", daily: 3100, weekly: 17500 },
    { day: "Fri", daily: 3500, weekly: 19000 },
  ],
  topSellingItems: [
    { item: "Pizza", sold: 180 },
    { item: "Burger", sold: 120 },
    { item: "Fries", sold: 100 },
    { item: "Soda", sold: 90 },
  ],
};

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

/* -------------------- Utils -------------------- */
const inr = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n ?? 0);

const numberish = (v) => (typeof v === "number" ? v : Number(v || 0));

/* -------------------- Small building blocks -------------------- */
const Card = ({ title, subtitle, right, children, className = "" }) => (
  <div className={`bg-white dark:bg-neutral-800 p-4 rounded-xl shadow ${className}`}>
    <div className="flex items-start justify-between mb-2">
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        {subtitle && (
          <p className="text-xs mt-0.5 text-neutral-500 dark:text-neutral-400">{subtitle}</p>
        )}
      </div>
      {right}
    </div>
    {children}
  </div>
);

const TooltipCard = ({ active, payload, label, moneyKeys = [] }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md bg-white dark:bg-neutral-800 border border-black/5 dark:border-white/10 px-3 py-2 shadow text-xs">
      {label && <div className="font-semibold mb-1">{label}</div>}
      {payload.map((p, i) => {
        const val = p?.value;
        const key = p?.dataKey;
        const show = moneyKeys.includes(key) ? inr(numberish(val)) : numberish(val);
        return (
          <div key={i} className="flex items-center gap-2">
            <span
              className="inline-block w-2.5 h-2.5 rounded-sm"
              style={{ background: p?.color }}
            />
            <span className="capitalize">{key}:</span>
            <span className="font-medium">{show}</span>
          </div>
        );
      })}
    </div>
  );
};

/* -------------------- Main component -------------------- */
const RestaurantAnalyticsDashboard = ({
  staffData = demo.staffData,
  menuItemData = demo.menuItemData,
  vendorPerformanceData = demo.vendorPerformanceData,
  profitLossData = demo.profitLossData,
  attendanceData = demo.attendanceData,
  dailyWeeklySalesData = demo.dailyWeeklySalesData,
  topSellingItems = demo.topSellingItems,
}) => {
  const pieColors = useMemo(
    () => menuItemData.map((_, i) => COLORS[i % COLORS.length]),
    [menuItemData]
  );

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3 p-6">
      {/* Staff Performance */}
      <Card title="Staff Performance" subtitle="Score out of 100">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={staffData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tickMargin={8} />
            <YAxis domain={[0, 100]} />
            <Tooltip content={<TooltipCard />} />
            <Bar dataKey="performance" fill="#3b82f6" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Menu Item Orders */}
      <Card title="Menu Item Orders" subtitle="Shares by item">
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={menuItemData} dataKey="orders" nameKey="name" outerRadius={100} label>
              {menuItemData.map((_, i) => (
                <Cell key={i} fill={pieColors[i]} />
              ))}
            </Pie>
            <Tooltip content={<TooltipCard />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* Vendor Performance */}
      <Card title="Vendor Performance" subtitle="Quality vs Delivery">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={vendorPerformanceData}
            margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="vendor" tickMargin={8} />
            <YAxis domain={[0, 100]} />
            <Tooltip content={<TooltipCard />} />
            <Legend />
            <Bar dataKey="quality" name="Quality" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            <Bar dataKey="delivery" name="Delivery" fill="#10b981" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Profit vs Loss */}
      <Card title="Profit vs Loss" subtitle="Monthly">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={profitLossData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" tickMargin={8} />
            <YAxis />
            <Tooltip content={<TooltipCard moneyKeys={['profit', 'loss']} />} />
            <Legend />
            <Bar dataKey="profit" fill="#22c55e" name="Profit" radius={[6, 6, 0, 0]} />
            <Bar dataKey="loss" fill="#ef4444" name="Loss" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Attendance */}
      <Card title="Attendance Rate" subtitle="Last 5 days">
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={attendanceData}>
            <defs>
              <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" tickMargin={8} />
            <YAxis domain={[0, 100]} />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip content={<TooltipCard />} />
            <Area
              type="monotone"
              dataKey="rate"
              stroke="#3b82f6"
              fillOpacity={1}
              fill="url(#colorRate)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Daily vs Weekly Sales */}
      <Card title="Daily vs Weekly Sales" subtitle="₹ values">
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={dailyWeeklySalesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" tickMargin={8} />
            <YAxis />
            <Tooltip content={<TooltipCard moneyKeys={['daily', 'weekly']} />} />
            <Legend />
            <Line type="monotone" dataKey="daily" stroke="#6366f1" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="weekly" stroke="#10b981" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Top Selling Items (full width) */}
      <Card title="Top-Selling Items" className="col-span-full">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart layout="vertical" data={topSellingItems}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="item" type="category" width={90} />
            <Tooltip content={<TooltipCard />} />
            <Bar dataKey="sold" fill="#f59e0b" radius={[0, 6, 6, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default RestaurantAnalyticsDashboard;
