import React, { useState, useEffect } from "react";
import {
  checkIn,
  checkOut,
  getTodayAttendance,
  getMonthlyStats,
  getMonthlyChart,
  exportAttendanceExcel,
} from "../../services/attendance.service";

const ManagerAttendancePage = () => {
  const today = new Date();

  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const [todayRecord, setTodayRecord] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [monthlyStats, setMonthlyStats] = useState({});
  const [loading, setLoading] = useState(false);

  /* ================= HELPERS ================= */

  const formatDate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const getMonthString = () =>
    `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;

  /* ================= LOAD TODAY (OWN ONLY) ================= */

  const loadTodayData = async () => {
    try {
      const res = await getTodayAttendance("own");

      if (res?.success && res.data.length > 0) {
        const record = res.data[0];

        setTodayRecord({
          checkIn: record.checkIn || null,
          checkOut: record.checkOut || null,
        });
      } else {
        setTodayRecord(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= LOAD MONTH (OWN ONLY) ================= */

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
          const key = formatDate(new Date(item.date));

          map[key] = {
            status: item.status,
            checkIn: item.checkIn,
            checkOut: item.checkOut,
          };
        });
      }

      setAttendanceRecords(map);
      setMonthlyStats(statsRes || {});
    } catch (err) {
      console.error(err);
    }
  };

  /* ================= AUTO REFRESH ================= */

  useEffect(() => {
    loadTodayData();
    loadMonthlyData();

    const interval = setInterval(() => {
      loadTodayData();
      loadMonthlyData();
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedMonth, selectedYear]);

  /* ================= CHECK IN ================= */

  const handleCheckIn = async () => {
    try {
      setLoading(true);
      await checkIn(0, 0);
      await loadTodayData();
      await loadMonthlyData();
    } catch (err) {
      alert(err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= CHECK OUT ================= */

  const handleCheckOut = async () => {
    try {
      setLoading(true);
      await checkOut();
      await loadTodayData();
      await loadMonthlyData();
    } catch (err) {
      alert(err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= EXPORT ================= */

  const handleExport = async () => {
    const month = selectedMonth + 1;

    const startDate = `${selectedYear}-${String(month).padStart(2, "0")}-01`;

    const lastDay = new Date(
      selectedYear,
      selectedMonth + 1,
      0
    ).getDate();

    const endDate = `${selectedYear}-${String(month).padStart(
      2,
      "0"
    )}-${String(lastDay).padStart(2, "0")}`;

    await exportAttendanceExcel(startDate, endDate);
  };

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  const years = [];
  for (let i = 0; i < 5; i++) {
    years.push(today.getFullYear() - i);
  }

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="max-w-6xl mx-auto space-y-6">

        <h2 className="text-3xl font-bold">My Attendance</h2>

        {/* TODAY CARD */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-xl font-semibold mb-2">
            Today ({today.toDateString()})
          </h3>

          <p>
            Check-In:{" "}
            {todayRecord?.checkIn
              ? new Date(todayRecord.checkIn).toLocaleTimeString()
              : "--"}
          </p>

          <p>
            Check-Out:{" "}
            {todayRecord?.checkOut
              ? new Date(todayRecord.checkOut).toLocaleTimeString()
              : "--"}
          </p>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleCheckIn}
              disabled={loading || todayRecord?.checkIn}
              className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Check In
            </button>

            <button
              onClick={handleCheckOut}
              disabled={
                loading ||
                !todayRecord?.checkIn ||
                todayRecord?.checkOut
              }
              className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Check Out
            </button>
          </div>
        </div>

        {/* FILTER + EXPORT */}
        <div className="flex gap-4 items-center">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="p-2 border rounded"
          >
            {months.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="p-2 border rounded"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <button
            onClick={handleExport}
            className="bg-purple-600 text-white px-4 py-2 rounded"
          >
            Export
          </button>
        </div>

        {/* MONTHLY SUMMARY */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl shadow text-center">
            <p>Total Days</p>
            <p className="font-bold text-xl">
              {monthlyStats.totalDays || 0}
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl shadow text-center">
            <p>Present</p>
            <p className="font-bold text-xl">
              {monthlyStats.totalPresent || 0}
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl shadow text-center">
            <p>Attendance %</p>
            <p className="font-bold text-xl">
              {monthlyStats.attendancePercent || 0}%
            </p>
          </div>
        </div>

        {/* MONTHLY LIST */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-xl font-semibold mb-4">
            Monthly Attendance List
          </h3>

          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Check-In</th>
                <th className="px-4 py-2">Check-Out</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(attendanceRecords).length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-4">
                    No records
                  </td>
                </tr>
              ) : (
                Object.keys(attendanceRecords)
                  .sort((a, b) => new Date(b) - new Date(a))
                  .map((key) => (
                    <tr key={key} className="border-b">
                      <td className="px-4 py-2">
                        {new Date(key).toDateString()}
                      </td>
                      <td className="px-4 py-2">
                        {attendanceRecords[key].checkIn
                          ? new Date(attendanceRecords[key].checkIn).toLocaleTimeString()
                          : "--"}
                      </td>
                      <td className="px-4 py-2">
                        {attendanceRecords[key].checkOut
                          ? new Date(attendanceRecords[key].checkOut).toLocaleTimeString()
                          : "--"}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default ManagerAttendancePage;
