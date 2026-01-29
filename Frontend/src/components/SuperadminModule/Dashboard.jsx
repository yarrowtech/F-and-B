import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
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

// Sample datasets
const adminVendorData = [
  { name: "Jan", Admins: 5, Vendors: 10 },
  { name: "Feb", Admins: 7, Vendors: 15 },
  { name: "Mar", Admins: 10, Vendors: 20 },
  { name: "Apr", Admins: 12, Vendors: 25 },
  { name: "May", Admins: 15, Vendors: 30 },
  { name: "Jun", Admins: 18, Vendors: 35 },
];

const subscriptionTrend = [
  { name: "Jan", Subscriptions: 20 },
  { name: "Feb", Subscriptions: 30 },
  { name: "Mar", Subscriptions: 40 },
  { name: "Apr", Subscriptions: 50 },
  { name: "May", Subscriptions: 65 },
  { name: "Jun", Subscriptions: 80 },
];

const businessData = [
  { name: "Jan", sales: 12000, employees: 10, vendors: 4, menu: 12, profit: 4000 },
  { name: "Feb", sales: 18000, employees: 12, vendors: 5, menu: 14, profit: 6000 },
  { name: "Mar", sales: 22000, employees: 14, vendors: 6, menu: 16, profit: 8000 },
  { name: "Apr", sales: 25000, employees: 15, vendors: 7, menu: 18, profit: 10000 },
  { name: "May", sales: 30000, employees: 17, vendors: 9, menu: 20, profit: 13000 },
  { name: "Jun", sales: 32000, employees: 18, vendors: 10, menu: 22, profit: 15000 },
];

const COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444"];
const glassStyle = "bg-white/30 dark:bg-white/10 backdrop-blur-md border border-white/20 dark:border-white/30 shadow-md transition-all hover:shadow-lg hover:-translate-y-1";

// Reusable Card
const GlassCard = ({ title, value, subtext, chart, delay = 0, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className={`${glassStyle} rounded-2xl p-6 flex flex-col`}
  >
    <div className="flex justify-between items-center mb-4">
      <div>
        <h3 className="text-base font-medium text-gray-700 dark:text-gray-200">{title}</h3>
        {value && (
          <p className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white mt-1">
            {value}
          </p>
        )}
        {subtext && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{subtext}</p>}
      </div>
      {chart && <div className="w-20 h-20">{chart}</div>}
    </div>
    {children && <div className="mt-2 flex-1">{children}</div>}
  </motion.div>
);

// Dashboard Component
const Dashboard = () => {
  return (
    <div className="min-h-full bg-white dark:bg-zinc-900 p-4 sm:p-6 md:p-10 space-y-12">
      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100 tracking-tight"
      >
        Dashboard
      </motion.h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        <GlassCard title="Total Admins" value="18" />
        <GlassCard title="Total Vendors" value="35" />
        <GlassCard title="Total Subscriptions" value="80" subtext="Admins: 25 | Vendors: 55" />

        <GlassCard
          title="User Management"
          value="300"
          subtext="Active: 250 | Inactive: 50"
          chart={
            <ResponsiveContainer>
              <PieChart>
                <Pie data={[{ name: "Active", value: 250 }, { name: "Inactive", value: 50 }]} innerRadius={18} outerRadius={35} dataKey="value">
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          }
        />

        <GlassCard
          title="Subscription Overview"
          value="120"
          subtext="Active: 110 | Pending: 10"
          chart={
            <ResponsiveContainer>
              <PieChart>
                <Pie data={[{ name: "Active", value: 110 }, { name: "Pending", value: 10 }]} innerRadius={18} outerRadius={35} dataKey="value">
                  <Cell fill="#6366f1" />
                  <Cell fill="#f59e0b" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          }
        />

        <GlassCard
          title="🔔 Total Notifications"
          value="92"
          subtext="Unread: 25 | Read: 67"
          chart={
            <ResponsiveContainer>
              <PieChart>
                <Pie data={[{ name: "Unread", value: 25 }, { name: "Read", value: 67 }]} innerRadius={18} outerRadius={35} dataKey="value">
                  <Cell fill="#f59e0b" />
                  <Cell fill="#10b981" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          }
        />

        <GlassCard
          title="Total Analytics"
          value="1,450"
          subtext="Reports Generated"
          chart={
            <ResponsiveContainer>
              <BarChart data={[{ name: "Reports", value: 600 }, { name: "Charts", value: 450 }, { name: "Exports", value: 400 }]}>
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          }
        />
      </div>

      {/* Growth Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard title="📈 Admin & Vendor Growth">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={adminVendorData}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="name" stroke="#71717a" />
              <YAxis stroke="#71717a" />
              <Tooltip />
              <Legend />
              <Bar dataKey="Admins" fill="#6366f1" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Vendors" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard title="📊 Subscription Trends">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={subscriptionTrend}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="name" stroke="#71717a" />
              <YAxis stroke="#71717a" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Subscriptions" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Business Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        <GlassCard title="💰 Sales (₹)">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={businessData}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis tickFormatter={(v) => `₹${v / 1000}k`} className="text-xs" />
              <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
              <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
              <Line type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard title="👥 Employees">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={businessData}>
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
              <Bar dataKey="employees" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard title="🏪 Vendors">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={businessData}>
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
              <Line type="monotone" dataKey="vendors" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard title="📋 Menu Items">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={businessData}>
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
              <Bar dataKey="menu" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard title="💹 Profit (₹)">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={businessData}>
              <XAxis dataKey="name" className="text-xs" />
              <YAxis tickFormatter={(v) => `₹${v / 1000}k`} className="text-xs" />
              <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
              <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
              <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>

        <GlassCard title="🌐 Overall Business Overview">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={businessData.map((d) => ({ name: d.name, value: d.sales + d.profit }))}
                dataKey="value"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {businessData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: "0.75rem" }} />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Messages Overview */}
      <GlassCard title="📬 Messages Overview">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white/50 dark:bg-white/20 rounded-lg p-4">
            <h4 className="text-base font-medium text-gray-600 dark:text-gray-300">Messages Sent</h4>
            <p className="text-4xl font-semibold text-gray-900 dark:text-white mt-1">320</p>
          </div>
          <div className="bg-white/50 dark:bg-white/20 rounded-lg p-4">
            <h4 className="text-base font-medium text-gray-600 dark:text-gray-300">Messages Received</h4>
            <p className="text-4xl font-semibold text-gray-900 dark:text-white mt-1">280</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default Dashboard;
