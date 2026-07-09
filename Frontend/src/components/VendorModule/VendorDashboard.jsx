import React from "react";
import { ShoppingCart, IndianRupee, PackageSearch, Users } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const Dashboard = () => {
  const formatINR = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);

  const salesData = [
    { day: "Mon", sales: 15000 },
    { day: "Tue", sales: 22000 },
    { day: "Wed", sales: 18000 },
    { day: "Thu", sales: 25000 },
    { day: "Fri", sales: 21000 },
    { day: "Sat", sales: 32000 },
    { day: "Sun", sales: 27000 },
  ];

  const adminNoti = 5;
  const superAdminNoti = 3;
  const managerNoti = 4;
  const notificationData = [
    { name: "Admin", value: adminNoti },
    { name: "Super Admin", value: superAdminNoti },
    { name: "Manager", value: managerNoti },
  ];
  const NOTI_COLORS = ["#16a34a", "#f59e0b", "#6366f1"];
  const totalNoti = adminNoti + superAdminNoti + managerNoti;

  const adminMsg = 8;
  const superAdminMsg = 6;
  const managerMsg = 10;
  const messageData = [
    { name: "Admin", value: adminMsg },
    { name: "Super Admin", value: superAdminMsg },
    { name: "Manager", value: managerMsg },
  ];
  const MSG_COLORS = ["#16a34a", "#f97316", "#3b82f6"];
  const totalMsg = adminMsg + superAdminMsg + managerMsg;

  const overview = [
    { title: "Orders", value: "1,245", icon: ShoppingCart },
    { title: "Revenue", value: formatINR(2532000), icon: IndianRupee },
    { title: "Products", value: "320", icon: PackageSearch },
    { title: "Customers", value: "1,045", icon: Users },
  ];

  const recentOrders = [
    { id: 1, customer: "Rahul Sharma", item: "Rice", amount: formatINR(1500), status: "Delivered" },
    { id: 2, customer: "Ananya Singh", item: "Sauses", amount: formatINR(900), status: "Pending" },
    { id: 3, customer: "Amit Verma", item: "Pasta", amount: formatINR(1200), status: "Processing" },
    { id: 4, customer: "Priya Patel", item: "Sushi", amount: formatINR(2000), status: "Delivered" },
  ];

  const statusBadgeClass = (status) => {
    if (status === "Delivered")
      return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
    if (status === "Pending")
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";
    return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300";
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-600 dark:text-green-400">
          Vendor
        </p>
        <h1 className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-100 sm:text-2xl">
          Dashboard
        </h1>
      </div>

      {/* Overview KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overview.map((card) => (
          <div
            key={card.title}
            className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <card.icon size={20} />
            </span>
            <div>
              <h3 className="text-sm text-gray-500 dark:text-gray-400">{card.title}</h3>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Notification & Message Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              Notification Overview
            </h2>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{totalNoti}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Admin: {adminNoti} - Super Admin: {superAdminNoti} - Manager: {managerNoti}
            </p>
          </div>
          <div className="h-20 w-20 shrink-0">
            <PieChart width={80} height={80}>
              <Pie
                data={notificationData}
                cx="50%"
                cy="50%"
                innerRadius={22}
                outerRadius={32}
                paddingAngle={3}
                dataKey="value"
              >
                {notificationData.map((entry, index) => (
                  <Cell key={`cell-noti-${index}`} fill={NOTI_COLORS[index]} />
                ))}
              </Pie>
            </PieChart>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <div>
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
              Message Overview
            </h2>
            <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{totalMsg}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Admin: {adminMsg} - Super Admin: {superAdminMsg} - Manager: {managerMsg}
            </p>
          </div>
          <div className="h-20 w-20 shrink-0">
            <PieChart width={80} height={80}>
              <Pie
                data={messageData}
                cx="50%"
                cy="50%"
                innerRadius={22}
                outerRadius={32}
                paddingAngle={3}
                dataKey="value"
              >
                {messageData.map((entry, index) => (
                  <Cell key={`cell-msg-${index}`} fill={MSG_COLORS[index]} />
                ))}
              </Pie>
            </PieChart>
          </div>
        </div>
      </div>

      {/* Weekly Sales Line Chart */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Weekly Sales</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value) => formatINR(value)} />
              <Line type="monotone" dataKey="sales" stroke="#16a34a" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Orders</h3>
        <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-neutral-700">
          <table className="min-w-[640px] w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-neutral-700 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-left font-medium">Item</th>
                <th className="px-4 py-3 text-left font-medium">Amount</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-neutral-700">
              {recentOrders.map((order) => (
                <tr key={order.id} className="text-gray-700 dark:text-gray-300">
                  <td className="px-4 py-3">{order.customer}</td>
                  <td className="px-4 py-3">{order.item}</td>
                  <td className="px-4 py-3">{order.amount}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

