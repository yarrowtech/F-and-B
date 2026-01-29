import React, { useMemo, useState, useEffect } from "react";
import {
  FaCalendarCheck,
  FaCalendarTimes,
  FaHourglassHalf,
  FaCheckCircle,
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
  CartesianGrid,
  XAxis,
  YAxis,
  Legend,
  AreaChart,
  Area,
} from "recharts";

/* ---------- Colors ---------- */
const COLORS = ["#4CAF50", "#F44336", "#FFC107", "#2196F3", "#FF5722"];

/* ---------- Helpers ---------- */
const pretty = (k) => k.replace(/([A-Z])/g, " $1").trim();
const ttFormatter = (value, name) => [value, pretty(name)];
const percentChange = (first, second) => {
  if (first === 0 && second === 0) return 0;
  if (first === 0) return 100;
  return Math.round(((second - first) / first) * 100);
};

/* ---------- KPI Card ---------- */
const KpiCard = ({ title, value, icon, color, total, trend }) => (
  <div className="p-5 h-36 bg-gradient-to-br from-gray-50 dark:from-gray-800 to-gray-100 dark:to-gray-700 rounded-2xl shadow-lg dark:shadow-gray-800 flex items-center gap-5 transform hover:scale-105 transition-transform duration-300">
    <div className={`p-4 rounded-full bg-opacity-20 ${color} text-white`}>
      {icon}
    </div>
    <div className="flex-1">
      <p className="text-sm text-gray-500 dark:text-gray-300">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {value}
        {total ? ` / ${total}` : ""}
      </p>
      {trend !== undefined && trend !== null && (
        <p
          className={`text-xs mt-1 ${
            trend > 0
              ? "text-green-500"
              : trend < 0
              ? "text-red-500"
              : "text-gray-500"
          } flex items-center gap-1`}
        >
          {trend > 0 ? <FaArrowUp /> : trend < 0 ? <FaArrowDown /> : <FaMinus />}
          {trend !== 0 ? `${Math.abs(trend)}%` : "No change"} from last period
        </p>
      )}
    </div>
  </div>
);

/* ---------- Main Dashboard ---------- */
const CleanerDashboard = () => {
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

  /* ---------- Mock Attendance ---------- */
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
        date: new Date(
          Date.now() - (30 - i) * 24 * 60 * 60 * 1000
        ).toLocaleDateString("en-US", {
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

  /* ---------- Mock Cleaning Data ---------- */
  const dailyCleaning30 = useMemo(() => {
    let seed = 54321;
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    return Array.from({ length: 30 }, (_, i) => {
      const tablesTotal = 20;
      const floorsTotal = 5;

      const tableCleaned = Math.floor(random() * tablesTotal);
      const tableAccepted = Math.min(tableCleaned, Math.floor(random() * tableCleaned + 1));
      const floorCleaned = Math.floor(random() * floorsTotal);
      const floorAccepted = Math.min(floorCleaned, Math.floor(random() * floorCleaned + 1));

      return {
        day: `D-${30 - i}`,
        date: new Date(
          Date.now() - (30 - i) * 24 * 60 * 60 * 1000
        ).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        tableCleaned,
        tableAccepted,
        tablePending: tablesTotal - tableAccepted,
        floorCleaned,
        floorAccepted,
        floorPending: floorsTotal - floorAccepted,
      };
    });
  }, []);

  const dailyCleaning = useMemo(() => {
    const len = Math.min(range, dailyCleaning30.length);
    return dailyCleaning30.slice(dailyCleaning30.length - len);
  }, [range, dailyCleaning30]);

  const cleaningStats = useMemo(() => {
    return dailyCleaning.reduce(
      (acc, d) => {
        acc.tableCleaned += d.tableCleaned;
        acc.tableAccepted += d.tableAccepted;
        acc.tablePending += d.tablePending;
        acc.floorCleaned += d.floorCleaned;
        acc.floorAccepted += d.floorAccepted;
        acc.floorPending += d.floorPending;
        return acc;
      },
      {
        tableCleaned: 0,
        tablePending: 0,
        floorCleaned: 0,
        floorPending: 0,
        tableAccepted: 0,
        floorAccepted: 0,
      }
    );
  }, [dailyCleaning]);

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Cleaner Dashboard
        </h1>
        <div className="flex items-center gap-2">
          <label htmlFor="range" className="text-sm text-gray-600 dark:text-gray-300">
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

      {/* Attendance KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
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
      </section>

      {/* Cleaning KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <KpiCard title="Table Cleaned" value={cleaningStats.tableCleaned} icon={<FaCheckCircle className="text-4xl" />} color="bg-green-500" />
        <KpiCard title="Table Pending" value={cleaningStats.tablePending} icon={<FaHourglassHalf className="text-4xl" />} color="bg-yellow-500" />
        <KpiCard title="Floor Cleaned" value={cleaningStats.floorCleaned} icon={<FaCheckCircle className="text-4xl" />} color="bg-green-500" />
        <KpiCard title="Floor Pending" value={cleaningStats.floorPending} icon={<FaHourglassHalf className="text-4xl" />} color="bg-yellow-500" />
      </section>

      {/* Accepted Cleaning KPI Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <KpiCard title="Table Cleaned (Accepted)" value={cleaningStats.tableAccepted} icon={<FaCheckCircle className="text-4xl" />} color="bg-green-500" />
        <KpiCard title="Floor Cleaned (Accepted)" value={cleaningStats.floorAccepted} icon={<FaCheckCircle className="text-4xl" />} color="bg-green-500" />
      </section>

      {/* Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Pie */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg dark:shadow-gray-800">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Attendance Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
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
                outerRadius={100}
                label
              >
                <Cell fill="#4CAF50" />
                <Cell fill="#F44336" />
                <Cell fill="#FFC107" />
              </Pie>
              <Tooltip formatter={ttFormatter} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Attendance Daily Area */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg dark:shadow-gray-800">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Attendance (Daily)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyAttendance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={ttFormatter} />
              <Legend />
              <Area type="monotone" dataKey="Present" stackId="1" stroke="#4CAF50" fill="#4CAF50" fillOpacity={0.3} />
              <Area type="monotone" dataKey="Absent" stackId="1" stroke="#F44336" fill="#F44336" fillOpacity={0.3} />
              <Area type="monotone" dataKey="Leave" stackId="1" stroke="#FFC107" fill="#FFC107" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Table Cleaning Pie */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg dark:shadow-gray-800">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Table Cleaning Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: "Table Accepted", value: cleaningStats.tableAccepted },
                  { name: "Table Pending", value: cleaningStats.tablePending },
                ]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                <Cell fill="#4CAF50" />
                <Cell fill="#FFC107" />
              </Pie>
              <Tooltip formatter={ttFormatter} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Floor Cleaning Pie */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg dark:shadow-gray-800">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Floor Cleaning Distribution
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: "Floor Accepted", value: cleaningStats.floorAccepted },
                  { name: "Floor Pending", value: cleaningStats.floorPending },
                ]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                <Cell fill="#2196F3" />
                <Cell fill="#FF5722" />
              </Pie>
              <Tooltip formatter={ttFormatter} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Cleaning Area */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg dark:shadow-gray-800 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Table vs Floor Cleaning (Daily)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dailyCleaning}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={ttFormatter} />
              <Legend />
              <Area type="monotone" dataKey="tableAccepted" stackId="1" stroke="#4CAF50" fill="#4CAF50" fillOpacity={0.3} />
              <Area type="monotone" dataKey="tablePending" stackId="1" stroke="#FFC107" fill="#FFC107" fillOpacity={0.3} />
              <Area type="monotone" dataKey="floorAccepted" stackId="1" stroke="#2196F3" fill="#2196F3" fillOpacity={0.3} />
              <Area type="monotone" dataKey="floorPending" stackId="1" stroke="#FF5722" fill="#FF5722" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
};

export default CleanerDashboard;
