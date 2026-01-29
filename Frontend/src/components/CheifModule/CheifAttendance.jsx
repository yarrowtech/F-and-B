import React, { useEffect, useMemo, useRef, useState } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

const LONG_PRESS_MS = 400;

const ChiefAttendancePage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [leaveRequests, setLeaveRequests] = useState([]);

  // Desktop context menu
  const [menu, setMenu] = useState({ visible: false, x: 0, y: 0, date: null });

  // Mobile bottom sheet
  const [sheet, setSheet] = useState({ visible: false, date: null });

  // Leave modal
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [leaveReason, setLeaveReason] = useState("");

  const contextMenuRef = useRef(null);
  const touchTimerRef = useRef(null);
  const isTouch = useMemo(
    () => typeof window !== "undefined" && "ontouchstart" in window,
    []
  );

  const cheifName = localStorage.getItem("cheifName") || "cheif";

  /* ------------------------ Persist state ------------------------ */
  useEffect(() => {
    const saved = localStorage.getItem("cheif-attendance");
    if (saved) setAttendanceRecords(JSON.parse(saved));

    const savedReq = localStorage.getItem("cheif-leave-requests");
    if (savedReq) setLeaveRequests(JSON.parse(savedReq));
  }, []);

  useEffect(() => {
    localStorage.setItem("cheif-attendance", JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  useEffect(() => {
    localStorage.setItem("cheif-leave-requests", JSON.stringify(leaveRequests));
  }, [leaveRequests]);

  /* ------------------------ Helpers ------------------------ */
  const fmtKey = (date) => date.toISOString().split("T")[0];
  const timeNow = () =>
    new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const isToday = (date) => {
    const t = new Date();
    return (
      date.getDate() === t.getDate() &&
      date.getMonth() === t.getMonth() &&
      date.getFullYear() === t.getFullYear()
    );
  };

  const midnightToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

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

  const getMonthlySummary = () => {
    const monthPrefix = new Date().toISOString().slice(0, 7);
    const s = { present: 0, absent: 0, leave: 0 };
    for (const k in attendanceRecords) {
      if (!k.startsWith(monthPrefix)) continue;
      const st = attendanceRecords[k].status;
      if (st === "absent") s.absent++;
      else if (st === "leave") s.leave++;
      else if (st === "check-in" || st === "check-out") s.present++;
    }
    return s;
  };

  const getYearlySummary = () => {
    const yearPrefix = String(new Date().getFullYear());
    const s = { present: 0, absent: 0, leave: 0 };
    for (const k in attendanceRecords) {
      if (!k.startsWith(yearPrefix)) continue;
      const st = attendanceRecords[k].status;
      if (st === "absent") s.absent++;
      else if (st === "leave") s.leave++;
      else if (st === "check-in" || st === "check-out") s.present++;
    }
    return s;
  };

  const todayKey = fmtKey(new Date());
  const todayData = attendanceRecords[todayKey] || {};
  const monthlySummary = getMonthlySummary();
  const yearlySummary = getYearlySummary();

  /* ------------------------ Menu logic ------------------------ */
  // Close desktop menu on outside click
  useEffect(() => {
    const onDown = (e) => {
      if (!menu.visible) return;
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setMenu((m) => ({ ...m, visible: false }));
      }
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [menu.visible]);

  const openForDate = (date, event) => {
    setSelectedDate(date);
    if (isTouch || window.innerWidth < 1024) {
      // mobile bottom sheet
      setSheet({ visible: true, date });
    } else {
      // desktop context menu
      setMenu({
        visible: true,
        x: event?.clientX ?? 20,
        y: event?.clientY ?? 20,
        date,
      });
    }
  };

  const onTileClick = (date, event) => openForDate(date, event);

  // Long press support on mobile
  const onTileTouchStart = (date, event) => {
    if (!isTouch) return;
    touchTimerRef.current = setTimeout(() => openForDate(date, event), LONG_PRESS_MS);
  };
  const onTileTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  };

  /* ------------------------ Actions ------------------------ */
  const handleOptionSelect = (option, source = "menu") => {
    const date = source === "menu" ? menu.date : sheet.date;
    if (!date) return;
    const dateKey = fmtKey(date);
    const time = timeNow();

    if (option === "request-leave") {
      setShowLeaveDialog(true);
      return;
    }

    if (!isToday(date) && (option === "check-in" || option === "check-out")) {
      alert("✅ Check-in/Check-out only allowed for today's date.");
      return;
    }

    setAttendanceRecords((prev) => {
      const existing = prev[dateKey] || {};
      const updated = { ...prev };

      if (
        (existing.status === "absent" || existing.status === "leave") &&
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

      // Close menu/sheet
      setMenu((m) => ({ ...m, visible: false }));
      setSheet({ visible: false, date: null });
      return updated;
    });
  };

  const submitLeaveRequest = () => {
    const date = menu.date || sheet.date || selectedDate;
    const dateKey = fmtKey(date);
    setAttendanceRecords((prev) => ({
      ...prev,
      [dateKey]: { status: "leave", reason: leaveReason },
    }));
    // ✅ fixed: removed stray closing bracket
    setLeaveRequests((prev) => [...prev, { date: dateKey, reason: leaveReason }]);
    setLeaveReason("");
    setShowLeaveDialog(false);
    setMenu({ visible: false, x: 0, y: 0, date: null });
    setSheet({ visible: false, date: null });
  };

  /* ------------------------ UI ------------------------ */
  return (
    <div className="min-h-screen p-4 md:p-6 bg-gradient-to-b from-gray-100 to-white dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-white">
      <h2 className="text-2xl md:text-3xl font-bold mb-6">
        {cheifName}&apos;s Attendance
      </h2>

      {/* Top Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg text-sm md:text-base">
          <h3 className="font-semibold mb-2">📅 Today</h3>
          <p className={`font-medium inline-block px-2 py-1 rounded ${statusClass(todayData.status)}`}>
            {todayData.status
              ? todayData.status === "leave"
                ? `📝 Leave - ${todayData.reason || "No reason"}`
                : todayData.status === "check-in"
                ? `✅ Checked In (${todayData.checkIn || "-"})`
                : `⏱️ Checked Out (${todayData.checkOut || "-"})`
              : "No attendance marked"}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg text-sm md:text-base">
          <h3 className="font-semibold mb-2">📊 This Month</h3>
          <p>✅ Present: {monthlySummary.present}</p>
          <p>❌ Absent: {monthlySummary.absent}</p>
          <p>📝 Leave: {monthlySummary.leave}</p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg text-sm md:text-base">
          <h3 className="font-semibold mb-2">📆 This Year</h3>
          <p>✅ Present: {yearlySummary.present}</p>
          <p>❌ Absent: {yearlySummary.absent}</p>
          <p>📝 Leave: {yearlySummary.leave}</p>
        </div>
      </div>

      {/* Leave Requests */}
      <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg mb-6">
        <h3 className="text-lg md:text-xl font-semibold mb-4">✉️ Leave Requests</h3>
        {leaveRequests.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
            {leaveRequests.map((req, i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row justify-between border-b border-gray-200 dark:border-gray-600 pb-1"
              >
                <span>{new Date(req.date).toDateString()}</span>
                <span className="text-yellow-700 dark:text-yellow-300 font-medium">
                  📝 {req.reason}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No leave requests.</p>
        )}
      </div>

      {/* Calendar & Recent History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Calendar */}
        <div className="bg-white dark:bg-gray-800 p-3 md:p-4 rounded-xl shadow-lg">
          <Calendar
            value={selectedDate}
            minDate={new Date()} // only today & future selectable
            onChange={setSelectedDate}
            onClickDay={(value, event) => onTileClick(value, event)}
            tileDisabled={({ date }) => date < midnightToday}
            tileContent={({ date }) => (
              <div
                className="absolute inset-0"
                onTouchStart={(e) => onTileTouchStart(date, e)}
                onTouchEnd={onTileTouchEnd}
              />
            )}
            className="w-full rounded-lg overflow-hidden"
            tileClassName={({ date }) => {
              const key = fmtKey(date);
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
        <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg">
          <h3 className="text-lg md:text-xl font-semibold mb-4">📌 Recent Attendance</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2 text-sm md:text-base">
            {Object.entries(attendanceRecords)
              .sort((a, b) => new Date(b[0]) - new Date(a[0]))
              .slice(0, 30)
              .map(([date, data]) => (
                <div
                  key={date}
                  className="flex flex-col sm:flex-row justify-between border-b border-gray-200 dark:border-gray-600 pb-1"
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
              <p className="text-gray-500 dark:text-gray-400 text-sm">No records found.</p>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Context Menu */}
      {menu.visible && (
        <ul
          ref={contextMenuRef}
          className="fixed bg-white dark:bg-gray-700 shadow-xl rounded-md py-2 text-sm w-48 border border-gray-200 dark:border-gray-600 z-[9999]"
          style={{
            top: `${Math.min(menu.y, window.innerHeight - 200)}px`,
            left: `${Math.min(menu.x, window.innerWidth - 208)}px`,
          }}
        >
          {isToday(menu.date) ? (
            <>
              <MenuItem onClick={() => handleOptionSelect("check-in", "menu")} label="✅ Check In" />
              <MenuItem onClick={() => handleOptionSelect("check-out", "menu")} label="⏱️ Check Out" />
            </>
          ) : (
            <>
              <MenuItem disabled label="✅ Check In (Today only)" />
              <MenuItem disabled label="⏱️ Check Out (Today only)" />
            </>
          )}
          <MenuItem onClick={() => handleOptionSelect("absent", "menu")} label="❌ Mark Absent" />
          <MenuItem onClick={() => handleOptionSelect("request-leave", "menu")} label="📝 Request Leave" />
          <hr className="my-1 border-gray-200 dark:border-gray-600" />
          <MenuItem onClick={() => handleOptionSelect("clear", "menu")} label="🧹 Clear Marking" />
        </ul>
      )}

      {/* Mobile Bottom Sheet */}
      {sheet.visible && (
        <div className="fixed inset-0 z-[9998] flex items-end justify-center">
          <button
            className="absolute inset-0 bg-black/50"
            onClick={() => setSheet({ visible: false, date: null })}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-t-2xl p-4 pb-6 shadow-2xl">
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-3" />
            <h4 className="text-base md:text-lg font-semibold mb-3 text-center">
              {sheet.date?.toDateString()}
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <ActionButton
                disabled={!isToday(sheet.date)}
                onClick={() => handleOptionSelect("check-in", "sheet")}
                label="✅ Check In"
              />
              <ActionButton
                disabled={!isToday(sheet.date)}
                onClick={() => handleOptionSelect("check-out", "sheet")}
                label="⏱️ Check Out"
              />
              <ActionButton
                onClick={() => handleOptionSelect("absent", "sheet")}
                label="❌ Mark Absent"
              />
              <ActionButton
                onClick={() => handleOptionSelect("request-leave", "sheet")}
                label="📝 Request Leave"
              />
              <div className="col-span-2">
                <ActionButton
                  onClick={() => handleOptionSelect("clear", "sheet")}
                  label="🧹 Clear Marking"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leave Modal */}
      {showLeaveDialog && (
        <div className="fixed inset-0 z-[10000] bg-black/60 flex items-center justify-center px-4">
          <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg w-full max-w-md">
            <h3 className="text-base md:text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              📝 Leave Request for {(menu.date || sheet.date || selectedDate)?.toDateString()}
            </h3>
            <textarea
              className="w-full p-3 border rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm md:text-base"
              rows="4"
              placeholder="Enter reason for leave..."
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowLeaveDialog(false);
                  setLeaveReason("");
                }}
                className="px-3 md:px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 text-sm md:text-base"
              >
                Cancel
              </button>
              <button
                onClick={submitLeaveRequest}
                className="px-3 md:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-semibold text-sm md:text-base"
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

/* ------------------------ Small UI helpers ------------------------ */
function MenuItem({ label, onClick, disabled }) {
  const cls = disabled
    ? "px-4 py-2 text-gray-400 cursor-not-allowed select-none"
    : "px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer";
  return (
    <li className={cls} onClick={disabled ? undefined : onClick}>
      {label}
    </li>
  );
}

function ActionButton({ label, onClick, disabled }) {
  return (
    <button
      className={`w-full px-3 py-3 rounded-lg text-sm font-medium shadow
        ${
          disabled
            ? "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
            : "bg-green-600 text-white active:scale-[0.98] hover:bg-green-700 transition"
        }`}
      onClick={onClick}
      disabled={disabled}
    >
      {label}
    </button>
  );
}

export default ChiefAttendancePage;
