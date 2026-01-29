import React, { useMemo, useState, useEffect } from "react";
import {
  FaCalendarCheck,
  FaCalendarTimes,
  FaUtensils,
  FaHourglassHalf,
  FaCheckCircle,
  FaClock,
  FaConciergeBell,
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
  AreaChart,
  Area,
} from "recharts";

/* ---------- Colors ---------- */
const COLORS = ["#4CAF50", "#F44336", "#FFC107"];
const ORDER_COLORS = ["#2196F3", "#4CAF50", "#FF9800", "#F44336"];
const GREEN = "#4CAF50";
const BLUE = "#2196F3";
const ORANGE = "#FF9800";

/* ---------- Helpers ---------- */
const pretty = (k) => k.replace(/([A-Z])/g, " $1").trim();
const ttFormatter = (value, name) => [String(value), pretty(name)];
const percentChange = (first, second) => {
  if (first === 0 && second === 0) return 0;
  if (first === 0) return 100;
  return Math.round(((second - first) / first) * 100);
};

/* ---------- Media query (SSR-safe) ---------- */
const useMediaQuery = (query) => {
  const get = () =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(query).matches
      : false;
  const [matches, setMatches] = useState(get);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(query);
    const handler = (e) => setMatches(e.matches);
    if (mq.addEventListener) mq.addEventListener("change", handler);
    else mq.addListener(handler);
    setMatches(mq.matches);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener("change", handler);
      else mq.removeListener(handler);
    };
  }, [query]);

  return matches;
};

/* ---------- Styled KPI Card ---------- */
const KpiCard = ({ title, value, icon, color, total, trend, compact = false }) => (
  <div className={`min-w-0 p-4 ${compact ? "h-28" : "h-36"} bg-gradient-to-br from-gray-50 dark:from-gray-800 to-gray-100 dark:to-gray-700 rounded-2xl shadow-lg dark:shadow-gray-800 flex items-center gap-4 transform hover:scale-[1.02] transition-transform duration-300`}>
    <div className={`rounded-full bg-opacity-20 ${color} text-white ${compact ? "p-3" : "p-4"}`}>{icon}</div>
    <div className="flex-1 min-w-0">
      <p className={`truncate ${compact ? "text-xs" : "text-sm"} text-gray-500 dark:text-gray-300`}>{title}</p>
      <p className={`truncate ${compact ? "text-xl" : "text-2xl"} font-bold text-gray-900 dark:text-gray-100`}>
        {value}{typeof total === "number" ? ` / ${total}` : ""}
      </p>
      {trend !== undefined && trend !== null && (
        <p className={`truncate ${compact ? "text-[10px]" : "text-xs"} mt-1 ${trend > 0 ? "text-green-500" : trend < 0 ? "text-red-500" : "text-gray-500"}`}>
          {trend > 0 ? "↑" : trend < 0 ? "↓" : "→"} {trend !== 0 ? `${Math.abs(trend)}%` : "No change"} from last period
        </p>
      )}
    </div>
  </div>
);

/* ---------- Styled Chart Card ---------- */
const ChartCard = ({ title, children, heightMobile = "h-64", height = "h-96", isMobile }) => (
  <div className={`min-w-0 p-4 ${isMobile ? heightMobile : height} bg-gradient-to-br from-white dark:from-gray-800 to-gray-50 dark:to-gray-700 rounded-2xl shadow-lg`}>
    <p className={`font-medium mb-3 ${isMobile ? "text-xs" : "text-sm"} text-gray-500 dark:text-gray-300`}>{title}</p>
    <div className="w-full h-full min-w-0">{children}</div>
  </div>
);

/* ---------- Cheif Dashboard ---------- */
const CheifDashboard = () => {
  const isMobile = useMediaQuery("(max-width: 640px)");

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

  /* ---------- Monthly Attendance ---------- */
  const monthlyAttendance = [
    { name: "Week 1", Present: 5, Absent: 1, Leave: 0 },
    { name: "Week 2", Present: 5, Absent: 0, Leave: 1 },
    { name: "Week 3", Present: 5, Absent: 1, Leave: 0 },
    { name: "Week 4", Present: 4, Absent: 1, Leave: 1 },
  ];

  /* ---------- Daily Attendance (30 days, one-hot per day) ---------- */
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
        date: new Date(Date.now() - (30 - i) * 86400000).toLocaleDateString(),
        Present, Absent, Leave,
      };
    });
  }, []);

  const dailyAttendance = useMemo(() => {
    const len = Math.min(range, dailyAttendance30.length);
    return dailyAttendance30.slice(dailyAttendance30.length - len);
  }, [range, dailyAttendance30]);

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

  /* ---------- Order Stats ---------- */
  const orderStatsBase = useMemo(() => ({ total: 120, pending: 20, delay: 10, ready: 70 }), []);
  const orderStats = useMemo(() => {
    const total = orderStatsBase.total ?? 0;
    const pending = Math.max(orderStatsBase.pending ?? 0, 0);
    const delay = Math.max(orderStatsBase.delay ?? 0, 0);
    const ready = Math.max(orderStatsBase.ready ?? 0, 0);
    let accepted = total - (pending + delay + ready);
    if (accepted < 0) accepted = 0;
    return { total, pending, delay, ready, accepted };
  }, [orderStatsBase]);

  /* ---------- Weekly Trends ---------- */
  const orderTrends = [
    { name: "Mon", Handled: 15, Pending: 5, Completed: 12 },
    { name: "Tue", Handled: 20, Pending: 3, Completed: 18 },
    { name: "Wed", Handled: 18, Pending: 7, Completed: 16 },
    { name: "Thu", Handled: 12, Pending: 2, Completed: 10 },
    { name: "Fri", Handled: 25, Pending: 2, Completed: 23 },
    { name: "Sat", Handled: 20, Pending: 1, Completed: 20 },
    { name: "Sun", Handled: 10, Pending: 0, Completed: 9 },
  ];

  /* ---------- % ---------- */
  const attendancePct =
    dailyAttendance.length > 0
      ? `${((attendanceStats.present / dailyAttendance.length) * 100).toFixed(1)}%`
      : "0%";

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
      { name: "Ready", value: orderStats.ready },
      { name: "Pending", value: orderStats.pending },
      { name: "Delayed", value: orderStats.delay },
    ],
    [orderStats]
  );

  /* ---------- Half/half trends ---------- */
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

  const calcOrderTrends = useMemo(() => {
    const half = Math.floor(orderTrends.length / 2) || 1;
    const first = orderTrends.slice(0, half);
    const second = orderTrends.slice(half);
    const sum = (arr, key) => arr.reduce((a, d) => a + (d[key] ?? 0), 0);
    return {
      handledPct: percentChange(sum(first, "Handled"), sum(second, "Handled")),
      completedPct: percentChange(sum(first, "Completed"), sum(second, "Completed")),
      pendingPct: percentChange(sum(first, "Pending"), sum(second, "Pending")),
    };
  }, [orderTrends]);

  /* ---------- common chart margins to prevent horizontal overflow ---------- */
  const chartMargin = { top: 8, right: 8, bottom: 8, left: 8 };

  return (
    <div className={`min-h-screen ${isMobile ? "p-3" : "p-6"} bg-gray-50 dark:bg-gray-900 overflow-x-hidden`}>
      {/* Header */}
      <div className={`flex ${isMobile ? "flex-col gap-2" : "flex-col sm:flex-row gap-3"} sm:items-center justify-between mb-6`}>
        <div className="min-w-0">
          <h1 className={`${isMobile ? "text-2xl" : "text-3xl"} font-bold text-gray-900 dark:text-gray-100`}>Cheif Dashboard</h1>
          <p className={`${isMobile ? "text-xs" : "text-sm"} text-gray-600 dark:text-gray-400 mt-1`}>
            Overview of attendance and order metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="range" className={`${isMobile ? "text-xs" : "text-sm"} text-gray-600 dark:text-gray-300`}>
            Date range:
          </label>
          <select
            id="range"
            value={range}
            onChange={(e) => setRange(Number(e.target.value))}
            className={`rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700 ${isMobile ? "px-2 py-1 text-xs" : "px-3 py-2 text-sm"}`}
            aria-label="Select date range"
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
          </select>
        </div>
      </div>

      {/* KPI Cards — 1 col on mobile for breathing room */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6">
        <KpiCard title="Total Orders" value={orderStats.total} icon={<FaUtensils className={isMobile ? "text-2xl" : "text-4xl"} />} color="bg-gray-500" trend={calcOrderTrends.handledPct} compact={isMobile} />
        <KpiCard title="Accepted" value={orderStats.accepted} icon={<FaConciergeBell className={isMobile ? "text-2xl" : "text-4xl"} />} color="bg-green-500" total={orderStats.total} trend={null} compact={isMobile} />
        <KpiCard title="Ready" value={orderStats.ready} icon={<FaCheckCircle className={isMobile ? "text-2xl" : "text-4xl"} />} color="bg-blue-500" total={orderStats.total} trend={calcOrderTrends.completedPct} compact={isMobile} />
        <KpiCard title="Pending" value={orderStats.pending} icon={<FaClock className={isMobile ? "text-2xl" : "text-4xl"} />} color="bg-yellow-500" total={orderStats.total} trend={calcOrderTrends.pendingPct} compact={isMobile} />
        <KpiCard title="Delayed" value={orderStats.delay} icon={<FaExclamationTriangle className={isMobile ? "text-2xl" : "text-4xl"} />} color="bg-red-500" total={orderStats.total} trend={null} compact={isMobile} />
      </section>

      {/* Attendance KPI Cards — also 1 col on mobile */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6">
        <KpiCard title="Present Days" value={attendanceStats.present} icon={<FaCalendarCheck className={isMobile ? "text-2xl" : "text-4xl"} />} color="bg-green-500" total={dailyAttendance.length} trend={calcAttendanceTrends.present} compact={isMobile} />
        <KpiCard title="Absent Days" value={attendanceStats.absent} icon={<FaCalendarTimes className={isMobile ? "text-2xl" : "text-4xl"} />} color="bg-red-500" total={dailyAttendance.length} trend={calcAttendanceTrends.absent} compact={isMobile} />
        <KpiCard title="Leave Days" value={attendanceStats.leave} icon={<FaHourglassHalf className={isMobile ? "text-2xl" : "text-4xl"} />} color="bg-yellow-500" total={dailyAttendance.length} trend={calcAttendanceTrends.leave} compact={isMobile} />
        <KpiCard title="Attendance %" value={attendancePct} icon={<FaCheckCircle className={isMobile ? "text-2xl" : "text-4xl"} />} color="bg-blue-500" trend={null} compact={isMobile} />
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-6 mb-6">
        <ChartCard title={`Attendance Split (Last ${range} Days)`} heightMobile="h-56" height="h-96" isMobile={isMobile}>
          <ResponsiveContainer>
            <PieChart margin={chartMargin}>
              {isMobile ? null : <Legend />}
              <Tooltip formatter={ttFormatter} />
              <Pie
                data={attendancePie}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={isMobile ? "58%" : "75%"}   // a touch smaller on phones
                label={!isMobile}
              >
                {attendancePie.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Weekly Attendance (MTD)" heightMobile="h-56" height="h-96" isMobile={isMobile}>
          <ResponsiveContainer>
            <BarChart data={monthlyAttendance} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: isMobile ? 10 : 12 }} interval="preserveStartEnd" minTickGap={8} />
              <YAxis allowDecimals={false} tick={{ fontSize: isMobile ? 10 : 12 }} />
              <Tooltip formatter={ttFormatter} />
              {isMobile ? null : <Legend />}
              <Bar dataKey="Present" stackId="a" fill={GREEN} />
              <Bar dataKey="Absent" stackId="a" fill="#F44336" />
              <Bar dataKey="Leave" stackId="a" fill="#FFC107" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={`Daily Attendance (Last ${range} Days)`} heightMobile="h-56" height="h-96" isMobile={isMobile}>
          <ResponsiveContainer>
            <AreaChart data={dailyAttendance} margin={chartMargin}>
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
              <XAxis
                dataKey="date"
                tick={{ fontSize: isMobile ? 9 : 12 }}
                interval="preserveStartEnd"
                minTickGap={10}
              />
              <YAxis allowDecimals={false} tick={{ fontSize: isMobile ? 10 : 12 }} />
              <Tooltip formatter={ttFormatter} />
              {isMobile ? null : <Legend />}
              <Area type="monotone" dataKey="Present" stackId="1" stroke={GREEN} fill="url(#gPresent)" />
              <Area type="monotone" dataKey="Absent" stackId="1" stroke="#F44336" fill="url(#gAbsent)" />
              <Area type="monotone" dataKey="Leave" stackId="1" stroke="#FFC107" fill="url(#gLeave)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-6">
        <ChartCard title="Order Status Distribution" heightMobile="h-56" height="h-96" isMobile={isMobile}>
          <ResponsiveContainer>
            <PieChart margin={chartMargin}>
              {isMobile ? null : <Legend />}
              <Tooltip formatter={ttFormatter} />
              <Pie
                data={orderPieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={isMobile ? "58%" : "75%"}
                label={!isMobile}
              >
                {orderPieData.map((_, i) => (
                  <Cell key={i} fill={ORDER_COLORS[i % ORDER_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Order Trends (This Week)" heightMobile="h-56" height="h-96" isMobile={isMobile}>
          <ResponsiveContainer>
            <LineChart data={orderTrends} margin={chartMargin}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: isMobile ? 10 : 12 }} interval="preserveStartEnd" minTickGap={8} />
              <YAxis allowDecimals={false} tick={{ fontSize: isMobile ? 10 : 12 }} />
              <Tooltip formatter={ttFormatter} />
              {isMobile ? null : <Legend />}
              <Line type="monotone" dataKey="Handled" stroke={BLUE} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Completed" stroke={GREEN} strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Pending" stroke={ORANGE} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>
    </div>
  );
};

export default CheifDashboard;
