import React, { useState } from "react";
import { FaTrash } from "react-icons/fa";

const ROLE_OPTIONS = [
  "All",
  "Inventory Manager",
  "Cheif",
  "Sucheif",
  "waiter",
  "Cleaner",
  "Accountant",
];

const EmployeeManagement = () => {
  const getToday = () => new Date().toLocaleDateString("en-GB");

  const [employees, setEmployees] = useState([
    {
      id: 1,
      date: getToday(),
      employeeId: "C001",
      password: "cheif123",
      name: "John Doe",
      role: "cheif",
      restaurant: "Downtown Diner",
      status: "Off Duty",
      clockIn: "",
      clockOut: "",
      attendanceStatus: "Leave",
    },
    {
      id: 2,
      date: getToday(),
      employeeId: "H001",
      password: "sucheif456",
      name: "Jane Smith",
      role: "Sucheif",
      restaurant: "Downtown Diner",
      status: "On Duty",
      clockIn: "10:15 AM",
      clockOut: "",
      attendanceStatus: "Present",
    },
    {
      id: 3,
      date: getToday(),
      employeeId: "W001",
      password: "waiter789",
      name: "Sam Brown",
      role: "waiter",
      restaurant: "Downtown Diner",
      status: "Off Duty",
      clockIn: "",
      clockOut: "",
      attendanceStatus: "Absent",
    },
  ]);

  const handleDelete = (id) => {
    setEmployees((prev) => prev.filter((emp) => emp.id !== id));
  };

  const [filter, setFilter] = useState("All");         // Attendance filter
  const [roleFilter, setRoleFilter] = useState("All"); // Role filter
  const [search, setSearch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  const filteredEmployees = employees.filter((emp) => {
    const matchesAttendance = filter === "All" || emp.attendanceStatus === filter;

    // Case-insensitive role compare to handle data variations
    const matchesRole =
      roleFilter === "All" ||
      (emp.role || "").toLowerCase() === roleFilter.toLowerCase();

    const matchesSearch = (emp.name || "")
      .toLowerCase()
      .includes(search.toLowerCase());

    // emp.date in en-GB => dd/mm/yyyy
    const empDate = (emp.date || "").split("/").reverse().join("-"); // yyyy-mm-dd
    const empMonth = empDate.slice(0, 7); // yyyy-mm
    const matchesMonth = !selectedMonth || empMonth === selectedMonth;

    return matchesAttendance && matchesRole && matchesSearch && matchesMonth;
  });

  // Small helpers for UI chips
  const statusClass = (s) =>
    s === "On Duty"
      ? "text-green-700 bg-green-100 dark:bg-green-800/30 dark:text-green-300"
      : "text-gray-600 bg-gray-100 dark:bg-gray-700/40 dark:text-gray-300";

  const attendanceClass = (a) =>
    a === "Absent"
      ? "text-red-700 bg-red-100 dark:bg-red-800/30 dark:text-red-300"
      : a === "Leave"
      ? "text-yellow-700 bg-yellow-100 dark:bg-yellow-800/30 dark:text-yellow-300"
      : "text-green-700 bg-green-100 dark:bg-green-800/30 dark:text-green-300";

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto dark:bg-gray-900 dark:text-white min-h-screen">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Employee Management</h1>

      {/* Search + Filters + Month */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-700 p-3 sm:p-4 mb-4">
        <div className="flex flex-col gap-3">
          {/* Row 1: Search */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search by Name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full 
                         bg-white dark:bg-gray-700 dark:text-white focus:outline-none 
                         focus:ring-2 focus:ring-green-500 shadow-sm"
              aria-label="Search by name"
            />
          </div>

          {/* Row 2: Filters (Attendance + Role + Month) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Attendance Filter */}
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <label
                htmlFor="attendanceFilter"
                className="text-sm text-gray-700 dark:text-gray-300 shrink-0"
              >
                Attendance:
              </label>
              <select
                id="attendanceFilter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-[55%] sm:w-auto px-3 py-2 rounded-full border border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-gray-700 dark:text-white 
                           focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {["All", "Present", "Absent", "Leave"].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Role Filter */}
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <label
                htmlFor="roleFilter"
                className="text-sm text-gray-700 dark:text-gray-300 shrink-0"
              >
                Role:
              </label>
              <select
                id="roleFilter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-[55%] sm:w-auto px-3 py-2 rounded-full border border-gray-300 dark:border-gray-600 
                           bg-white dark:bg-gray-700 dark:text-white 
                           focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Filter */}
            <div className="flex items-center justify-between sm:justify-start gap-2">
              <label
                htmlFor="monthFilter"
                className="text-sm text-gray-700 dark:text-gray-300 shrink-0"
              >
                Month:
              </label>
              <input
                id="monthFilter"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-[55%] sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-full 
                           bg-white dark:bg-gray-700 dark:text-white 
                           focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Cards (smaller than md) */}
      <div className="space-y-3 md:hidden">
        {filteredEmployees.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 p-4 border border-dashed rounded-xl">
            No employees found for this selection.
          </div>
        )}

        {filteredEmployees.map((emp) => (
          <div
            key={emp.id}
            className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-base font-semibold">{emp.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  ID: {emp.employeeId} • {emp.restaurant}
                </div>
              </div>
              <button
                onClick={() => handleDelete(emp.id)}
                className="text-red-600 hover:text-red-700 p-2 -mr-2"
                aria-label={`Delete ${emp.name}`}
                title="Delete employee"
              >
                <FaTrash />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs px-2 py-1 rounded-full border border-gray-300 dark:border-gray-600">
                {emp.role}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${statusClass(emp.status)}`}>
                {emp.status}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${attendanceClass(emp.attendanceStatus)}`}>
                {emp.attendanceStatus}
              </span>
              <span className="text-xs px-2 py-1 rounded-full border border-gray-300 dark:border-gray-600">
                {emp.date}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div className="flex flex-col">
                <span className="text-gray-500 dark:text-gray-400">Clock In</span>
                <span className="font-medium">{emp.clockIn || "-"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 dark:text-gray-400">Clock Out</span>
                <span className="font-medium">{emp.clockOut || "-"}</span>
              </div>
              <div className="flex flex-col col-span-2">
                <span className="text-gray-500 dark:text-gray-400">Password</span>
                <span className="font-mono text-[13px] bg-gray-50 dark:bg-gray-700/40 rounded px-2 py-1 w-fit">
                  {emp.password}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop/Tablets: Table (md and up) */}
      <div className="mt-4 hidden md:block">
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="min-w-full bg-white dark:bg-gray-800 rounded-xl">
            <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr className="text-left">
                <th className="p-3">Date</th>
                <th className="p-3">Employee ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">Role</th>
                <th className="p-3">Restaurant</th>
                <th className="p-3">Status</th>
                <th className="p-3">Attendance</th>
                <th className="p-3">Clock In</th>
                <th className="p-3">Clock Out</th>
                <th className="p-3">Password</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => (
                <tr
                  key={emp.id}
                  className="border-t border-gray-200 dark:border-gray-700 hover:bg-green-50/70 dark:hover:bg-gray-700 transition"
                >
                  <td className="p-3 whitespace-nowrap">{emp.date}</td>
                  <td className="p-3 whitespace-nowrap">{emp.employeeId}</td>
                  <td className="p-3 whitespace-nowrap">{emp.name}</td>
                  <td className="p-3 whitespace-nowrap">{emp.role}</td>
                  <td className="p-3 whitespace-nowrap">{emp.restaurant}</td>
                  <td className="p-3 whitespace-nowrap">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusClass(emp.status)}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className={`text-xs px-2 py-1 rounded-full ${attendanceClass(emp.attendanceStatus)}`}>
                      {emp.attendanceStatus}
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap">{emp.clockIn || "-"}</td>
                  <td className="p-3 whitespace-nowrap">{emp.clockOut || "-"}</td>
                  <td className="p-3 whitespace-nowrap font-mono">{emp.password}</td>
                  <td className="p-3 whitespace-nowrap">
                    <button
                      onClick={() => handleDelete(emp.id)}
                      className="text-red-600 hover:text-red-800"
                      aria-label={`Delete ${emp.name}`}
                      title="Delete employee"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td
                    colSpan="11"
                    className="text-center text-gray-500 dark:text-gray-400 p-4"
                  >
                    No employees found for this selection.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmployeeManagement;
