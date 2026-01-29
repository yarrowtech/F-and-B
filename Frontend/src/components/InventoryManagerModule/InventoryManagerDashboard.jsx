import React, { useMemo, useState, useEffect } from "react";
import {
  FaCalendarCheck,
  FaCalendarTimes,
  FaUtensils,
  FaHourglassHalf,
  FaCheckCircle,
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
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#A28EFF", "#FF6699"];

const STOCK_COLORS = {
  InStock: "#28a745",
  LowStock: "#ffc107",
  OutOfStock: "#dc3545",
};

const ATTENDANCE_STATUS_COLORS = {
  Present: "#28a745",
  Absent: "#dc3545",
  Leave: "#ffc107",
};

/* ---------- Helpers ---------- */
const pretty = (k) => k.replace(/([A-Z])/g, " $1").trim();
const ttFormatter = (value, name) => [value, pretty(name)];

const pctChange = (current, previous) => {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / previous) * 100;
};

/* ---------- KPI Card ---------- */
const KpiCard = ({ title, value, denom, icon: Icon, bgColor, trend }) => (
  <div className="p-5 rounded-2xl shadow-md bg-white dark:bg-gray-800 flex items-center">
    {/* Colored circular icon */}
    <div
      className={`w-12 h-12 flex items-center justify-center rounded-full ${bgColor} text-white text-2xl mr-4 shrink-0`}
    >
      <Icon />
    </div>

    <div>
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</h3>
      <p className="text-2xl font-extrabold text-gray-900 dark:text-white leading-7">
        {denom != null ? (
          <>
            {value} <span className="text-gray-500 dark:text-gray-400 font-bold">/ {denom}</span>
          </>
        ) : (
          value
        )}
      </p>
      {typeof trend === "number" && (
        <p
          className={`text-sm font-medium ${
            trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-gray-500"
          }`}
        >
          {trend > 0 ? "↑" : trend < 0 ? "↓" : "→"} {Math.abs(trend).toFixed(0)}% from last period
        </p>
      )}
    </div>
  </div>
);

const ChartCard = ({ title, children, height = "h-96" }) => (
  <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md">
    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">{title}</h3>
    <div className={`w-full ${height}`}>{children}</div>
  </div>
);

/* ---------- Component ---------- */
const InventoryManagerDashboard = ({ inventoryData }) => {
  const [data, setData] = useState([]);
  const [range, setRange] = useState(7); // 7 | 14 | 30

  // seed demo data if none provided
  useEffect(() => {
    if (inventoryData && Array.isArray(inventoryData)) {
      setData(inventoryData);
    } else {
      setData([
        { id: 1, name: "Tomatoes", stockStatus: "InStock" },
        { id: 2, name: "Cheese", stockStatus: "LowStock" },
        { id: 3, name: "Olive Oil", stockStatus: "InStock" },
        { id: 4, name: "Basil", stockStatus: "OutOfStock" },
        { id: 5, name: "Flour", stockStatus: "InStock" },
        { id: 6, name: "Yeast", stockStatus: "LowStock" },
      ]);
    }
  }, [inventoryData]);

  /* ---------- Inventory metrics ---------- */
  const totalItems = useMemo(() => data.length, [data]);
  const inStockItems = useMemo(
    () => data.filter((item) => item.stockStatus === "InStock").length,
    [data]
  );
  const lowStockItems = useMemo(
    () => data.filter((item) => item.stockStatus === "LowStock").length,
    [data]
  );
  const outOfStockItems = useMemo(
    () => data.filter((item) => item.stockStatus === "OutOfStock").length,
    [data]
  );

  const stockStatusData = useMemo(() => {
    const statusCounts = { InStock: 0, LowStock: 0, OutOfStock: 0 };
    data.forEach((item) => {
      if (statusCounts[item.stockStatus] != null) statusCounts[item.stockStatus] += 1;
    });
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
    }));
  }, [data]);

  /* ---------- Charts: Monthly usage & Attendance (demo) ---------- */
  const monthlyUsageData = useMemo(() => {
    let seed = 42;
    const rnd = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return months.map((m) => ({ month: m, usage: Math.floor(rnd() * 100) + 10 }));
  }, []);

  const monthlyAttendanceData = useMemo(() => {
    let seed = 123;
    const rnd = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return months.map((m) => ({ month: m, attendance: Math.floor(rnd() * 1000) + 200 }));
  }, []);

  const weeklyAttendance = useMemo(
    () => [
      { name: "Week 1", present: 5, absent: 2, leave: 0 },
      { name: "Week 2", present: 6, absent: 1, leave: 0 },
      { name: "Week 3", present: 4, absent: 3, leave: 0 },
      { name: "Week 4", present: 5, absent: 2, leave: 0 },
    ],
    []
  );

  /* ---------- Daily attendance generator (60 days) ---------- */
  const dailyAttendance60 = useMemo(() => {
    let seed = 9876;
    const random = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };
    const PROB_PRESENT = 0.75;
    const PROB_ABSENT = 0.15;

    // Newest at the end (index 59 = today)
    return Array.from({ length: 60 }, (_, i) => {
      const r = random();
      const status = r < PROB_PRESENT ? "Present" : r < PROB_PRESENT + PROB_ABSENT ? "Absent" : "Leave";
      return { dayIndex: i, status };
    });
  }, []);

  /* ---------- Range-based stats ---------- */
  const getCounts = (arr) => {
    const c = { Present: 0, Absent: 0, Leave: 0 };
    arr.forEach((d) => (c[d.status] += 1));
    return c;
  };

  // Slice for current period (last N) and previous period (N before that)
  const currentSlice = useMemo(
    () => dailyAttendance60.slice(60 - range, 60),
    [dailyAttendance60, range]
  );
  const previousSlice = useMemo(
    () => dailyAttendance60.slice(60 - 2 * range, 60 - range),
    [dailyAttendance60, range]
  );

  const currentCounts = useMemo(() => getCounts(currentSlice), [currentSlice]);
  const previousCounts = useMemo(() => getCounts(previousSlice), [previousSlice]);

  const currentTotal = useMemo(
    () => currentCounts.Present + currentCounts.Absent + currentCounts.Leave,
    [currentCounts]
  );
  const previousTotal = useMemo(
    () => previousCounts.Present + previousCounts.Absent + previousCounts.Leave,
    [previousCounts]
  );

  const attendancePctCurrent = useMemo(
    () => (currentTotal ? (currentCounts.Present / currentTotal) * 100 : 0),
    [currentCounts, currentTotal]
  );
  const attendancePctPrev = useMemo(
    () => (previousTotal ? (previousCounts.Present / previousTotal) * 100 : 0),
    [previousCounts, previousTotal]
  );

  const trendPresent = useMemo(
    () => pctChange(currentCounts.Present, previousCounts.Present),
    [currentCounts, previousCounts]
  );
  const trendAbsent = useMemo(
    () => pctChange(currentCounts.Absent, previousCounts.Absent),
    [currentCounts, previousCounts]
  );
  const trendLeave = useMemo(
    () => pctChange(currentCounts.Leave, previousCounts.Leave),
    [currentCounts, previousCounts]
  );
  const trendAttendancePct = useMemo(
    () => pctChange(attendancePctCurrent, attendancePctPrev),
    [attendancePctCurrent, attendancePctPrev]
  );

  const dailyAttendanceData = useMemo(
    () =>
      Object.entries(currentCounts).map(([status, count]) => ({
        name: status,
        value: count,
      })),
    [currentCounts]
  );

  /* ---------- Example usage % (unrelated to range) ---------- */
  const usagePct = useMemo(() => {
    const aug = monthlyUsageData[7]?.usage ?? 0;
    const jul = monthlyUsageData[6]?.usage ?? 0;
    return pctChange(aug, jul);
  }, [monthlyUsageData]);

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Header with Date Range selector */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">
          Inventory Manager Dashboard
        </h1>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Date range:
          </label>
          <div className="relative">
            <select
              value={range}
              onChange={(e) => setRange(parseInt(e.target.value, 10))}
              className="appearance-none pl-4 pr-9 py-2 rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              ▾
            </span>
          </div>
        </div>
      </div>

      {/* Inventory KPI Cards (white with colored icon badges) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard title="Total Items" value={totalItems} icon={FaUtensils} bgColor="bg-blue-500" />
        <KpiCard title="In Stock" value={inStockItems} icon={FaCheckCircle} bgColor="bg-green-500" />
        <KpiCard title="Low Stock" value={lowStockItems} icon={FaExclamationTriangle} bgColor="bg-yellow-500" />
        <KpiCard title="Out of Stock" value={outOfStockItems} icon={FaCalendarTimes} bgColor="bg-red-500" />
      </div>

      {/* Attendance KPI Cards (range-aware, screenshot style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KpiCard
          title="Present Days"
          value={currentCounts.Present}
          denom={range}
          icon={FaCalendarCheck}
          bgColor="bg-green-500"
          trend={trendPresent}
        />
        <KpiCard
          title="Absent Days"
          value={currentCounts.Absent}
          denom={range}
          icon={FaCalendarTimes}
          bgColor="bg-red-500"
          trend={trendAbsent}
        />
        <KpiCard
          title="Leave Days"
          value={currentCounts.Leave}
          denom={range}
          icon={FaHourglassHalf}
          bgColor="bg-yellow-500"
          trend={trendLeave}
        />
        <KpiCard
          title="Attendance %"
          value={`${attendancePctCurrent.toFixed(1)}%`}
          icon={FaCheckCircle}
          bgColor="bg-blue-500"
          trend={trendAttendancePct}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <ChartCard title="Stock Status Distribution" height="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stockStatusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                label
              >
                {stockStatusData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      STOCK_COLORS[entry.name] || COLORS[index % COLORS.length]
                    }
                  />
                ))}
              </Pie>
              <Tooltip formatter={ttFormatter} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Inventory Usage" height="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyUsageData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={ttFormatter} />
              <Bar dataKey="usage" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Attendance" height="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyAttendanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip formatter={ttFormatter} />
              <Area type="monotone" dataKey="attendance" stroke="#8884d8" fillOpacity={1} fill="url(#colorAttendance)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ChartCard title={`Daily Attendance (Last ${range} Days)`} height="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dailyAttendanceData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                label
              >
                {dailyAttendanceData.map((entry, index) => (
                  <Cell
                    key={`cell-daily-${index}`}
                    fill={ATTENDANCE_STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={ttFormatter} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Weekly Attendance Overview" height="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyAttendance} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={ttFormatter} />
              <Legend />
              <Line type="monotone" dataKey="present" stroke={ATTENDANCE_STATUS_COLORS.Present} activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="absent" stroke={ATTENDANCE_STATUS_COLORS.Absent} />
              <Line type="monotone" dataKey="leave" stroke={ATTENDANCE_STATUS_COLORS.Leave} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};

export default InventoryManagerDashboard;
