import React, { useState, useEffect, useRef } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const CleanerAttendancePage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, date: null });
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [leaveReason, setLeaveReason] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [leaveRequests, setLeaveRequests] = useState([]);
  const contextMenuRef = useRef(null);
  const cleanerName = localStorage.getItem("CleanerName") || "Cleaner";

  useEffect(() => {
    const saved = localStorage.getItem("Cleaner-attendance");
    if (saved) setAttendanceRecords(JSON.parse(saved));

    const savedRequests = localStorage.getItem("Cleaner-leave-requests");
    if (savedRequests) setLeaveRequests(JSON.parse(savedRequests));
  }, []);

  useEffect(() => {
    localStorage.setItem("Cleaner-attendance", JSON.stringify(attendanceRecords));
    localStorage.setItem("Cleaner-leave-requests", JSON.stringify(leaveRequests));
  }, [attendanceRecords, leaveRequests]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenu.visible && contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [contextMenu.visible]);

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

    if (!isToday(contextMenu.date) && ["check-in", "check-out"].includes(option)) {
      alert("✅ Check-in/Check-out only allowed for today's date.");
      return;
    }

    setAttendanceRecords((prev) => {
      const existing = prev[dateKey] || {};
      const updated = { ...prev };

      if (["absent", "leave"].includes(existing.status) && ["check-in", "check-out"].includes(option)) {
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
          break;
        case "check-out":
          if (existing.checkOut) {
            alert("🔁 Already checked out.");
            return prev;
          }
          updated[dateKey] = { ...existing, checkOut: time, status: "check-out" };
          break;
        case "absent":
          updated[dateKey] = { status: "absent" };
          break;
        case "clear":
          delete updated[dateKey];
          break;
        default:
          break;
      }

      setContextMenu((prev) => ({ ...prev, visible: false }));
      return updated;
    });
  };

  const submitLeaveRequest = () => {
    const dateKey = formatDate(contextMenu.date);
    setAttendanceRecords((prev) => ({
      ...prev,
      [dateKey]: { status: "leave", reason: leaveReason },
    }));
    setLeaveRequests((prev) => [...prev, { date: dateKey, reason: leaveReason }]);
    setLeaveReason("");
    setShowLeaveDialog(false);
    setContextMenu({ visible: false, x: 0, y: 0, date: null });
  };

  const getMonthlySummary = () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const summary = { present: 0, absent: 0, leave: 0 };
    for (const date in attendanceRecords) {
      if (date.startsWith(currentMonth)) {
        const status = attendanceRecords[date].status;
        if (["check-in", "check-out"].includes(status)) summary.present++;
        if (status === "absent") summary.absent++;
        if (status === "leave") summary.leave++;
      }
    }
    return summary;
  };

  const getYearlySummary = () => {
    const currentYear = String(new Date().getFullYear());
    const summary = { present: 0, absent: 0, leave: 0 };
    for (const date in attendanceRecords) {
      if (date.startsWith(currentYear)) {
        const status = attendanceRecords[date].status;
        if (["check-in", "check-out"].includes(status)) summary.present++;
        if (status === "absent") summary.absent++;
        if (status === "leave") summary.leave++;
      }
    }
    return summary;
  };

  const todayKey = formatDate(new Date());
  const todayData = attendanceRecords[todayKey] || {};
  const monthlySummary = getMonthlySummary();
  const yearlySummary = getYearlySummary();

  const statusClass = (status) => {
    switch (status) {
      case "check-in":
        return "bg-green-100 text-green-800 dark:bg-green-900/60 dark:text-green-200";
      case "check-out":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200";
      case "absent":
        return "bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-200";
      case "leave":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/60 dark:text-yellow-200";
      default:
        return "text-gray-500 dark:text-gray-300";
    }
  };

  const midnightToday = new Date();
  midnightToday.setHours(0, 0, 0, 0);

  return (
    <div className="min-h-screen p-6 bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-white">
      <h2 className="text-3xl font-bold mb-6">{cleanerName}'s Attendance </h2>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
          <h3 className="font-semibold mb-2">📅 Today</h3>
          <p className={`font-medium ${statusClass(todayData.status)}`}>
            {todayData.status
              ? todayData.status === "leave"
                ? `📝 Leave - ${todayData.reason || "No reason"}`
                : todayData.status === "check-in"
                ? `✅ Checked In (${todayData.checkIn || "-"})`
                : `⏱️ Checked Out (${todayData.checkOut || "-"})`
              : "No attendance marked"}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
          <h3 className="font-semibold mb-2">📊 This Month</h3>
          <p>✅ Present: {monthlySummary.present}</p>
          <p>❌ Absent: {monthlySummary.absent}</p>
          <p>📝 Leave: {monthlySummary.leave}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
          <h3 className="font-semibold mb-2">📆 This Year</h3>
          <p>✅ Present: {yearlySummary.present}</p>
          <p>❌ Absent: {yearlySummary.absent}</p>
          <p>📝 Leave: {yearlySummary.leave}</p>
        </div>
      </div>

      {/* Leave Requests */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-6">
        <h3 className="text-xl font-semibold mb-4">✉️ Leave Requests</h3>
        {leaveRequests.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {leaveRequests.map((req, index) => (
              <div
                key={index}
                className="flex justify-between border-b border-gray-200 dark:border-gray-600 pb-1"
              >
                <span>{new Date(req.date).toDateString()}</span>
                <span className="text-yellow-700 dark:text-yellow-300 font-medium">📝 {req.reason}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">No leave requests.</p>
        )}
      </div>

      {/* Calendar & Recent History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Calendar */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
          <Calendar
            value={selectedDate}
            minDate={new Date()}
            onChange={setSelectedDate}
            className="w-full rounded-lg overflow-hidden"
            tileContent={({ date }) => (
              <div className="absolute inset-0" onClick={(e) => handleDateClick(date, e)} />
            )}
            tileClassName={({ date }) => {
              const key = formatDate(date);
              const status = attendanceRecords[key]?.status;
              const isPast = date < midnightToday;
              return `relative px-1 py-1 rounded-md ${
                isPast
                  ? "text-gray-400 bg-gray-100 dark:text-gray-500 dark:bg-gray-700 cursor-not-allowed"
                  : "cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/40"
              } ${
                status === "check-in"
                  ? "bg-green-200 dark:bg-green-800/60"
                  : status === "check-out"
                  ? "bg-blue-200 dark:bg-blue-800/60"
                  : status === "absent"
                  ? "bg-red-200 dark:bg-red-800/60"
                  : status === "leave"
                  ? "bg-yellow-200 dark:bg-yellow-800/60"
                  : ""
              }`;
            }}
          />
        </div>

        {/* Recent History */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-semibold mb-4">📌 Recent Attendance</h3>
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

      {/* Leave Modal */}
      {showLeaveDialog && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
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
                ✅ Send to Manager
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CleanerAttendancePage;
