import React, { useState, useEffect } from "react";
import {
  checkIn,
  checkOut,
  getTodayAttendance,
  getMonthlyStats,
  getMonthlyChart,
} from "../../services/attendance.service";

const ChiefAttendancePage = () => {
  const today = new Date();

  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());

  const [todayRecord, setTodayRecord] = useState(null);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [monthlyStats, setMonthlyStats] = useState({});

  /* ================= HELPERS ================= */

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getMonthString = () => {
    return `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
  };

  /* ================= LOAD TODAY ================= */

  const loadTodayData = async () => {
    try {
      const res = await getTodayAttendance();

      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        const record = res.data[0];

        setTodayRecord({
          status: record.status?.toLowerCase() || null,
          checkIn: record.checkIn
            ? new Date(record.checkIn).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : null,
          checkOut: record.checkOut
            ? new Date(record.checkOut).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : null,
        });
      } else {
        setTodayRecord(null);
      }
    } catch (err) {
      console.error("Today attendance error:", err);
    }
  };

  /* ================= LOAD MONTH ================= */

  const loadMonthlyData = async () => {
    try {
      const monthString = getMonthString();

      const [chartRes, statsRes] = await Promise.all([
        getMonthlyChart(monthString),
        getMonthlyStats(monthString),
      ]);

      const recordMap = {};

      if (chartRes?.success && Array.isArray(chartRes.data)) {
        chartRes.data.forEach((day) => {
          const key = formatDate(new Date(day.date));

          recordMap[key] = {
            status: day.status?.toLowerCase() || null,
            checkInTime: day.checkIn
              ? new Date(day.checkIn).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : null,
            checkOutTime: day.checkOut
              ? new Date(day.checkOut).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : null,
          };
        });
      }

      setAttendanceRecords(recordMap);
      setMonthlyStats(statsRes?.data || {});
    } catch (err) {
      console.error("Monthly attendance error:", err);
    }
  };

  /* ================= EFFECT ================= */

  useEffect(() => {
    loadTodayData();
    loadMonthlyData();
  }, [selectedMonth, selectedYear]);

  /* ================= CHECK IN / OUT ================= */

  const handleCheckIn = async () => {
    try {
      await checkIn(0, 0);
      await loadTodayData();
      await loadMonthlyData();
    } catch (err) {
      console.error("Check-in error:", err);
    }
  };

  const handleCheckOut = async () => {
    try {
      await checkOut();
      await loadTodayData();
      await loadMonthlyData();
    } catch (err) {
      console.error("Check-out error:", err);
    }
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

        {/* TODAY SECTION */}
        <div className="bg-white p-6 rounded-xl shadow space-y-2">
          <h3 className="text-xl font-semibold">
            Today ({today.toDateString()})
          </h3>

          <p>Status: {todayRecord?.status || "Not Marked"}</p>
          <p>Check-In: {todayRecord?.checkIn || "--"}</p>
          <p>Check-Out: {todayRecord?.checkOut || "--"}</p>

          <div className="flex gap-3 mt-3">
            <button
              onClick={handleCheckIn}
              disabled={!!todayRecord?.checkIn}
              className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Check In
            </button>

            <button
              onClick={handleCheckOut}
              disabled={!todayRecord?.checkIn || !!todayRecord?.checkOut}
              className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Check Out
            </button>
          </div>
        </div>

        {/* FILTER SECTION */}
        <div className="flex gap-4">
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

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Check-In</th>
                  <th className="px-4 py-3">Check-Out</th>
                </tr>
              </thead>

              <tbody>
                {Object.keys(attendanceRecords).length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-6 text-gray-500">
                      No records found
                    </td>
                  </tr>
                ) : (
                  Object.keys(attendanceRecords)
                    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
                    .map((dateKey) => {
                      const record = attendanceRecords[dateKey];

                      return (
                        <tr key={dateKey} className="border-b">
                          <td className="px-4 py-3">
                            {new Date(dateKey).toDateString()}
                          </td>
                          <td className="px-4 py-3 capitalize">
                            {record?.status}
                          </td>
                          <td className="px-4 py-3">
                            {record?.checkInTime || "--"}
                          </td>
                          <td className="px-4 py-3">
                            {record?.checkOutTime || "--"}
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ChiefAttendancePage;
