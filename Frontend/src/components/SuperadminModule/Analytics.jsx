
import React, { Fragment } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";

/* -------------------- Data -------------------- */
const monthlyData = [
  { name: "Jan", sales: 12000, Admins: 10, vendors: 4, menu: 12, subscriptions: 15, profit: 4000 },
  { name: "Feb", sales: 18000, Admins: 12, vendors: 5, menu: 15, subscriptions: 18, profit: 6000 },
  { name: "Mar", sales: 22000, Admins: 14, vendors: 6, menu: 18, subscriptions: 21, profit: 8000 },
  { name: "Apr", sales: 25000, Admins: 15, vendors: 7, menu: 20, subscriptions: 24, profit: 10000 },
  { name: "May", sales: 30000, Admins: 17, vendors: 9, menu: 22, subscriptions: 28, profit: 13000 },
  { name: "Jun", sales: 32000, Admins: 18, vendors: 10, menu: 25, subscriptions: 30, profit: 15000 },
];

const userOverviewPie = [
  { name: "Active", value: 220 },
  { name: "Inactive", value: 80 },
];

const subscriptionPie = [
  { name: "Active", value: 110 },
  { name: "Pending", value: 15 },
  { name: "Cancelled", value: 5 },
];

const analyticsBar = [
  { name: "Reports", value: 600 },
  { name: "Charts", value: 450 },
  { name: "Exports", value: 300 },
];

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444"];
const glassStyle =
  "bg-white/30 dark:bg-white/10 backdrop-blur-md border border-white/20 dark:border-white/30 shadow-md transition-all hover:shadow-lg hover:-translate-y-1";

/* -------------------- UI -------------------- */
const GlassCard = ({ title, children, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className={`${glassStyle} rounded-2xl p-5 ${className}`}
  >
    {title && <h2 className="text-lg font-semibold mb-3 dark:text-white">{title}</h2>}
    {children}
  </motion.div>
);

/**
 * Analytics
 * @param {'page'|'embedded'} mode - 'page' = full-page (adds padding/background/scroll)
 *                                   'embedded' = drop into an existing layout without extra wrapper
 * @param {string} title           - Optional page title (used only in 'page' mode)
 */
export default function Analytics({ mode = "embedded", title = "Analytics" }) {
  const isPage = mode === "page";
  const Wrapper = isPage ? motion.section : Fragment;
  const wrapperProps = isPage
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.5 },
        className:
          "p-4 sm:p-6 md:p-10 bg-white dark:bg-zinc-900 min-h-screen overflow-y-auto",
      }
    : {};

  return (
    <Wrapper {...wrapperProps}>
      {isPage && (
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-6">
          {title}
        </h1>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 mb-10">
        <GlassCard title="👤 User Management Overview">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={userOverviewPie}
                innerRadius={40}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
                label
              >
                {userOverviewPie.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <p className="text-sm mt-2 text-gray-700 dark:text-gray-300 text-center">
            Active: 220 | Inactive: 80
          </p>
        </GlassCard>

        <GlassCard title="📑 Subscription Breakdown">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={subscriptionPie}
                innerRadius={40}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
                label
              >
                {subscriptionPie.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <p className="text-sm mt-2 text-gray-700 dark:text-gray-300 text-center">
            Active: 110 | Pending: 15 | Cancelled: 5
          </p>
        </GlassCard>

        <GlassCard title="📈 Analytics Summary">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={analyticsBar}>
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-sm mt-2 text-gray-700 dark:text-gray-300 text-center">
            Reports: 600 | Charts: 450 | Exports: 300
          </p>
        </GlassCard>
      </div>

      {/* Detailed Monthly Graphs */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <GlassCard title="💰 Sales (₹)">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis tickFormatter={(v) => `${v / 1000}k`} className="text-xs" />
              <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} />
              <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
              <Line type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard title="👥 Admins">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
              <Bar dataKey="Admins" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard title="🏪 Vendors">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyData}>
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
              <Line type="monotone" dataKey="vendors" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard title="📋 Menu">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
              <Bar dataKey="menu" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard title="📬 Subscriptions">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyData}>
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
              <Line type="monotone" dataKey="subscriptions" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard title="🌐 Overall Business Overview">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={monthlyData.map((d) => ({ name: d.name, value: d.sales + d.profit }))}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {monthlyData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>
    </Wrapper>
  );
}
