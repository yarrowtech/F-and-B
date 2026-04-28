import React, { useMemo, useState, useEffect } from "react";
import {
  FaCalendarCheck,
  FaCalendarTimes,
  FaUtensils,
  FaExclamationTriangle,
} from "react-icons/fa";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
} from "recharts";

/* ---------- Colors ---------- */
const COLORS = ["#4CAF50", "#F44336", "#FFC107", "#2196F3", "#9C27B0"];

/* ---------- Helpers ---------- */
const pretty = (k) => k.replace(/([A-Z])/g, " $1").trim();
const ttFormatter = (value, name) => [value, pretty(name)];

/* ---------- KPI Card ---------- */
const KpiCard = ({ title, value, icon, color, total }) => (
  <div className="p-5 h-36 bg-gradient-to-br from-gray-50 dark:from-gray-800 to-gray-100 dark:to-gray-700 rounded-2xl shadow-lg flex items-center gap-5">
    <div className={`p-4 rounded-full ${color} text-white`}>{icon}</div>
    <div className="flex-1">
      <p className="text-sm text-gray-500 dark:text-gray-300">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {value}
        {total ? ` / ${total}` : ""}
      </p>
    </div>
  </div>
);

/* ---------- Chart Card ---------- */
const ChartCard = ({ title, children, height = "h-96" }) => (
  <div
    className={`p-5 ${height} bg-gradient-to-br from-white dark:from-gray-800 to-gray-50 dark:to-gray-700 rounded-2xl shadow-lg`}
  >
    <p className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-3">
      {title}
    </p>
    <div className="w-full h-full">{children}</div>
  </div>
);

const SucheifDashboard = () => {
  const [range, setRange] = useState(() => {
    if (typeof window === "undefined") return 14;
    const saved = window.localStorage.getItem("sucheifDashboardRange");
    return saved ? Number(saved) : 14;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("sucheifDashboardRange", range.toString());
    }
  }, [range]);

  /* ---------- Attendance ---------- */
  const dailyAttendance30 = useMemo(() => {
    let seed = 12345;
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };
    const PROB_PRESENT = 0.75;
    const PROB_ABSENT = 0.15;

    return Array.from({ length: 30 }, (_, i) => {
      const r = random();
      let Present = 0,
        Absent = 0,
        Leave = 0;
      if (r < PROB_PRESENT) Present = 1;
      else if (r < PROB_PRESENT + PROB_ABSENT) Absent = 1;
      else Leave = 1;

      return {
        day: `D-${30 - i}`,
        date: new Date(Date.now() - (30 - i) * 86400000).toLocaleDateString(),
        Present,
        Absent,
        Leave,
      };
    });
  }, []);

  const dailyAttendance = useMemo(() => {
    const len = Math.min(range, dailyAttendance30.length);
    return dailyAttendance30.slice(dailyAttendance30.length - len);
  }, [range, dailyAttendance30]);

  const attendanceStats = useMemo(
    () =>
      dailyAttendance.reduce(
        (acc, d) => {
          acc.present += d.Present;
          acc.absent += d.Absent;
          acc.leave += d.Leave;
          return acc;
        },
        { present: 0, absent: 0, leave: 0 }
      ),
    [dailyAttendance]
  );

  /* ---------- Orders ---------- */
  const ordersData = useMemo(() => {
    const today = new Date();
    // Day-wise last 30 days
    const daily = Array.from({ length: 30 }, (_, i) => ({
      day: `D-${30 - i}`,
      orders: Math.floor(Math.random() * 15) + 5,
    }));
    // Month-wise last 12 months
    const monthly = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(today.getFullYear(), i).toLocaleString("default", {
        month: "short",
      }),
      orders: Math.floor(Math.random() * 300) + 50,
    }));
    // Year-wise last 5 years
    const year = Array.from({ length: 5 }, (_, i) => ({
      year: today.getFullYear() - 4 + i,
      orders: Math.floor(Math.random() * 4000) + 500,
    }));

    const total = daily.reduce((acc, d) => acc + d.orders, 0);

    return { total, daily, monthly, year };
  }, []);

  /* ---------- Inventory ---------- */
  const inventoryUsage = useMemo(
    () => [
      { name: "Chicken", total: 10000, used: 6500, minStock: 3000 },
      { name: "Mutton", total: 5000, used: 2000, minStock: 1000 },
      { name: "Rice", total: 15000, used: 8000, minStock: 5000 },
      { name: "Spices", total: 3000, used: 500, minStock: 400 },
    ],
    []
  );

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Sucheif Dashboard
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Full operational & attendance analytics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label
            htmlFor="range"
            className="text-sm text-gray-600 dark:text-gray-300"
          >
            Date range:
          </label>
          <select
            id="range"
            value={range}
            onChange={(e) => setRange(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700 text-sm"
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        <KpiCard
          title="Present Days"
          value={attendanceStats.present}
          icon={<FaCalendarCheck className="text-4xl" />}
          color="bg-green-500"
          total={dailyAttendance.length}
        />
        <KpiCard
          title="Absent Days"
          value={attendanceStats.absent}
          icon={<FaCalendarTimes className="text-4xl" />}
          color="bg-red-500"
          total={dailyAttendance.length}
        />
        <KpiCard
          title="Leave Days"
          value={attendanceStats.leave}
          icon={<FaCalendarTimes className="text-4xl" />}
          color="bg-purple-500"
          total={dailyAttendance.length}
        />
        <KpiCard
          title="Total Orders"
          value={ordersData.total}
          icon={<FaUtensils className="text-4xl" />}
          color="bg-blue-500"
        />
        <KpiCard
          title="Low Stock Alerts"
          value={
            inventoryUsage.filter((i) => i.total - i.used < i.minStock).length
          }
          icon={<FaExclamationTriangle className="text-4xl" />}
          color="bg-yellow-500"
        />
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title={`Attendance Split (Last ${range} Days)`}>
          <ResponsiveContainer>
            <PieChart>
              <Tooltip formatter={ttFormatter} />
              <Legend />
              <Pie
                data={[
                  { name: "Present", value: attendanceStats.present },
                  { name: "Absent", value: attendanceStats.absent },
                  { name: "Leave", value: attendanceStats.leave },
                ]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius="80%"
                label
              >
                {[attendanceStats.present, attendanceStats.absent, attendanceStats.leave].map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={`Orders Last ${range} Days (Day-wise)`}>
          <ResponsiveContainer>
            <LineChart data={ordersData.daily.slice(-range)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#2196F3"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Orders Last 12 Months (Month-wise)">
          <ResponsiveContainer height={300}>
            <LineChart data={ordersData.monthly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#4CAF50"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Orders Last 5 Years (Year-wise)">
          <ResponsiveContainer height={300}>
            <LineChart data={ordersData.year}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#FFC107"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      {/* Inventory */}
      <section className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <ChartCard title="Inventory Usage">
          <ResponsiveContainer>
            <BarChart data={inventoryUsage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(v) => `${v}g`} />
              <Legend />
              <Bar dataKey="used" fill="#4CAF50" />
              <Bar
                dataKey={(i) => i.total - i.used}
                name="Remaining"
                fill="#2196F3"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>
    </div>
  );
};

export default SucheifDashboard;
