import { useState, useEffect } from "react";
import {
  checkIn,
  checkOut,
  getTodayAttendance,
  getMonthlyStats,
  getMonthlyChart,
  exportAttendanceExcel,
} from "../../services/attendance.service";

const STATUS_STYLE = {
  PRESENT: "bg-emerald-100 text-emerald-700",
  ABSENT:  "bg-red-100 text-red-600",
  LEAVE:   "bg-amber-100 text-amber-700",
};

const InventoryManagerAttendancePage = () => {
  const today = new Date();

  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear,  setSelectedYear]  = useState(today.getFullYear());

  const [todayRecord,       setTodayRecord]       = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [monthlyStats,      setMonthlyStats]      = useState({});
  const [loading,           setLoading]           = useState(false);

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const getMonthString = () =>
    `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;

  const loadTodayData = async () => {
    try {
      const res = await getTodayAttendance("own");
      if (res?.success && res.data.length > 0) {
        const r = res.data[0];
        setTodayRecord({ checkIn: r.checkIn || null, checkOut: r.checkOut || null });
      } else {
        setTodayRecord(null);
      }
    } catch (err) { console.error(err); }
  };

  const loadMonthlyData = async () => {
    try {
      const monthString = getMonthString();
      const [chartRes, statsRes] = await Promise.all([
        getMonthlyChart(monthString, "own"),
        getMonthlyStats(monthString, "own"),
      ]);

      const map = {};
      if (chartRes?.success) {
        chartRes.data.forEach((item) => {
          const rawDate =
            typeof item.date === "string" && item.date.length === 10
              ? item.date + "T00:00:00"
              : item.date;
          const key = formatDate(new Date(rawDate));
          map[key] = { status: item.status, checkIn: item.checkIn, checkOut: item.checkOut };
        });
      }

      setAttendanceRecords(map);
      setMonthlyStats(statsRes || {});
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    loadTodayData();
    loadMonthlyData();
    const interval = setInterval(() => {
      loadTodayData();
      loadMonthlyData();
    }, 30000);
    return () => clearInterval(interval);
  }, [selectedMonth, selectedYear]);

  const handleCheckIn = async () => {
    try {
      setLoading(true);
      await checkIn(0, 0);
      await loadTodayData();
      await loadMonthlyData();
    } catch (err) { alert(err); }
    finally { setLoading(false); }
  };

  const handleCheckOut = async () => {
    try {
      setLoading(true);
      await checkOut();
      await loadTodayData();
      await loadMonthlyData();
    } catch (err) { alert(err); }
    finally { setLoading(false); }
  };

  const handleExport = async () => {
    const month     = selectedMonth + 1;
    const startDate = `${selectedYear}-${String(month).padStart(2, "0")}-01`;
    const lastDay   = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const endDate   = `${selectedYear}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    await exportAttendanceExcel(startDate, endDate);
  };

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];
  const years = [];
  for (let i = 0; i < 5; i++) years.push(today.getFullYear() - i);

  const sortedKeys = Object.keys(attendanceRecords).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-100 to-blue-50 dark:from-gray-900 dark:to-gray-800 space-y-6">

      <div>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white">My Attendance</h2>
        <p className="text-base text-gray-500 dark:text-gray-400 mt-1">Track your check-ins and monthly record</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-6 border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4">
          Today — <span className="text-violet-600 dark:text-violet-400">{today.toDateString()}</span>
        </h3>

        <div className="flex flex-wrap gap-6 mb-5">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Check-In</span>
            <span className="text-2xl font-bold text-gray-800 dark:text-white">
              {todayRecord?.checkIn
                ? new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "--:--"}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Check-Out</span>
            <span className="text-2xl font-bold text-gray-800 dark:text-white">
              {todayRecord?.checkOut
                ? new Date(todayRecord.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "--:--"}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCheckIn}
            disabled={loading || !!todayRecord?.checkIn}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white text-base font-semibold rounded-xl transition-colors shadow-sm"
          >
            Check In
          </button>
          <button
            onClick={handleCheckOut}
            disabled={loading || !todayRecord?.checkIn || !!todayRecord?.checkOut}
            className="px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white text-base font-semibold rounded-xl transition-colors shadow-sm"
          >
            Check Out
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-5 border border-gray-100 dark:border-gray-700 flex flex-wrap gap-3 items-center">
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>

        <button
          onClick={handleExport}
          className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-base font-semibold rounded-xl transition-colors shadow-sm"
        >
          Export Excel
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg">
          <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
          <p className="text-sm font-medium text-violet-100 mb-1">Total Days</p>
          <p className="text-4xl font-extrabold">{monthlyStats.totalDays || 0}</p>
        </div>
        <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
          <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
          <p className="text-sm font-medium text-emerald-100 mb-1">Days Present</p>
          <p className="text-4xl font-extrabold">{monthlyStats.totalPresent || 0}</p>
        </div>
        <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
          <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
          <p className="text-sm font-medium text-amber-100 mb-1">Attendance %</p>
          <p className="text-4xl font-extrabold">{monthlyStats.attendancePercent || 0}%</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
            Monthly Attendance — {months[selectedMonth]} {selectedYear}
          </h3>
        </div>

        {sortedKeys.length === 0 ? (
          <p className="text-center text-gray-400 dark:text-gray-500 py-12 text-base">
            No attendance records for this month.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  <th className="px-6 py-3 text-left font-semibold">#</th>
                  <th className="px-6 py-3 text-left font-semibold">Date</th>
                  <th className="px-6 py-3 text-left font-semibold">Day</th>
                  <th className="px-6 py-3 text-left font-semibold">Status</th>
                  <th className="px-6 py-3 text-left font-semibold">Check-In</th>
                  <th className="px-6 py-3 text-left font-semibold">Check-Out</th>
                  <th className="px-6 py-3 text-left font-semibold">Work Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {sortedKeys.map((key, idx) => {
                  const rec  = attendanceRecords[key];
                  const d    = new Date(key + "T00:00:00");
                  const dayName = d.toLocaleDateString("en-IN", { weekday: "short" });
                  const dateStr = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

                  const checkInTime  = rec.checkIn  ? new Date(rec.checkIn)  : null;
                  const checkOutTime = rec.checkOut ? new Date(rec.checkOut) : null;

                  let workHours = "--";
                  if (checkInTime && checkOutTime) {
                    const diff = (checkOutTime - checkInTime) / (1000 * 60 * 60);
                    workHours  = diff.toFixed(1) + " hrs";
                  }

                  const statusClass = STATUS_STYLE[rec.status] || "bg-gray-100 text-gray-600";

                  return (
                    <tr key={key} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-400 dark:text-gray-500">{idx + 1}</td>
                      <td className="px-6 py-4 text-base font-semibold text-gray-800 dark:text-white">{dateStr}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{dayName}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusClass}`}>
                          {rec.status || "PRESENT"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-base text-gray-700 dark:text-gray-300">
                        {checkInTime ? checkInTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--"}
                      </td>
                      <td className="px-6 py-4 text-base text-gray-700 dark:text-gray-300">
                        {checkOutTime ? checkOutTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--"}
                      </td>
                      <td className="px-6 py-4 text-base font-medium text-violet-600 dark:text-violet-400">
                        {workHours}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default InventoryManagerAttendancePage;
