import React, { useEffect, useState, useCallback } from "react";
import { FaFileExport, FaChevronDown, FaChevronUp } from "react-icons/fa";
import {
  getMonthlyChart,
  exportAttendanceExcel,
} from "../../services/attendance.service";
import { getStaffWorkReport } from "../../services/employee.service";

/* ── period presets ── */
const PERIODS = [
  { label: "Today",      key: "today" },
  { label: "This Week",  key: "week" },
  { label: "This Month", key: "month" },
  { label: "All Time",   key: "all" },
];

const getPeriodRange = (key) => {
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const fmt   = (d) => d.toISOString().slice(0, 10);
  switch (key) {
    case "today": return { startDate: fmt(today), endDate: fmt(now) };
    case "week": {
      const s = new Date(today); s.setDate(s.getDate() - today.getDay());
      return { startDate: fmt(s), endDate: fmt(now) };
    }
    case "month": {
      const s = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: fmt(s), endDate: fmt(now) };
    }
    default: return {};
  }
};

const ROLE_COLOR = {
  waiter:            "bg-sky-100 text-sky-700",
  chef:              "bg-orange-100 text-orange-700",
  manager:           "bg-violet-100 text-violet-700",
  accountant:        "bg-emerald-100 text-emerald-700",
  inventory_manager: "bg-amber-100 text-amber-700",
  cleaner:           "bg-gray-100 text-gray-600",
};

const ROLE_AVATAR = {
  waiter:            "bg-sky-500",
  chef:              "bg-orange-400",
  manager:           "bg-violet-500",
  accountant:        "bg-emerald-500",
  inventory_manager: "bg-amber-500",
  cleaner:           "bg-gray-400",
};

const months = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

/* ══════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════ */
const ManagerEmployeeManagement = () => {
  const today = new Date();
  const [activeTab, setActiveTab] = useState("attendance");

  /* ── attendance state ── */
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
  const [selectedYear,  setSelectedYear]  = useState(today.getFullYear());
  const [groupedData,   setGroupedData]   = useState({});
  const [attLoading,    setAttLoading]    = useState(false);
  const [expandedEmp,   setExpandedEmp]   = useState(null);

  /* ── work report state ── */
  const [activePeriod,  setActivePeriod]  = useState("month");
  const [workStartDate, setWorkStartDate] = useState("");
  const [workEndDate,   setWorkEndDate]   = useState("");
  const [customActive,  setCustomActive]  = useState(false);
  const [workData,      setWorkData]      = useState([]);
  const [workLoading,   setWorkLoading]   = useState(false);

  /* ── load attendance ── */
  const loadMonthly = useCallback(async () => {
    try {
      setAttLoading(true);
      setExpandedEmp(null);
      const monthString = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}`;
      const res = await getMonthlyChart(monthString);
      if (res?.success) {
        const map = {};
        res.data.forEach((emp) => {
          const records = {};
          Object.entries(emp.days || {}).forEach(([day, value]) => {
            if (!value) return;
            const k = `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            records[k] = { checkIn: value.checkIn, checkOut: value.checkOut, status: value.status };
          });
          map[emp.employeeId] = { employeeId: emp.employeeId, name: emp.name, role: emp.role, records };
        });
        setGroupedData(map);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAttLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => { loadMonthly(); }, [loadMonthly]);

  const handleExport = async () => {
    const m         = selectedMonth + 1;
    const startDate = `${selectedYear}-${String(m).padStart(2, "0")}-01`;
    const lastDay   = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const endDate   = `${selectedYear}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    await exportAttendanceExcel(startDate, endDate);
  };

  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const dateColumns = [];
  for (let i = 1; i <= daysInMonth; i++) {
    dateColumns.push(
      `${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`
    );
  }

  const empList = Object.values(groupedData);

  /* ── load work report ── */
  const fetchWorkReport = useCallback(async (params) => {
    try {
      setWorkLoading(true);
      const res = await getStaffWorkReport(params);
      if (res?.success) setWorkData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setWorkLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "work") fetchWorkReport(getPeriodRange("month"));
  }, [activeTab, fetchWorkReport]);

  const applyPeriod = (key) => {
    setActivePeriod(key);
    setCustomActive(false);
    setWorkStartDate("");
    setWorkEndDate("");
    fetchWorkReport(getPeriodRange(key));
  };

  const applyCustom = () => {
    if (!workStartDate && !workEndDate) return;
    setActivePeriod("");
    setCustomActive(true);
    fetchWorkReport({ startDate: workStartDate, endDate: workEndDate });
  };

  const resetWork = () => {
    setActivePeriod("month");
    setCustomActive(false);
    setWorkStartDate("");
    setWorkEndDate("");
    fetchWorkReport(getPeriodRange("month"));
  };

  const maxWaiter = Math.max(...workData.map(e => e.ordersTaken), 1);
  const maxChef   = Math.max(...workData.map(e => e.ordersPrepared), 1);

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-br from-slate-100 to-blue-50 dark:from-gray-900 dark:to-gray-800 space-y-5">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Staff Management</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Attendance records &amp; work performance of your restaurant staff
        </p>
      </div>

      {/* TABS */}
      <div className="flex w-full sm:w-fit bg-white dark:bg-gray-800 rounded-2xl p-1.5 shadow-sm border border-gray-100 dark:border-gray-700">
        {[
          { key: "attendance", label: "Monthly Attendance" },
          { key: "work",       label: "Work Report" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl text-sm sm:text-base font-semibold transition-all ${
              activeTab === key
                ? "bg-violet-600 text-white shadow-md"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ══════════ ATTENDANCE TAB ══════════ */}
      {activeTab === "attendance" && (
        <>
          {/* filter bar */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 sm:p-5 border border-gray-100 dark:border-gray-700 flex flex-wrap gap-3 items-center">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="flex-1 min-w-[130px] px-3 sm:px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-28 px-3 sm:px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {[today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1].map(y => (
                <option key={y}>{y}</option>
              ))}
            </select>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm sm:text-base font-semibold rounded-xl transition-colors shadow-sm"
            >
              <FaFileExport /> Export
            </button>
          </div>

          {/* loading */}
          {attLoading && (
            <div className="flex items-center justify-center h-48">
              <p className="text-gray-400 animate-pulse">Loading attendance data...</p>
            </div>
          )}

          {/* no data */}
          {!attLoading && empList.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 py-16 text-center">
              <p className="text-gray-400">No staff records found for this month.</p>
            </div>
          )}

          {/* attendance list */}
          {!attLoading && empList.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">

              {/* list header */}
              <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-white">
                    {months[selectedMonth]} {selectedYear}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">{empList.length} staff · {daysInMonth} working days</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Present</span>
                  <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" /> Absent</span>
                </div>
              </div>

              {/* table header — desktop only */}
              <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-700/40 border-b border-gray-100 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                <span>Employee</span>
                <span className="text-center">Present</span>
                <span className="text-center">Absent</span>
                <span className="text-center">Rate</span>
                <span className="text-center">Progress</span>
                <span />
              </div>

              {/* rows */}
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {empList.map((emp) => {
                  const presentDays = Object.keys(emp.records).length;
                  const absentDays  = daysInMonth - presentDays;
                  const pct         = Math.round((presentDays / daysInMonth) * 100);
                  const isOpen      = expandedEmp === emp.employeeId;
                  const avatarColor = ROLE_AVATAR[emp.role] || "bg-gray-400";

                  return (
                    <div key={emp.employeeId}>
                      {/* ── main row ── */}
                      <button
                        onClick={() => setExpandedEmp(isOpen ? null : emp.employeeId)}
                        className="w-full text-left hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                      >
                        {/* desktop row */}
                        <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_40px] gap-4 items-center px-6 py-4">
                          {/* employee */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-9 h-9 shrink-0 rounded-full ${avatarColor} text-white font-bold text-sm flex items-center justify-center`}>
                              {emp.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">{emp.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-gray-400">{emp.employeeId}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${ROLE_COLOR[emp.role] || "bg-gray-100 text-gray-600"}`}>
                                  {emp.role}
                                </span>
                              </div>
                            </div>
                          </div>
                          {/* present */}
                          <div className="text-center">
                            <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{presentDays}</span>
                            <span className="text-xs text-gray-400 ml-1">days</span>
                          </div>
                          {/* absent */}
                          <div className="text-center">
                            <span className="text-lg font-extrabold text-red-500 dark:text-red-400">{absentDays}</span>
                            <span className="text-xs text-gray-400 ml-1">days</span>
                          </div>
                          {/* rate */}
                          <div className="text-center">
                            <span className={`text-lg font-extrabold ${pct >= 75 ? "text-emerald-600" : pct >= 50 ? "text-amber-500" : "text-red-500"}`}>
                              {pct}%
                            </span>
                          </div>
                          {/* progress bar */}
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                          {/* expand */}
                          <div className="flex items-center justify-center text-gray-400">
                            {isOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                          </div>
                        </div>

                        {/* mobile row */}
                        <div className="sm:hidden px-4 py-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-10 h-10 shrink-0 rounded-full ${avatarColor} text-white font-bold text-sm flex items-center justify-center`}>
                                {emp.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">{emp.name}</p>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <span className="text-xs text-gray-400">{emp.employeeId}</span>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${ROLE_COLOR[emp.role] || "bg-gray-100 text-gray-600"}`}>
                                    {emp.role}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="shrink-0 text-gray-400">
                              {isOpen ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                            </div>
                          </div>
                          {/* mobile stats */}
                          <div className="mt-3 flex items-center gap-4">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              <span className="text-sm font-bold text-emerald-600">{presentDays}</span>
                              <span className="text-xs text-gray-400">present</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-red-400" />
                              <span className="text-sm font-bold text-red-500">{absentDays}</span>
                              <span className="text-xs text-gray-400">absent</span>
                            </div>
                            <span className={`ml-auto text-sm font-extrabold ${pct >= 75 ? "text-emerald-600" : pct >= 50 ? "text-amber-500" : "text-red-500"}`}>
                              {pct}%
                            </span>
                          </div>
                          <div className="mt-2 w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400"}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </button>

                      {/* ── expanded: full date-wise table ── */}
                      {isOpen && (
                        <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40">
                          {/* sub-header */}
                          <div className="px-4 sm:px-6 py-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                              Date-wise Log — {months[selectedMonth]} {selectedYear}
                            </p>
                            <div className="flex items-center gap-3 text-[10px] font-semibold">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{presentDays} Present</span>
                              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-500">{absentDays} Absent</span>
                            </div>
                          </div>

                          {/* table header */}
                          <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr] sm:grid-cols-[1fr_1.2fr_1.2fr_1.2fr_1fr] gap-2 px-4 sm:px-6 py-2 bg-gray-100 dark:bg-gray-800/60 text-[10px] sm:text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            <span>Date</span>
                            <span>Day</span>
                            <span className="text-emerald-600">Check In</span>
                            <span className="text-blue-500">Check Out</span>
                            <span className="text-right text-violet-600">Hours</span>
                          </div>

                          {/* all day rows */}
                          <div className="divide-y divide-gray-100 dark:divide-gray-700/60 max-h-80 overflow-y-auto">
                            {dateColumns.map((date) => {
                              const rec   = emp.records[date];
                              const d     = new Date(date + "T00:00:00");
                              const inT   = rec?.checkIn  ? new Date(rec.checkIn)  : null;
                              const outT  = rec?.checkOut ? new Date(rec.checkOut) : null;
                              const hrs   = inT && outT ? ((outT - inT) / 3600000).toFixed(1) : null;

                              return (
                                <div
                                  key={date}
                                  className={`grid grid-cols-[1fr_1fr_1fr_1fr_1fr] sm:grid-cols-[1fr_1.2fr_1.2fr_1.2fr_1fr] gap-2 items-center px-4 sm:px-6 py-2.5 text-xs sm:text-sm transition-colors
                                    ${rec
                                      ? "bg-white dark:bg-gray-800 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10"
                                      : "bg-white/60 dark:bg-gray-800/40 hover:bg-gray-100 dark:hover:bg-gray-700/20"
                                    }`}
                                >
                                  {/* date number */}
                                  <div className="flex items-center gap-2">
                                    <span className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-xs font-bold
                                      ${rec
                                        ? "bg-emerald-500 text-white"
                                        : "bg-gray-100 dark:bg-gray-700 text-gray-400"
                                      }`}
                                    >
                                      {d.getDate()}
                                    </span>
                                  </div>

                                  {/* day name */}
                                  <span className="font-medium text-gray-500 dark:text-gray-400">
                                    {d.toLocaleDateString("en-IN", { weekday: "short" })}
                                  </span>

                                  {/* check in */}
                                  <span className={`font-semibold ${inT ? "text-emerald-600 dark:text-emerald-400" : "text-gray-300 dark:text-gray-600"}`}>
                                    {inT ? inT.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                                  </span>

                                  {/* check out */}
                                  <span className={`font-semibold ${outT ? "text-blue-500 dark:text-blue-400" : "text-gray-300 dark:text-gray-600"}`}>
                                    {outT ? outT.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                                  </span>

                                  {/* hours */}
                                  <span className={`text-right font-bold ${hrs ? "text-violet-600 dark:text-violet-400" : rec ? "text-amber-500" : "text-gray-300 dark:text-gray-600"}`}>
                                    {hrs ? `${hrs}h` : rec ? "—" : "Absent"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ══════════ WORK REPORT TAB ══════════ */}
      {activeTab === "work" && (
        <>
          {/* period filter */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 sm:p-5 border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex flex-wrap gap-2">
              {PERIODS.map(({ label, key }) => (
                <button
                  key={key}
                  onClick={() => applyPeriod(key)}
                  className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-sm sm:text-base font-semibold transition-all ${
                    activePeriod === key && !customActive
                      ? "bg-violet-600 text-white shadow-md"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-violet-50 hover:text-violet-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm font-semibold text-gray-500">From</label>
                <input type="date" value={workStartDate} onChange={(e) => setWorkStartDate(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs sm:text-sm font-semibold text-gray-500">To</label>
                <input type="date" value={workEndDate} onChange={(e) => setWorkEndDate(e.target.value)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
              </div>
              <button onClick={applyCustom} disabled={!workStartDate && !workEndDate}
                className="col-span-1 px-4 sm:px-5 py-2 sm:py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-xl text-sm sm:text-base font-semibold transition-colors shadow-sm">
                Apply
              </button>
              <button onClick={resetWork}
                className="col-span-1 px-4 sm:px-5 py-2 sm:py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-sm sm:text-base font-semibold transition-colors">
                Reset
              </button>
            </div>
            {customActive && workStartDate && (
              <p className="text-xs sm:text-sm text-violet-600 dark:text-violet-400 font-medium">
                Showing: {workStartDate} → {workEndDate || "now"}
              </p>
            )}
          </div>

          {/* work list */}
          {workLoading ? (
            <div className="flex items-center justify-center h-48">
              <p className="text-gray-400 animate-pulse">Loading work report...</p>
            </div>
          ) : workData.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 py-16 text-center">
              <p className="text-gray-400">No staff found for this restaurant.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-base sm:text-lg font-semibold text-gray-700 dark:text-white">Staff Work Performance</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  <span className="text-sky-600 font-medium">Waiter</span> — orders taken &nbsp;·&nbsp;
                  <span className="text-orange-500 font-medium">Chef</span> — orders prepared
                </p>
              </div>

              {/* desktop table header */}
              <div className="hidden sm:grid grid-cols-[40px_2fr_1fr_1fr_1fr_2fr] gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-700/40 border-b border-gray-100 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                <span>#</span>
                <span>Staff</span>
                <span className="text-center">Role</span>
                <span className="text-center">Orders Taken</span>
                <span className="text-center">Orders Prepared</span>
                <span>Activity</span>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {workData.map((emp, idx) => {
                  const isWaiter  = emp.role === "waiter";
                  const isChef    = emp.role === "chef";
                  const workCount = isWaiter ? emp.ordersTaken : isChef ? emp.ordersPrepared : null;
                  const maxVal    = isWaiter ? maxWaiter : maxChef;
                  const roleClass = ROLE_COLOR[emp.role] || "bg-gray-100 text-gray-600";
                  const avColor   = ROLE_AVATAR[emp.role] || "bg-gray-400";

                  return (
                    <div key={emp._id}>
                      {/* desktop row */}
                      <div className="hidden sm:grid grid-cols-[40px_2fr_1fr_1fr_1fr_2fr] gap-4 items-center px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                        <span className="text-sm text-gray-400 font-medium">{idx + 1}</span>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 shrink-0 rounded-full ${avColor} text-white font-bold text-sm flex items-center justify-center`}>
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 dark:text-white text-sm truncate">{emp.name}</p>
                            <p className="text-xs text-gray-400">{emp.employeeId}</p>
                          </div>
                        </div>
                        <div className="text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${roleClass}`}>{emp.role}</span>
                        </div>
                        <div className="text-center">
                          {isWaiter
                            ? <span className="text-xl font-extrabold text-sky-600 dark:text-sky-400">{emp.ordersTaken}</span>
                            : <span className="text-gray-300 dark:text-gray-600 text-lg">—</span>}
                        </div>
                        <div className="text-center">
                          {isChef
                            ? <span className="text-xl font-extrabold text-orange-500 dark:text-orange-400">{emp.ordersPrepared}</span>
                            : <span className="text-gray-300 dark:text-gray-600 text-lg">—</span>}
                        </div>
                        <div>
                          {workCount !== null ? (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${isWaiter ? "bg-sky-500" : "bg-orange-400"}`}
                                  style={{ width: `${Math.min(100, (workCount / maxVal) * 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 w-8 text-right shrink-0">{workCount}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300 dark:text-gray-600">N/A</span>
                          )}
                        </div>
                      </div>

                      {/* mobile row */}
                      <div className="sm:hidden px-4 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/20 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400 w-5 shrink-0">{idx + 1}</span>
                          <div className={`w-9 h-9 shrink-0 rounded-full ${avColor} text-white font-bold text-sm flex items-center justify-center`}>
                            {emp.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-gray-800 dark:text-white text-sm">{emp.name}</p>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${roleClass}`}>{emp.role}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">{emp.employeeId}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex gap-3">
                          {isWaiter && (
                            <div className="flex-1 bg-sky-50 dark:bg-sky-900/20 rounded-xl px-3 py-2 flex items-center justify-between">
                              <span className="text-xs text-sky-500 font-semibold">Orders Taken</span>
                              <span className="text-lg font-extrabold text-sky-600 dark:text-sky-400">{emp.ordersTaken}</span>
                            </div>
                          )}
                          {isChef && (
                            <div className="flex-1 bg-orange-50 dark:bg-orange-900/20 rounded-xl px-3 py-2 flex items-center justify-between">
                              <span className="text-xs text-orange-500 font-semibold">Orders Prepared</span>
                              <span className="text-lg font-extrabold text-orange-500 dark:text-orange-400">{emp.ordersPrepared}</span>
                            </div>
                          )}
                          {!isWaiter && !isChef && (
                            <div className="flex-1 bg-gray-50 dark:bg-gray-700/30 rounded-xl px-3 py-2 flex items-center justify-between">
                              <span className="text-xs text-gray-400">No order metrics</span>
                              <span className="text-gray-300 dark:text-gray-600">—</span>
                            </div>
                          )}
                        </div>
                        {workCount !== null && (
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${isWaiter ? "bg-sky-500" : "bg-orange-400"}`}
                                style={{ width: `${Math.min(100, (workCount / maxVal) * 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400 shrink-0">{workCount} orders</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ManagerEmployeeManagement;
