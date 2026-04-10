import React from "react";
import {
  FaShoppingCart,
  FaRupeeSign,
  FaBoxOpen,
  FaUsers,
  FaBell,
} from "react-icons/fa";
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

  // Notification data
  const adminNoti = 5;
  const superAdminNoti = 3;
  const managerNoti = 4;
  const notificationData = [
    { name: "Admin", value: adminNoti },
    { name: "Super Admin", value: superAdminNoti },
    { name: "Manager", value: managerNoti },
  ];
  const NOTI_COLORS = ["#6366f1", "#f59e0b", "#10b981"];
  const totalNoti = adminNoti + superAdminNoti + managerNoti;

  // Message data
  const adminMsg = 8;
  const superAdminMsg = 6;
  const managerMsg = 10;
  const messageData = [
    { name: "Admin", value: adminMsg },
    { name: "Super Admin", value: superAdminMsg },
    { name: "Manager", value: managerMsg },
  ];
  const MSG_COLORS = ["#3b82f6", "#f97316", "#22c55e"];
  const totalMsg = adminMsg + superAdminMsg + managerMsg;

  const overview = [
    {
      title: "Orders",
      value: "1,245",
      icon: <FaShoppingCart className="text-blue-500 text-3xl" />,
    },
    {
      title: "Revenue",
      value: formatINR(2532000),
      icon: <FaRupeeSign className="text-green-500 text-3xl" />,
    },
    {
      title: "Products",
      value: "320",
      icon: <FaBoxOpen className="text-purple-500 text-3xl" />,
    },
    {
      title: "Customers",
      value: "1,045",
      icon: <FaUsers className="text-yellow-500 text-3xl" />,
    },
  ];

  const recentOrders = [
    { id: 1, customer: "Rahul Sharma", item: "Rice", amount: formatINR(1500), status: "Delivered" },
    { id: 2, customer: "Ananya Singh", item: "Sauses", amount: formatINR(900), status: "Pending" },
    { id: 3, customer: "Amit Verma", item: "Pasta", amount: formatINR(1200), status: "Processing" },
    { id: 4, customer: "Priya Patel", item: "Sushi", amount: formatINR(2000), status: "Delivered" },
  ];

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Dashboard</h1>

      {/* Overview KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {overview.map((card, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow flex items-center gap-4">
            {card.icon}
            <div>
              <h3 className="text-gray-500 dark:text-gray-400 text-sm">{card.title}</h3>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-200">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Notification Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Notification Overview</h2>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalNoti}</p>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              Admin: {adminNoti} | Super Admin: {superAdminNoti} | Manager: {managerNoti}
            </p>
          </div>
          <div className="w-20 h-20">
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
      </div>

      {/* Message Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">Message Overview</h2>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalMsg}</p>
            <p className="text-sm text-gray-500 dark:text-gray-300">
              Admin: {adminMsg} | Super Admin: {superAdminMsg} | Manager: {managerMsg}
            </p>
          </div>
          <div className="w-20 h-20">
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
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Weekly Sales</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value) => formatINR(value)} />
              <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="min-w-[640px] w-full text-sm text-left text-gray-600 dark:text-gray-300">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                <th className="px-4 py-2">Customer</th>
                <th className="px-4 py-2">Item</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-200 dark:border-gray-600">
                  <td className="px-4 py-2">{order.customer}</td>
                  <td className="px-4 py-2">{order.item}</td>
                  <td className="px-4 py-2">{order.amount}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        order.status === "Delivered"
                          ? "bg-green-100 text-green-700"
                          : order.status === "Pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
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
