import React, { useState, useEffect, useRef } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const ManagerAttendancePage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, date: null });
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [leaveReason, setLeaveReason] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const contextMenuRef = useRef(null);
  const managerName = localStorage.getItem("ManagerName") || "Manager";

  // Load saved records
  useEffect(() => {
    const saved = localStorage.getItem("manager-attendance");
    if (saved) setAttendanceRecords(JSON.parse(saved));
  }, []);

  // Save records on change
  useEffect(() => {
    localStorage.setItem("manager-attendance", JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  // Close context menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        contextMenu.visible &&
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target)
      ) {
        setContextMenu({ ...contextMenu, visible: false });
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [contextMenu]);

  const formatDate = (date) => date.toISOString().split("T")[0];
  const getCurrentTime = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const handleDateClick = (date, event) => {
    if (date < new Date().setHours(0, 0, 0, 0)) return; // prevent past
    event.stopPropagation();
    setSelectedDate(date);
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      date,
    });
  };

  const handleOptionSelect = (option) => {
    const dateKey = formatDate(contextMenu.date);
    const time = getCurrentTime();

    if (option === "request-leave") {
      setShowLeaveDialog(true);
      return;
    }

    if (!isToday(contextMenu.date) && (option === "check-in" || option === "check-out")) {
      alert("✅ Check-in/Check-out only allowed for today's date.");
      return;
    }

    setAttendanceRecords((prev) => {
      const existing = prev[dateKey] || {};
      const updated = { ...prev };

      if (
        ["absent", "leave"].includes(existing.status) &&
        (option === "check-in" || option === "check-out")
      ) {
        alert("❗ Cannot mark check-in/out on a day marked absent or leave.");
        return prev;
      }

      switch (option) {
        case "check-in":
          if (existing.checkIn) {
            alert("🔁 Already checked in.");
            return prev;
          }
          updated[dateKey] = { ...existing, checkIn: time, status: "check-in" };
          alert(`✅ Checked in on ${contextMenu.date.toDateString()} at ${time}`);
          break;

        case "check-out":
          if (existing.checkOut) {
            alert("🔁 Already checked out.");
            return prev;
          }
          updated[dateKey] = { ...existing, checkOut: time, status: "check-out" };
          alert(`⏱️ Checked out on ${contextMenu.date.toDateString()} at ${time}`);
          break;

        case "absent":
          updated[dateKey] = { status: "absent" };
          alert(`❌ Marked absent on ${contextMenu.date.toDateString()}`);
          break;

        case "clear":
          delete updated[dateKey];
          alert(`🗑️ Cleared record for ${contextMenu.date.toDateString()}`);
          break;

        default:
          break;
      }

      setContextMenu({ ...contextMenu, visible: false });
      return updated;
    });
  };

  const submitLeaveRequest = () => {
    const dateKey = formatDate(contextMenu.date);
    setAttendanceRecords((prev) => ({
      ...prev,
      [dateKey]: { status: "leave", reason: leaveReason },
    }));
    alert(`📝 Leave requested for ${contextMenu.date.toDateString()}\n${leaveReason}`);
    setLeaveReason("");
    setShowLeaveDialog(false);
    setContextMenu({ visible: false, x: 0, y: 0, date: null });
  };

  // Monthly summary
  const monthlySummary = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const summary = { present: 0, absent: 0, leave: 0 };
    for (const date in attendanceRecords) {
      if (date.startsWith(currentMonth)) {
        const status = attendanceRecords[date].status;
        if (status === "check-in" || status === "check-out") summary.present++;
        if (status === "absent") summary.absent++;
        if (status === "leave") summary.leave++;
      }
    }
    return summary;
  };

  // Attendance summary (Today, Monthly, Yearly, Total Leave, Leave Requests)
  const attendanceSummary = () => {
    const todayKey = formatDate(new Date());
    const todayStatus = attendanceRecords[todayKey]?.status || "not-marked";

    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const currentYear = now.getFullYear();

    let monthlyPresent = 0;
    let yearlyPresent = 0;
    let totalLeave = 0;
    let leaveRequests = 0;

    Object.entries(attendanceRecords).forEach(([date, record]) => {
      const recordDate = new Date(date);
      const status = record.status;

      if (status === "leave") {
        totalLeave++;
        leaveRequests++;
      }

      if (status === "check-in" || status === "check-out") {
        if (date.startsWith(currentMonth)) monthlyPresent++;
        if (recordDate.getFullYear() === currentYear) yearlyPresent++;
      }
    });

    return {
      todayStatus,
      monthlyPresent,
      yearlyPresent,
      totalLeave,
      leaveRequests,
    };
  };

  const summary = monthlySummary();
  const summaryData = attendanceSummary();
  const selectedDateKey = formatDate(selectedDate);
  const dayData = attendanceRecords[selectedDateKey] || {};

  const statusClass = (status) => {
    switch (status) {
      case "check-in":
        return "bg-green-100 text-green-800";
      case "check-out":
        return "bg-blue-100 text-blue-800";
      case "absent":
        return "bg-red-100 text-red-800";
      case "leave":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Page Title */}
        <h2 className="text-3xl font-bold mb-4">{managerName}'s Attendance</h2>

        {/* Attendance Summary Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">📅 Today</p>
            <p className="font-bold text-lg">
              {summaryData.todayStatus === "check-in" || summaryData.todayStatus === "check-out"
                ? "✅ Present"
                : summaryData.todayStatus === "absent"
                ? "❌ Absent"
                : summaryData.todayStatus === "leave"
                ? "📝 Leave"
                : "⏺ Not marked"}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">📊 Monthly Attendance</p>
            <p className="font-bold text-lg">{summaryData.monthlyPresent} Days</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">📆 Yearly Attendance</p>
            <p className="font-bold text-lg">{summaryData.yearlyPresent} Days</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">📝 Total Leaves</p>
            <p className="font-bold text-lg">{summaryData.totalLeave}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">📨 Leave Requests</p>
            <p className="font-bold text-lg">{summaryData.leaveRequests}</p>
          </div>
        </div>

        {/* Main Grid: Calendar + Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Calendar */}
          <div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
              <Calendar
                value={selectedDate}
                minDate={new Date()}
                onChange={setSelectedDate}
                tileContent={({ date }) => (
                  <div className="absolute inset-0" onClick={(e) => handleDateClick(date, e)} />
                )}
                tileClassName={({ date }) => {
                  const key = formatDate(date);
                  const status = attendanceRecords[key]?.status;
                  return `relative px-1 py-1 rounded-md ${
                    date < new Date().setHours(0, 0, 0, 0)
                      ? "text-gray-400 bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                      : "cursor-pointer hover:bg-green-100 dark:hover:bg-green-900"
                  } ${
                    status === "check-in"
                      ? "bg-green-200 dark:bg-green-800"
                      : status === "check-out"
                      ? "bg-blue-200 dark:bg-blue-800"
                      : status === "absent"
                      ? "bg-red-200 dark:bg-red-800"
                      : status === "leave"
                      ? "bg-yellow-200 dark:bg-yellow-800"
                      : ""
                  }`;
                }}
              />
            </div>

            {/* Monthly Summary (Optional small) */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 text-sm space-y-1">
              <h4 className="text-lg font-semibold mb-2">📊 This Month</h4>
              <p>✅ Present: {summary.present}</p>
              <p>❌ Absent: {summary.absent}</p>
              <p>📝 Leave: {summary.leave}</p>
            </div>
          </div>

          {/* Details Panel */}
          <div>
            {/* Day Details */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-2xl font-semibold mb-2">📅 {selectedDate.toDateString()}</h3>
              <p className="text-lg mb-2">
                {dayData.status === "check-in" && "✅ Present (Checked In)"}
                {dayData.status === "check-out" && "⏱️ Checked Out"}
                {dayData.status === "absent" && "❌ Absent"}
                {dayData.status === "leave" && "📝 Leave Requested"}
                {!dayData.status && "No attendance marked yet."}
              </p>
              {dayData.checkIn && <p className="text-sm">Check-In: {dayData.checkIn}</p>}
              {dayData.checkOut && <p className="text-sm">Check-Out: {dayData.checkOut}</p>}
              {dayData.reason && <p className="text-sm">Reason: {dayData.reason}</p>}
            </div>

            {/* Recent History */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-6">
              <h3 className="text-xl font-semibold mb-4">📆 Recent Attendance</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {Object.entries(attendanceRecords)
                  .sort((a, b) => new Date(b[0]) - new Date(a[0]))
                  .slice(0, 30)
                  .map(([date, data]) => (
                    <div
                      key={date}
                      className="flex flex-col sm:flex-row justify-between text-sm border-b border-gray-200 dark:border-gray-600 pb-1"
                    >
                      <span>{new Date(date).toDateString()}</span>
                      <span className={`font-medium px-2 py-1 rounded-md ${statusClass(data.status)}`}>
                        {data.status === "check-in" && `✅ Checked In (${data.checkIn || "-"})`}
                        {data.status === "check-out" && `⏱️ Checked Out (${data.checkOut || "-"})`}
                        {data.status === "absent" && "❌ Absent"}
                        {data.status === "leave" && `📝 Leave - ${data.reason || "No reason"}`}
                      </span>
                    </div>
                  ))}
                {Object.keys(attendanceRecords).length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400">No records found.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Context Menu */}
        {contextMenu.visible && (
          <ul
            ref={contextMenuRef}
            className="fixed bg-white dark:bg-gray-700 shadow-xl rounded-md py-2 text-sm w-44 border border-gray-200 dark:border-gray-600 z-[9999]"
            style={{
              top: `${Math.min(contextMenu.y, window.innerHeight - 180)}px`,
              left: `${Math.min(contextMenu.x, window.innerWidth - 200)}px`,
            }}
          >
            {isToday(contextMenu.date) ? (
              <>
                <li
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                  onClick={() => handleOptionSelect("check-in")}
                >
                  ✅ Check In
                </li>
                <li
                  className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                  onClick={() => handleOptionSelect("check-out")}
                >
                  ⏱️ Check Out
                </li>
              </>
            ) : (
              <>
                <li className="px-4 py-2 text-gray-400 cursor-not-allowed select-none">
                  ✅ Check In (Today only)
                </li>
                <li className="px-4 py-2 text-gray-400 cursor-not-allowed select-none">
                  ⏱️ Check Out (Today only)
                </li>
              </>
            )}
            <li
              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
              onClick={() => handleOptionSelect("absent")}
            >
              ❌ Mark Absent
            </li>
            <li
              className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
              onClick={() => handleOptionSelect("request-leave")}
            >
              📝 Request Leave
            </li>
          </ul>
        )}

        {/* Leave Request Modal */}
        {showLeaveDialog && (
          <div className="fixed inset-0 z-50 bg-black/60 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                📝 Leave Request for {contextMenu.date?.toDateString()}
              </h3>
              <textarea
                className="w-full p-3 border rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                rows="4"
                placeholder="Enter reason for leave..."
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
              />
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowLeaveDialog(false)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={submitLeaveRequest}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold"
                >
                  ✅ Send to Admin
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerAttendancePage;
