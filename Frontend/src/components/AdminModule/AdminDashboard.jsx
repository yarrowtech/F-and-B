
// import React, { useMemo } from "react";
// import {
//   FaUserFriends,
//   FaBuilding,
//   FaShoppingBasket,
//   FaCalendarAlt,
//   FaRupeeSign,
//   FaBell,
//   FaEnvelopeOpenText,
// } from "react-icons/fa";
// import {
//   LineChart, Line,
//   BarChart, Bar,
//   XAxis, YAxis, CartesianGrid, Tooltip, Legend,
//   ResponsiveContainer, AreaChart, Area
// } from "recharts";

// /* ---------- Helpers ---------- */
// const formatCurrency = (value) =>
//   new Intl.NumberFormat("en-IN", {
//     style: "currency",
//     currency: "INR",
//     maximumFractionDigits: 0,
//   }).format(value);

// const GraphBlock = ({ title, height = 300, children }) => (
//   <div className="bg-white/20 dark:bg-white/10 backdrop-blur-md border border-white/30 dark:border-white/10 rounded-2xl shadow-lg p-5">
//     <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">{title}</h3>
//     <ResponsiveContainer width="100%" height={height}>
//       {children}
//     </ResponsiveContainer>
//   </div>
// );

// const Dashboard = () => {
//   /* ---------- KPIs (store Icon COMPONENTS, not elements) ---------- */
//   const KPIs = useMemo(
//     () => [
//       { title: "Total Messages", value: 128, Icon: FaEnvelopeOpenText, color: "text-indigo-500" },
//       { title: "Total Branches", value: 12, Icon: FaBuilding, color: "text-green-500" },
//       { title: "Total Employees", value: 85, Icon: FaUserFriends, color: "text-blue-500" },
//       { title: "Orders Today", value: 245, Icon: FaShoppingBasket, color: "text-orange-500" },
//       { title: "Reservations Today", value: 78, Icon: FaCalendarAlt, color: "text-pink-500" },
//       { title: "Monthly Revenue", value: 2033500, Icon: FaRupeeSign, color: "text-teal-500" },
//       { title: "Daily Revenue", value: 103750, Icon: FaRupeeSign, color: "text-emerald-500" },
//       { title: "Inventory Alerts", value: 6, Icon: FaBell, color: "text-red-500" },
//     ],
//     []
//   );

//   /* ---------- Demo Data ---------- */
//   const notifications = [
//     { id: 1, message: "Low stock alert: Rice is below threshold!", time: "10:30 AM" },
//     { id: 2, message: "New reservation added for 8 PM.", time: "10:45 AM" },
//     { id: 3, message: "Chef Ramesh marked an order as delayed.", time: "11:00 AM" },
//     { id: 4, message: "Vendor B delivery expected today.", time: "11:15 AM" },
//   ];

//   const overallData = [
//     { month: "Jan", revenue: 331000, orders: 200, reservations: 50 },
//     { month: "Feb", revenue: 265600, orders: 180, reservations: 45 },
//     { month: "Mar", revenue: 415000, orders: 250, reservations: 70 },
//     { month: "Apr", revenue: 397400, orders: 230, reservations: 65 },
//     { month: "May", revenue: 490870, orders: 280, reservations: 80 },
//     { month: "Jun", revenue: 583100, orders: 310, reservations: 95 },
//   ];

//   const attendanceData = [
//     { day: "Mon", present: 80, absent: 5 },
//     { day: "Tue", present: 82, absent: 3 },
//     { day: "Wed", present: 78, absent: 7 },
//     { day: "Thu", present: 85, absent: 2 },
//     { day: "Fri", present: 83, absent: 4 },
//     { day: "Sat", present: 75, absent: 10 },
//     { day: "Sun", present: 70, absent: 15 },
//   ];

//   const inventoryData = [
//     { item: "Tomatoes", stock: 5 },
//     { item: "Cheese", stock: 12 },
//     { item: "Beverages", stock: 50 },
//     { item: "Rice", stock: 2 },
//     { item: "Chicken", stock: 20 },
//   ];

//   const realTimeData = [
//     { time: "10:00", activeOrders: 52 },
//     { time: "10:10", activeOrders: 57 },
//     { time: "10:20", activeOrders: 55 },
//     { time: "10:30", activeOrders: 60 },
//     { time: "10:40", activeOrders: 58 },
//     { time: "10:50", activeOrders: 61 },
//     { time: "11:00", activeOrders: 63 },
//     { time: "11:10", activeOrders: 66 },
//   ];

//   const monthlySales = [
//     { month: "Jan", sales: 1245000 },
//     { month: "Feb", sales: 2490000 },
//     { month: "Mar", sales: 3735000 },
//     { month: "Apr", sales: 4980000 },
//     { month: "May", sales: 4565000 },
//   ];

//   const employeesByRole = [
//     { role: "Cheifs", count: 15 },
//     { role: "SuCheifs", count: 18 },
//     { role: "Waiters", count: 20 },
//     { role: "Cleaners", count: 10 },
//     { role: "Managers", count: 5 },
//     { role: "Inventory Managers", count: 25 },
//   ];

//   const menuPopularity = [
//     { item: "Pizza", sales: 240 },
//     { item: "Burgers", sales: 180 },
//     { item: "Salads", sales: 90 },
//     { item: "Pasta", sales: 150 },
//   ];

//   const branchSubscriptions = [
//     { branch: "Delhi", subs: 200 },
//     { branch: "Mumbai", subs: 150 },
//     { branch: "Bangalore", subs: 180 },
//     { branch: "Kolkata", subs: 100 },
//   ];

//   const profitLoss = [
//     { month: "Jan", profit: 3320000, loss: 415000 },
//     { month: "Feb", profit: 3735000, loss: 664000 },
//     { month: "Mar", profit: 3984000, loss: 830000 },
//     { month: "Apr", profit: 4150000, loss: 996000 },
//     { month: "May", profit: 4320000, loss: 1245000 },
//   ];

//   const vendorPerformance = [
//     { vendor: "Vendor A", performance: 70 },
//     { vendor: "Vendor B", performance: 60 },
//     { vendor: "Vendor C", performance: 85 },
//     { vendor: "Vendor D", performance: 50 },
//   ];

//   const monthlyAttendance = [
//     { month: "Jan", attendance: 100 },
//     { month: "Feb", attendance: 150 },
//     { month: "Mar", attendance: 200 },
//     { month: "Apr", attendance: 220 },
//     { month: "May", attendance: 240 },
//   ];

//   const employeePerformance = [
//     { name: "Gourav", score: 90 },
//     { name: "Shapnanil", score: 85 },
//     { name: "Debyapriya", score: 70 },
//     { name: "Raktim", score: 80 },
//   ];

//   return (
//     <div className="p-4 md:p-6 bg-gradient-to-br from-gray-100/60 to-white/30 dark:from-gray-900/60 dark:to-gray-800/30 text-gray-800 dark:text-gray-200 min-h-screen space-y-6 md:space-y-8">
//       {/* Header */}
//       <div className="flex justify-between items-center">
//         <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-green-400">Dashboard</h1>
//       </div>

//       {/* KPI row: on mobile it's horizontal scroll; on desktop it becomes a grid */}
//       <div className="flex gap-3 overflow-x-auto pb-1 snap-x md:grid md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 md:gap-6 md:overflow-visible md:snap-none">
//         {KPIs.map(({ title, value, Icon, color }, i) => (
//           <div
//             key={i}
//             className="min-w-[240px] md:min-w-0 snap-start bg-white/20 dark:bg-white/10 backdrop-blur-md border border-white/30 dark:border-white/10 rounded-2xl shadow p-4 flex items-center gap-3"
//           >
//             <Icon size={24} className={`${color} shrink-0`} />
//             <div>
//               <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">{title}</p>
//               <h2 className="text-lg md:text-xl font-semibold">
//                 {typeof value === "number" && title.includes("Revenue") ? formatCurrency(value) : value}
//               </h2>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Notifications */}
//       <div className="bg-white/20 dark:bg-white/10 backdrop-blur-md border border-white/30 dark:border-white/10 rounded-2xl shadow p-4 md:p-5">
//         <h3 className="text-base md:text-lg font-semibold mb-3 md:mb-4 text-gray-700 dark:text-gray-200 flex items-center gap-2">
//           <FaBell className="text-red-500" /> Notifications
//         </h3>
//         {/* Mobile: horizontal cards; Desktop: responsive grid */}
//         <div className="flex gap-3 overflow-x-auto md:grid md:grid-cols-2 xl:grid-cols-4 md:gap-4 md:overflow-visible">
//           {notifications.map((n) => (
//             <div
//               key={n.id}
//               className="min-w-[260px] md:min-w-0 bg-white/40 dark:bg-black/20 rounded-xl p-3 md:p-4 text-sm shadow hover:shadow-md transition flex justify-between items-start"
//             >
//               <span className="text-gray-800 dark:text-gray-100 pr-3">{n.message}</span>
//               <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{n.time}</span>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Charts: one column on mobile; two on xl+ */}
//       <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
//         <GraphBlock title="Overall Performance (Revenue, Orders, Reservations)">
//           <LineChart data={overallData}>
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis dataKey="month" />
//             <YAxis yAxisId="left" tickFormatter={formatCurrency} />
//             <YAxis yAxisId="right" orientation="right" />
//             <Tooltip formatter={(val, name) => (name === "revenue" ? formatCurrency(val) : val)} />
//             <Legend />
//             <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#4F46E5" />
//             <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#10B981" />
//             <Line yAxisId="right" type="monotone" dataKey="reservations" stroke="#F59E0B" />
//           </LineChart>
//         </GraphBlock>

//         <GraphBlock title="Active Orders (Real Time)">
//           <LineChart data={realTimeData}>
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis dataKey="time" />
//             <YAxis />
//             <Tooltip />
//             <Legend />
//             <Line type="monotone" dataKey="activeOrders" stroke="#10B981" dot={false} />
//           </LineChart>
//         </GraphBlock>

//         <GraphBlock title="Monthly Sales (₹)">
//           <BarChart data={monthlySales}>
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis dataKey="month" />
//             <YAxis tickFormatter={formatCurrency} />
//             <Tooltip formatter={(v) => formatCurrency(v)} />
//             <Legend />
//             <Bar dataKey="sales" fill="#4F46E5" />
//           </BarChart>
//         </GraphBlock>

//         <GraphBlock title="Employee Roles">
//           <BarChart data={employeesByRole}>
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis dataKey="role" />
//             <YAxis />
//             <Tooltip />
//             <Legend />
//             <Bar dataKey="count" fill="#10B981" />
//           </BarChart>
//         </GraphBlock>

//         <GraphBlock title="Menu Popularity">
//           <BarChart data={menuPopularity}>
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis dataKey="item" />
//             <YAxis />
//             <Tooltip />
//             <Legend />
//             <Bar dataKey="sales" fill="#F59E0B" />
//           </BarChart>
//         </GraphBlock>

//         <GraphBlock title="Branch Subscriptions">
//           <BarChart data={branchSubscriptions}>
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis dataKey="branch" />
//             <YAxis />
//             <Tooltip />
//             <Legend />
//             <Bar dataKey="subs" fill="#6366F1" />
//           </BarChart>
//         </GraphBlock>

//         <GraphBlock title="Profit vs Loss">
//           <AreaChart data={profitLoss}>
//             <defs>
//               <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
//                 <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
//                 <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
//               </linearGradient>
//               <linearGradient id="lossFill" x1="0" y1="0" x2="0" y2="1">
//                 <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25} />
//                 <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
//               </linearGradient>
//             </defs>
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis dataKey="month" />
//             <YAxis tickFormatter={formatCurrency} />
//             <Tooltip formatter={(v) => formatCurrency(v)} />
//             <Legend />
//             <Area type="monotone" dataKey="profit" stroke="#10B981" fill="url(#profitFill)" />
//             <Area type="monotone" dataKey="loss" stroke="#EF4444" fill="url(#lossFill)" />
//           </AreaChart>
//         </GraphBlock>

//         <GraphBlock title="Vendor Performance">
//           <BarChart data={vendorPerformance}>
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis dataKey="vendor" />
//             <YAxis />
//             <Tooltip />
//             <Legend />
//             <Bar dataKey="performance" fill="#8B5CF6" />
//           </BarChart>
//         </GraphBlock>

//         <GraphBlock title="Monthly Attendance">
//           <LineChart data={monthlyAttendance}>
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis dataKey="month" />
//             <YAxis />
//             <Tooltip />
//             <Legend />
//             <Line type="monotone" dataKey="attendance" stroke="#0EA5E9" />
//           </LineChart>
//         </GraphBlock>

//         <GraphBlock title="Attendance (This Week)">
//           <BarChart data={attendanceData}>
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis dataKey="day" />
//             <YAxis />
//             <Tooltip />
//             <Legend />
//             <Bar dataKey="present" fill="#4F46E5" />
//             <Bar dataKey="absent" fill="#EF4444" />
//           </BarChart>
//         </GraphBlock>

//         <GraphBlock title="Inventory Snapshot">
//           <BarChart data={inventoryData}>
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis dataKey="item" />
//             <YAxis />
//             <Tooltip />
//             <Legend />
//             <Bar dataKey="stock" fill="#F59E0B" />
//           </BarChart>
//         </GraphBlock>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;























import React, { useEffect, useMemo, useState } from "react";
import {
  FaUserFriends,
  FaBuilding,
  FaShoppingBasket,
  FaCalendarAlt,
  FaRupeeSign,
  FaBell,
} from "react-icons/fa";
import {
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from "recharts";
import axios from "axios";
import { io } from "socket.io-client";

/* ================= SOCKET ================= */
const socket = io("http://localhost:5000");

/* ================= HELPERS ================= */
const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const GraphBlock = ({ title, height = 300, children }) => (
  <div className="bg-white/20 dark:bg-white/10 backdrop-blur-md border border-white/30 dark:border-white/10 rounded-2xl shadow-lg p-5">
    <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-200">
      {title}
    </h3>
    <ResponsiveContainer width="100%" height={height}>
      {children}
    </ResponsiveContainer>
  </div>
);

const Dashboard = () => {
  const token = localStorage.getItem("token");

  const [todayData, setTodayData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= FETCH DATA ================= */
  const fetchDashboard = async () => {
    try {
      setLoading(true);

      const todayRes = await axios.get(
        "http://localhost:5000/api/dashboard/today",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const monthlyRes = await axios.get(
        "http://localhost:5000/api/dashboard/monthly",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const topRes = await axios.get(
        "http://localhost:5000/api/dashboard/top-items?type=today",
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTodayData(todayRes.data.data);
      setMonthlyData(monthlyRes.data.data);
      setTopItems(topRes.data.data);

    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= INITIAL LOAD + SOCKET ================= */
  useEffect(() => {
    fetchDashboard();

    socket.on("dashboardUpdate", () => {
      fetchDashboard();
    });

    return () => {
      socket.off("dashboardUpdate");
    };
  }, []);

  /* ================= KPI VALUES ================= */
  const totalTodayRevenue = todayData.reduce(
    (sum, r) => sum + r.totalRevenue,
    0
  );

  const totalTodayOrders = todayData.reduce(
    (sum, r) => sum + r.totalOrders,
    0
  );

  const totalMonthlyRevenue = monthlyData.reduce(
    (sum, r) => sum + r.totalRevenue,
    0
  );

  const KPIs = useMemo(
    () => [
      { title: "Orders Today", value: totalTodayOrders, Icon: FaShoppingBasket, color: "text-orange-500" },
      { title: "Daily Revenue", value: totalTodayRevenue, Icon: FaRupeeSign, color: "text-emerald-500" },
      { title: "Monthly Revenue", value: totalMonthlyRevenue, Icon: FaRupeeSign, color: "text-teal-500" },
      { title: "Top Items", value: topItems.length, Icon: FaBuilding, color: "text-blue-500" },
    ],
    [totalTodayOrders, totalTodayRevenue, totalMonthlyRevenue, topItems]
  );

  if (loading) {
    return <div className="p-10 text-center">Loading dashboard...</div>;
  }

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* ================= KPI CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {KPIs.map(({ title, value, Icon, color }, i) => (
          <div
            key={i}
            className="bg-white/20 backdrop-blur-md rounded-2xl shadow p-4 flex items-center gap-4"
          >
            <Icon size={26} className={color} />
            <div>
              <p className="text-sm text-gray-500">{title}</p>
              <h2 className="text-xl font-semibold">
                {title.includes("Revenue")
                  ? formatCurrency(value)
                  : value}
              </h2>
            </div>
          </div>
        ))}
      </div>

      {/* ================= TOP ITEMS CHART ================= */}
      <GraphBlock title="Top Selling Items Today">
        <BarChart data={topItems}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="quantity" fill="#10B981" />
        </BarChart>
      </GraphBlock>

      {/* ================= MONTHLY REVENUE CHART ================= */}
      <GraphBlock title="Monthly Revenue Overview">
        <LineChart data={monthlyData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(v) => formatCurrency(v)} />
          <Legend />
          <Line
            type="monotone"
            dataKey="totalRevenue"
            stroke="#4F46E5"
          />
        </LineChart>
      </GraphBlock>
    </div>
  );
};

export default Dashboard;
