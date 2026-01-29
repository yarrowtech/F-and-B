import React, { useMemo, useState, useEffect } from "react";
import {
  FaCalendarCheck,
  FaCalendarTimes,
  FaHourglassHalf,
  FaCheckCircle,
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
  AreaChart,
  Area,
} from "recharts";

/* ---------- Colors ---------- */
const COLORS = ["#4CAF50", "#F44336", "#FFC107"];
const GREEN = "#4CAF50";
const RED = "#F44336";
const ORANGE = "#FFC107";
const BLUE = "#2196F3";

/* ---------- Helpers ---------- */
const pretty = (k) => k.replace(/([A-Z])/g, " $1").trim();
const ttFormatter = (value, name) => [value, pretty(name)];

const percentChange = (first, second) => {
  if (first === 0 && second === 0) return 0;
  if (first === 0) return 100;
  return Math.round(((second - first) / first) * 100);
};

/* ---------- Styled KPI Card ---------- */
const KpiCard = ({ title, value, icon, color, total, trend }) => (
  <div className="p-5 h-36 bg-gradient-to-br from-gray-50 dark:from-gray-800 to-gray-100 dark:to-gray-700 rounded-2xl shadow-lg dark:shadow-gray-800 flex items-center gap-5 transform hover:scale-105 transition-transform duration-300">
    <div className={`p-4 rounded-full bg-opacity-20 ${color} text-white`}>{icon}</div>
    <div className="flex-1">
      <p className="text-sm text-gray-500 dark:text-gray-300">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {value}
        {total ? ` / ${total}` : ""}
      </p>
      {trend !== undefined && trend !== null && (
        <p
          className={`text-xs mt-1 ${
            trend > 0 ? "text-green-500" : trend < 0 ? "text-red-500" : "text-gray-500"
          }`}
        >
          {trend > 0 ? "↑" : trend < 0 ? "↓" : "→"} {trend !== 0 ? `${Math.abs(trend)}%` : "No change"} from last
          period
        </p>
      )}
    </div>
  </div>
);

/* ---------- Styled Chart Card ---------- */
const ChartCard = ({ title, children, height = "h-96" }) => (
  <div className={`p-5 ${height} bg-gradient-to-br from-white dark:from-gray-800 to-gray-50 dark:to-gray-700 rounded-2xl shadow-lg`}>
    <p className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-3">{title}</p>
    <div className="w-full h-full">{children}</div>
  </div>
);

const AccountantDashboard = () => {
  /* ---------- Range (SSR-safe) ---------- */
  const [range, setRange] = useState(() => {
    if (typeof window === "undefined") return 14;
    const savedRange = window.localStorage.getItem("dashboardRange");
    return savedRange ? Number(savedRange) : 14;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("dashboardRange", range.toString());
    }
  }, [range]);

  /* ---------- Complex Payment Data ---------- */
  const paymentMethods = ["UPI", "Card", "Cash", "NetBanking"];
  const customers = ["Amit", "Priya", "Rahul", "Sneha", "Vikram", "Neha", "Rohit", "Anjali", "Karan", "Pooja"];
  const statuses = ["Paid", "Pending", "Failed"];
  const paymentData30 = useMemo(() => {
    const payments = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const formattedDate = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const amount = Math.floor(1000 + Math.random() * 4000);
      const orderId = `ORD${1000 + i}`;
      const customer = customers[Math.floor(Math.random() * customers.length)];
      const method = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      // More paid, some pending, few failed
      const statusRand = Math.random();
      let status = "Paid";
      if (statusRand < 0.15) status = "Pending";
      else if (statusRand < 0.22) status = "Failed";
      payments.push({ date: formattedDate, amount, orderId, customer, method, status });
    }
    return payments.reverse();
  }, []);

  const paymentData = useMemo(() => {
    return paymentData30.slice(-range);
  }, [paymentData30, range]);

  // Payment summary analytics
  const paymentSummary = useMemo(() => {
    let total = 0, paid = 0, pending = 0, failed = 0;
    paymentData.forEach((p) => {
      total += p.amount;
      if (p.status === "Paid") paid += p.amount;
      if (p.status === "Pending") pending += p.amount;
      if (p.status === "Failed") failed += p.amount;
    });
    return { total, paid, pending, failed };
  }, [paymentData]);

  /* ---------- Monthly Attendance ---------- */
  const monthlyAttendance = [
    { name: "Week 1", Present: 5, Absent: 1, Leave: 0 },
    { name: "Week 2", Present: 5, Absent: 0, Leave: 1 },
    { name: "Week 3", Present: 5, Absent: 1, Leave: 0 },
    { name: "Week 4", Present: 4, Absent: 1, Leave: 1 },
  ];

  /* ---------- Daily Attendance (30 days) ---------- */
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
      let Present = 0, Absent = 0, Leave = 0;

      if (r < PROB_PRESENT) Present = 1;
      else if (r < PROB_PRESENT + PROB_ABSENT) Absent = 1;
      else Leave = 1;

      return {
        day: `D-${30 - i}`,
        date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
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

  /* ---------- Attendance Stats ---------- */
  const attendanceStats = useMemo(() => {
    return dailyAttendance.reduce(
      (acc, d) => {
        acc.present += d.Present;
        acc.absent += d.Absent;
        acc.leave += d.Leave;
        return acc;
      },
      { present: 0, absent: 0, leave: 0 }
    );
  }, [dailyAttendance]);

  /* ---------- Attendance Pie Data ---------- */
  const attendancePie = useMemo(
    () => [
      { name: "Present", value: attendanceStats.present },
      { name: "Absent", value: attendanceStats.absent },
      { name: "Leave", value: attendanceStats.leave },
    ],
    [attendanceStats]
  );

  /* ---------- Attendance Trends ---------- */
  const calcAttendanceTrends = useMemo(() => {
    const half = Math.floor(dailyAttendance.length / 2) || 1;
    const first = dailyAttendance.slice(0, half);
    const second = dailyAttendance.slice(half);

    const sum = (arr, key) => arr.reduce((a, d) => a + d[key], 0);

    return {
      present: percentChange(sum(first, "Present"), sum(second, "Present")),
      absent: percentChange(sum(first, "Absent"), sum(second, "Absent")),
      leave: percentChange(sum(first, "Leave"), sum(second, "Leave")),
    };
  }, [dailyAttendance]);

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Accountant Dashboard</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Overview of attendance and payments metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="range" className="text-sm text-gray-600 dark:text-gray-300">Date range:</label>
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

      {/* Attendance KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        <KpiCard
          title="Present Days"
          value={attendanceStats.present}
          icon={<FaCalendarCheck className="text-4xl" />}
          color="bg-green-500"
          total={dailyAttendance.length}
          trend={calcAttendanceTrends.present}
        />
        <KpiCard
          title="Absent Days"
          value={attendanceStats.absent}
          icon={<FaCalendarTimes className="text-4xl" />}
          color="bg-red-500"
          total={dailyAttendance.length}
          trend={calcAttendanceTrends.absent}
        />
        <KpiCard
          title="Leave Days"
          value={attendanceStats.leave}
          icon={<FaHourglassHalf className="text-4xl" />}
          color="bg-yellow-500"
          total={dailyAttendance.length}
          trend={calcAttendanceTrends.leave}
        />
        <KpiCard
          title="Attendance %"
          value={`${((attendanceStats.present / dailyAttendance.length) * 100).toFixed(1)}%`}
          icon={<FaCheckCircle className="text-4xl" />}
          color="bg-blue-500"
          trend={null}
        />
        <KpiCard
          title="Total Order Payment Received"
          value={"₹8,750"}
          icon={<FaCheckCircle className="text-4xl" />}
          color="bg-green-700"
          trend={null}
        />
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title={`Attendance Split (Last ${range} Days)`} height="h-96">
          <ResponsiveContainer>
            <PieChart>
              <Tooltip formatter={ttFormatter} />
              <Legend />
              <Pie data={attendancePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" label>
                {attendancePie.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Weekly Attendance (MTD)" height="h-96">
          <ResponsiveContainer>
            <BarChart data={monthlyAttendance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} label={{ value: "Days", angle: -90, position: "insideLeft" }} />
              <Tooltip formatter={ttFormatter} />
              <Legend />
              <Bar dataKey="Present" stackId="a" fill={GREEN} />
              <Bar dataKey="Absent" stackId="a" fill={RED} />
              <Bar dataKey="Leave" stackId="a" fill={ORANGE} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={`Daily Attendance (Last ${range} Days)`} height="h-96">
          <ResponsiveContainer>
            <AreaChart data={dailyAttendance}>
              <defs>
                <linearGradient id="gPresent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={GREEN} stopOpacity={0.6} />
                  <stop offset="95%" stopColor={GREEN} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gAbsent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={RED} stopOpacity={0.6} />
                  <stop offset="95%" stopColor={RED} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gLeave" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={ORANGE} stopOpacity={0.6} />
                  <stop offset="95%" stopColor={ORANGE} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} label={{ value: "Count", angle: -90, position: "insideLeft" }} />
              <Tooltip formatter={ttFormatter} />
              <Legend />
              <Area type="monotone" dataKey="Present" stackId="1" stroke={GREEN} fill="url(#gPresent)" />
              <Area type="monotone" dataKey="Absent" stackId="1" stroke={RED} fill="url(#gAbsent)" />
              <Area type="monotone" dataKey="Leave" stackId="1" stroke={ORANGE} fill="url(#gLeave)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      {/* Day-wise Payment Received Section (Complex) */}
      <section className="mt-8">
        <h2 className="text-xl font-bold mb-4">Day-wise Payment Received</h2>
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-xl p-4 shadow">
            <div className="text-lg font-semibold text-green-700">Total Received</div>
            <div className="text-2xl font-bold">₹{paymentSummary.total.toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4 shadow">
            <div className="text-lg font-semibold text-blue-700">Paid</div>
            <div className="text-2xl font-bold">₹{paymentSummary.paid.toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-yellow-50 rounded-xl p-4 shadow">
            <div className="text-lg font-semibold text-yellow-700">Pending</div>
            <div className="text-2xl font-bold">₹{paymentSummary.pending.toLocaleString('en-IN')}</div>
          </div>
          <div className="bg-red-50 rounded-xl p-4 shadow">
            <div className="text-lg font-semibold text-red-700">Failed</div>
            <div className="text-2xl font-bold">₹{paymentSummary.failed.toLocaleString('en-IN')}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-5 overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Date</th>
                <th className="py-2 px-4 border-b">Order ID</th>
                <th className="py-2 px-4 border-b">Customer</th>
                <th className="py-2 px-4 border-b">Method</th>
                <th className="py-2 px-4 border-b">Amount</th>
                <th className="py-2 px-4 border-b">Status</th>
              </tr>
            </thead>
            <tbody>
              {paymentData.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-2 px-4 border-b">{item.date}</td>
                  <td className="py-2 px-4 border-b">{item.orderId}</td>
                  <td className="py-2 px-4 border-b">{item.customer}</td>
                  <td className="py-2 px-4 border-b">{item.method}</td>
                  <td className="py-2 px-4 border-b font-bold">₹{item.amount.toLocaleString('en-IN')}</td>
                  <td className={`py-2 px-4 border-b font-semibold ${item.status === "Paid" ? "text-green-700" : item.status === "Pending" ? "text-yellow-700" : "text-red-700"}`}>{item.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AccountantDashboard;

