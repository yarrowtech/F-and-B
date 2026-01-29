// import React from "react";
// import {
//   LineChart, Line,
//   BarChart, Bar,
//   PieChart, Pie, Cell,
//   XAxis, YAxis, CartesianGrid, Tooltip, Legend,
//   ResponsiveContainer
// } from "recharts";

// const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#d0ed57", "#a4de6c"];

// const AdminAnalytics = () => {
//   const salesData = [
//     { month: "Jan", sales: 40000 },
//     { month: "Feb", sales: 30000 },
//     { month: "Mar", sales: 50000 },
//     { month: "Apr", sales: 45000 },
//     { month: "May", sales: 60000 },
//   ];

//   const employeeData = [
//     { name: "cheifs", count: 12 },
//     { name: "Su-cheifs", count: 15 },
//     { name: "Waiters", count: 20 },
//     { name: "Cleaners", count: 8 },
//     { name: "Managers", count: 4 },
//     { name: "Inventory Managers", count: 4 },
//   ];

//   const menuData = [
//     { item: "Burger", orders: 240 },
//     { item: "Pizza", orders: 180 },
//     { item: "Pasta", orders: 90 },
//     { item: "Drinks", orders: 150 },
//   ];

//   const branchData = [
//     { branch: "Delhi", subs: 120 },
//     { branch: "Mumbai", subs: 200 },
//     { branch: "Bangalore", subs: 150 },
//     { branch: "Kolkata", subs: 100 },
//   ];

//   const profitLossData = [
//     { month: "Jan", profit: 30000, loss: 5000 },
//     { month: "Feb", profit: 25000, loss: 3000 },
//     { month: "Mar", profit: 40000, loss: 2000 },
//     { month: "Apr", profit: 35000, loss: 4000 },
//     { month: "May", profit: 50000, loss: 2500 },
//   ];

//   const vendorPerformance = [
//     { name: "Vendor A", orders: 40 },
//     { name: "Vendor B", orders: 55 },
//     { name: "Vendor C", orders: 30 },
//     { name: "Vendor D", orders: 70 },
//   ];

//   const attendanceData = [
//     { name: "Jan", attendance: 220 },
//     { name: "Feb", attendance: 210 },
//     { name: "Mar", attendance: 230 },
//     { name: "Apr", attendance: 215 },
//     { name: "May", attendance: 240 },
//   ];

//   const employeePerformance = [
//     { name: "Rahul", score: 88 },
//     { name: "Pooja", score: 92 },
//     { name: "Ajay", score: 75 },
//     { name: "Neha", score: 80 },
//   ];

//   return (
//     <div className="p-6 bg-white/80 dark:bg-zinc-900 dark:text-white backdrop-blur-xl shadow-2xl rounded-2xl border border-gray-200 dark:border-zinc-800 max-w-6xl mx-auto transition-all">
//       <h2 className="text-3xl font-bold mb-8 text-left text-gray-800 dark:text-green-400">
//         Analytics
//       </h2>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-gray-900 dark:text-gray-100 transition-colors">
//         {/* Monthly Sales */}
//         <ChartCard title="Monthly Sales">
//           <LineChart data={salesData}>
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis dataKey="month" />
//             <YAxis />
//             <Tooltip />
//             <Line type="monotone" dataKey="sales" stroke="#00C49F" />
//           </LineChart>
//         </ChartCard>

//         {/* Employees by Role */}
//         <ChartCard title="Employees by Role">
//           <BarChart data={employeeData}>
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis dataKey="name" />
//             <YAxis />
//             <Tooltip />
//             <Bar dataKey="count" fill="#8884d8" />
//           </BarChart>
//         </ChartCard>

//         {/* Menu Popularity */}
//         <ChartCard title="Menu Items Popularity">
//           <PieChart>
//             <Pie
//               data={menuData}
//               dataKey="orders"
//               nameKey="item"
//               cx="50%"
//               cy="50%"
//               outerRadius={80}
//               label
//             >
//               {menuData.map((_, index) => (
//                 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//               ))}
//             </Pie>
//             <Tooltip />
//           </PieChart>
//         </ChartCard>

//         {/* Branch-wise Subscriptions */}
//         <ChartCard title="Branch-wise Subscriptions">
//           <BarChart data={branchData}>
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis dataKey="branch" />
//             <YAxis />
//             <Tooltip />
//             <Bar dataKey="subs" fill="#82ca9d" />
//           </BarChart>
//         </ChartCard>

//         {/* Profit vs Loss */}
//         <ChartCard title="Profit vs Loss" fullWidth>
//           <LineChart data={profitLossData}>
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis dataKey="month" />
//             <YAxis />
//             <Tooltip />
//             <Legend />
//             <Line type="monotone" dataKey="profit" stroke="#4ade80" />
//             <Line type="monotone" dataKey="loss" stroke="#f87171" />
//           </LineChart>
//         </ChartCard>

//         {/* Vendor Performance */}
//         <ChartCard title="Vendor Performance">
//           <BarChart data={vendorPerformance}>
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis dataKey="name" />
//             <YAxis />
//             <Tooltip />
//             <Bar dataKey="orders" fill="#6366f1" />
//           </BarChart>
//         </ChartCard>

//         {/* Attendance */}
//         <ChartCard title="Monthly Attendance">
//           <LineChart data={attendanceData}>
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis dataKey="name" />
//             <YAxis />
//             <Tooltip />
//             <Line type="monotone" dataKey="attendance" stroke="#10b981" />
//           </LineChart>
//         </ChartCard>

//         {/* Employee Performance */}
//         <ChartCard title="Employee Performance">
//           <BarChart data={employeePerformance}>
//             <CartesianGrid strokeDasharray="3 3" />
//             <XAxis dataKey="name" />
//             <YAxis />
//             <Tooltip />
//             <Bar dataKey="score" fill="#f59e0b" />
//           </BarChart>
//         </ChartCard>
//       </div>
//     </div>
//   );
// };

// const ChartCard = ({ title, children, fullWidth = false }) => (
//   <div className={`${fullWidth ? "lg:col-span-2" : ""} bg-white dark:bg-gray-800 p-5 rounded-xl shadow transition-all`}>
//     <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">{title}</h3>
//     <ResponsiveContainer width="100%" height={300}>
//       {children}
//     </ResponsiveContainer>
//   </div>
// );

// export default AdminAnalytics;


import React, { useMemo } from "react";
import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from "recharts";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300", "#d0ed57", "#a4de6c"];

/* Small helper to detect mobile without extra deps */
const useIsMobile = () => {
  const [isMobile, setIsMobile] = React.useState(() => window.matchMedia("(max-width: 640px)").matches);
  React.useEffect(() => {
    const m = window.matchMedia("(max-width: 640px)");
    const onChange = (e) => setIsMobile(e.matches);
    m.addEventListener?.("change", onChange);
    return () => m.removeEventListener?.("change", onChange);
  }, []);
  return isMobile;
};

const AdminAnalytics = () => {
  const isMobile = useIsMobile();

  const salesData = [
    { month: "Jan", sales: 40000 },
    { month: "Feb", sales: 30000 },
    { month: "Mar", sales: 50000 },
    { month: "Apr", sales: 45000 },
    { month: "May", sales: 60000 },
  ];

  const employeeData = [
    { name: "Chefs", count: 12 },
    { name: "Su-chefs", count: 15 },
    { name: "Waiters", count: 20 },
    { name: "Cleaners", count: 8 },
    { name: "Managers", count: 4 },
    { name: "Inventory", count: 4 },
  ];

  const menuData = [
    { item: "Burger", orders: 240 },
    { item: "Pizza", orders: 180 },
    { item: "Pasta", orders: 90 },
    { item: "Drinks", orders: 150 },
  ];

  const branchData = [
    { branch: "Delhi", subs: 120 },
    { branch: "Mumbai", subs: 200 },
    { branch: "Bangalore", subs: 150 },
    { branch: "Kolkata", subs: 100 },
  ];

  const profitLossData = [
    { month: "Jan", profit: 30000, loss: 5000 },
    { month: "Feb", profit: 25000, loss: 3000 },
    { month: "Mar", profit: 40000, loss: 2000 },
    { month: "Apr", profit: 35000, loss: 4000 },
    { month: "May", profit: 50000, loss: 2500 },
  ];

  const vendorPerformance = [
    { name: "Vendor A", orders: 40 },
    { name: "Vendor B", orders: 55 },
    { name: "Vendor C", orders: 30 },
    { name: "Vendor D", orders: 70 },
  ];

  const attendanceData = [
    { name: "Jan", attendance: 220 },
    { name: "Feb", attendance: 210 },
    { name: "Mar", attendance: 230 },
    { name: "Apr", attendance: 215 },
    { name: "May", attendance: 240 },
  ];

  const employeePerformance = [
    { name: "Rahul", score: 88 },
    { name: "Pooja", score: 92 },
    { name: "Ajay", score: 75 },
    { name: "Neha", score: 80 },
  ];

  /* KPIs for the summary row */
  const kpis = useMemo(() => {
    const totalSales = salesData.reduce((s, d) => s + d.sales, 0);
    const totalEmployees = employeeData.reduce((s, d) => s + d.count, 0);
    const topMenu = [...menuData].sort((a, b) => b.orders - a.orders)[0]?.item ?? "-";
    const activeSubs = branchData.reduce((s, d) => s + d.subs, 0);
    return [
      { label: "Total Sales (Jan–May)", value: `₹${(totalSales/1000).toFixed(1)}k` },
      { label: "Employees", value: totalEmployees },
      { label: "Top Menu", value: topMenu },
      { label: "Active Subscriptions", value: activeSubs },
    ];
  }, [salesData, employeeData, menuData, branchData]);

  /* Common axis/tooltip styles that adapt to mobile */
  const xTick = isMobile ? { angle: -30, textAnchor: "end", fontSize: 10 } : { fontSize: 12 };
  const yTick = { fontSize: isMobile ? 10 : 12 };
  const chartHeight = isMobile ? 240 : 320;
  const barSize = isMobile ? 28 : 36;
  const margin = isMobile ? { top: 10, right: 10, left: 0, bottom: 30 } : { top: 16, right: 16, left: 8, bottom: 12 };

  return (
    <div className="p-4 sm:p-6 bg-white/80 dark:bg-zinc-900 dark:text-white backdrop-blur-xl shadow-2xl rounded-2xl border border-gray-200 dark:border-zinc-800 max-w-7xl mx-auto transition-all">
      <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-left text-gray-800 dark:text-green-400">
        Analytics
      </h2>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 sm:p-4 shadow-sm"
          >
            <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">{k.label}</div>
            <div className="text-lg sm:text-2xl font-semibold mt-1 text-gray-900 dark:text-white">
              {k.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 text-gray-900 dark:text-gray-100 transition-colors">
        {/* Monthly Sales */}
        <ChartCard title="Monthly Sales" height={chartHeight}>
          <LineChart data={salesData} margin={margin}>
            <CartesianGrid strokeDasharray="3 3" opacity={isMobile ? 0.35 : 0.5} />
            <XAxis dataKey="month" tick={xTick} />
            <YAxis tick={yTick} />
            <Tooltip />
            <Line type="monotone" dataKey="sales" stroke="#00C49F" strokeWidth={2} dot={!isMobile} />
          </LineChart>
        </ChartCard>

        {/* Employees by Role */}
        <ChartCard title="Employees by Role" height={chartHeight}>
          <BarChart data={employeeData} margin={margin} barSize={barSize}>
            <CartesianGrid strokeDasharray="3 3" opacity={isMobile ? 0.35 : 0.5} />
            <XAxis dataKey="name" tick={xTick} />
            <YAxis tick={yTick} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#8884d8" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartCard>

        {/* Menu Popularity */}
        <ChartCard title="Menu Items Popularity" height={chartHeight}>
          <PieChart margin={margin}>
            <Pie
              data={menuData}
              dataKey="orders"
              nameKey="item"
              cx="50%"
              cy="50%"
              outerRadius={isMobile ? 70 : 90}
              label={!isMobile}
            >
              {menuData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            { !isMobile && <Legend /> }
          </PieChart>
        </ChartCard>

        {/* Branch-wise Subscriptions */}
        <ChartCard title="Branch-wise Subscriptions" height={chartHeight}>
          <BarChart data={branchData} margin={margin} barSize={barSize}>
            <CartesianGrid strokeDasharray="3 3" opacity={isMobile ? 0.35 : 0.5} />
            <XAxis dataKey="branch" tick={xTick} />
            <YAxis tick={yTick} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="subs" fill="#82ca9d" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartCard>

        {/* Profit vs Loss */}
        <ChartCard title="Profit vs Loss" fullWidth height={chartHeight}>
          <LineChart data={profitLossData} margin={margin}>
            <CartesianGrid strokeDasharray="3 3" opacity={isMobile ? 0.35 : 0.5} />
            <XAxis dataKey="month" tick={xTick} />
            <YAxis tick={yTick} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
            <Line type="monotone" dataKey="profit" stroke="#4ade80" strokeWidth={2} dot={!isMobile} />
            <Line type="monotone" dataKey="loss" stroke="#f87171" strokeWidth={2} dot={!isMobile} />
          </LineChart>
        </ChartCard>

        {/* Vendor Performance */}
        <ChartCard title="Vendor Performance" height={chartHeight}>
          <BarChart data={vendorPerformance} margin={margin} barSize={barSize}>
            <CartesianGrid strokeDasharray="3 3" opacity={isMobile ? 0.35 : 0.5} />
            <XAxis dataKey="name" tick={xTick} />
            <YAxis tick={yTick} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="orders" fill="#6366f1" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartCard>

        {/* Monthly Attendance */}
        <ChartCard title="Monthly Attendance" height={chartHeight}>
          <LineChart data={attendanceData} margin={margin}>
            <CartesianGrid strokeDasharray="3 3" opacity={isMobile ? 0.35 : 0.5} />
            <XAxis dataKey="name" tick={xTick} />
            <YAxis tick={yTick} />
            <Tooltip />
            <Line type="monotone" dataKey="attendance" stroke="#10b981" strokeWidth={2} dot={!isMobile} />
          </LineChart>
        </ChartCard>

        {/* Employee Performance */}
        <ChartCard title="Employee Performance" height={chartHeight}>
          <BarChart data={employeePerformance} margin={margin} barSize={barSize}>
            <CartesianGrid strokeDasharray="3 3" opacity={isMobile ? 0.35 : 0.5} />
            <XAxis dataKey="name" tick={xTick} />
            <YAxis tick={yTick} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="score" fill="#f59e0b" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartCard>
      </div>
    </div>
  );
};

const ChartCard = ({ title, children, fullWidth = false, height = 300 }) => (
  <div className={`${fullWidth ? "lg:col-span-2" : ""} bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-xl shadow transition-all`}>
    <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 text-gray-800 dark:text-white">{title}</h3>
    <ResponsiveContainer width="100%" height={height}>
      {children}
    </ResponsiveContainer>
  </div>
);

export default AdminAnalytics;
