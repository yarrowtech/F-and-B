import React, { useMemo, useState, useEffect } from "react";
import {
  FaCalendarCheck,
  FaCalendarTimes,
  FaUtensils,
  FaHourglassHalf,
  FaCheckCircle,
  FaConciergeBell,
  FaExclamationTriangle,
  FaArrowUp,
  FaArrowDown,
  FaMinus,
} from "react-icons/fa";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

/* ---------- Colors ---------- */
const COLORS = ["#4CAF50", "#F44336", "#FFC107"];
const ORDER_COLORS = ["#2196F3", "#4CAF50", "#F44336"];
const GREEN = "#4CAF50";
const BLUE = "#2196F3";
const ORANGE = "#FF9800";

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
          } flex items-center gap-1`}
        >
          {trend > 0 ? <FaArrowUp /> : trend < 0 ? <FaArrowDown /> : <FaMinus />}
          {trend !== 0 ? `${Math.abs(trend)}%` : "No change"} from last period
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

/* ---------- Waiter Dashboard ---------- */
const WaiterDashboard = () => {
  /* ---------- Range ---------- */
  const [range, setRange] = useState(() => {
    if (typeof window === "undefined") return 14;
    const savedRange = window.localStorage.getItem("dashboardRange");
    return savedRange ? Number(savedRange) : 14;
  });

  const [attendanceView, setAttendanceView] = useState("daily"); // daily or weekly

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("dashboardRange", range.toString());
    }
  }, [range]);

  /* ---------- Mock Orders ---------- */
  const [orders] = useState(
    Array.from({ length: 120 }, (_, i) => {
      const statuses = ["Accepted", "Served", "Delayed"];
      return {
        id: i + 1,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
      };
    })
  );

  /* ---------- Daily Attendance ---------- */
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
        date: new Date(Date.now() - (30 - i) * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
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

  /* ---------- Weekly Attendance ---------- */
  const weeklyAttendance = useMemo(() => {
    const weeks = [];
    for (let i = 0; i < dailyAttendance.length; i += 7) {
      const slice = dailyAttendance.slice(i, i + 7);
      weeks.push({
        week: `W-${Math.floor(i / 7) + 1}`,
        Present: slice.reduce((a, d) => a + d.Present, 0),
        Absent: slice.reduce((a, d) => a + d.Absent, 0),
        Leave: slice.reduce((a, d) => a + d.Leave, 0),
      });
    }
    return weeks;
  }, [dailyAttendance]);

  /* ---------- Attendance Stats ---------- */
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

  /* ---------- Filter Orders by Range ---------- */
  const filteredOrders = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - range + 1);
    return orders.filter((o) => new Date(o.date) >= cutoff);
  }, [orders, range]);

  /* ---------- Normalize Orders ---------- */
  const normalizedOrders = useMemo(() => filteredOrders.map((o) => ({ ...o, status: o.status.toLowerCase() })), [filteredOrders]);

  /* ---------- Order Stats ---------- */
  const orderStats = useMemo(() => {
    const total = normalizedOrders.length;
    const served = normalizedOrders.filter((o) => o.status === "served").length;
    const delay = normalizedOrders.filter((o) => o.status === "delayed").length;
    const accepted = normalizedOrders.filter((o) => o.status === "accepted").length;
    return { total, served, delay, accepted };
  }, [normalizedOrders]);

  /* ---------- Order Trends ---------- */
  const orderTrends = useMemo(() => {
    const grouped = {};
    normalizedOrders.forEach((o) => {
      const day = new Date(o.date).toLocaleDateString("en-US", { weekday: "short" });
      if (!grouped[day]) grouped[day] = { Handled: 0, Completed: 0 };
      grouped[day].Handled += 1;
      if (o.status === "served" || o.status === "accepted") grouped[day].Completed += 1;
    });
    return Object.keys(grouped).map((day) => ({ name: day, ...grouped[day] }));
  }, [normalizedOrders]);

  /* ---------- Pie Data ---------- */
  const attendancePie = useMemo(
    () => [
      { name: "Present", value: attendanceStats.present },
      { name: "Absent", value: attendanceStats.absent },
      { name: "Leave", value: attendanceStats.leave },
    ],
    [attendanceStats]
  );

  const orderPieData = useMemo(
    () => [
      { name: "Accepted", value: orderStats.accepted },
      { name: "Served", value: orderStats.served },
      { name: "Delayed", value: orderStats.delay },
    ],
    [orderStats]
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

  /* ---------- Order Trends % ---------- */
  const calcOrderTrends = useMemo(() => {
    const half = Math.floor(orderTrends.length / 2) || 1;
    const first = orderTrends.slice(0, half);
    const second = orderTrends.slice(half);
    const sum = (arr, key) => arr.reduce((a, d) => a + (d[key] ?? 0), 0);
    return {
      handledPct: percentChange(sum(first, "Handled"), sum(second, "Handled")),
      completedPct: percentChange(sum(first, "Completed"), sum(second, "Completed")),
    };
  }, [orderTrends]);

  /* ---------- Render ---------- */
  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Waiter Dashboard</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Overview of attendance and order metrics</p>
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

      {/* KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <KpiCard title="Total Orders" value={orderStats.total} icon={<FaUtensils className="text-4xl" />} color="bg-gray-500" trend={calcOrderTrends.handledPct} />
        <KpiCard title="Accepted" value={orderStats.accepted} icon={<FaConciergeBell className="text-4xl" />} color="bg-green-500" total={orderStats.total} trend={null} />
        <KpiCard title="Served" value={orderStats.served} icon={<FaCheckCircle className="text-4xl" />} color="bg-blue-500" total={orderStats.total} trend={calcOrderTrends.completedPct} />
        <KpiCard title="Delayed" value={orderStats.delay} icon={<FaExclamationTriangle className="text-4xl" />} color="bg-red-500" total={orderStats.total} trend={null} />
      </section>

      {/* Attendance KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <KpiCard title="Present Days" value={attendanceStats.present} icon={<FaCalendarCheck className="text-4xl" />} color="bg-green-500" total={dailyAttendance.length} trend={calcAttendanceTrends.present} />
        <KpiCard title="Absent Days" value={attendanceStats.absent} icon={<FaCalendarTimes className="text-4xl" />} color="bg-red-500" total={dailyAttendance.length} trend={calcAttendanceTrends.absent} />
        <KpiCard title="Leave Days" value={attendanceStats.leave} icon={<FaHourglassHalf className="text-4xl" />} color="bg-yellow-500" total={dailyAttendance.length} trend={calcAttendanceTrends.leave} />
        <KpiCard title="Attendance %" value={`${((attendanceStats.present / dailyAttendance.length) * 100).toFixed(1)}%`} icon={<FaCheckCircle className="text-4xl" />} color="bg-blue-500" trend={null} />
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <ChartCard title={`Attendance Split (Last ${range} Days)`} height="h-96">
          <ResponsiveContainer>
            <PieChart>
              <Tooltip formatter={ttFormatter} />
              <Legend formatter={(value, entry) => `${value}: ${entry.payload.value}`} />
              <Pie data={attendancePie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" label>
                {attendancePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={`Attendance (${attendanceView === "daily" ? "Daily" : "Weekly"})`} height="h-96">
          <ResponsiveContainer>
            <AreaChart data={attendanceView === "daily" ? dailyAttendance : weeklyAttendance}>
              <defs>
                <linearGradient id="gPresent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={GREEN} stopOpacity={0.6} />
                  <stop offset="95%" stopColor={GREEN} stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gAbsent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F44336" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#F44336" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="gLeave" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFC107" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#FFC107" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={attendanceView === "daily" ? "date" : "week"} />
              <YAxis allowDecimals={false} label={{ value: "Count", angle: -90, position: "insideLeft" }} />
              <Tooltip formatter={ttFormatter} />
              <Legend />
              <Area type="monotone" dataKey="Present" stackId="1" stroke={GREEN} fill="url(#gPresent)" />
              <Area type="monotone" dataKey="Absent" stackId="1" stroke="#F44336" fill="url(#gAbsent)" />
              <Area type="monotone" dataKey="Leave" stackId="1" stroke="#FFC107" fill="url(#gLeave)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Order Status Distribution" height="h-96">
          <ResponsiveContainer>
            <PieChart>
              <Tooltip formatter={ttFormatter} />
              <Legend formatter={(value, entry) => `${value}: ${entry.payload.value}`} />
              <Pie data={orderPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" label>
                {orderPieData.map((_, i) => <Cell key={i} fill={ORDER_COLORS[i % ORDER_COLORS.length]} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Order Trends (This Week)" height="h-96">
          <ResponsiveContainer>
            <LineChart data={orderTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} label={{ value: "Orders", angle: -90, position: "insideLeft" }} />
              <Tooltip formatter={ttFormatter} />
              <Legend />
              <Line type="monotone" dataKey="Handled" stroke={BLUE} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Completed" stroke={GREEN} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>
    </div>
  );
};

export default WaiterDashboard;
