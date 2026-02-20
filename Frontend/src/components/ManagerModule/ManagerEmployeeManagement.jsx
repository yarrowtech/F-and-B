import React, { useEffect, useState } from "react";
import { FaFileExport } from "react-icons/fa";
import {
  getMonthlyChart,
  exportAttendanceExcel,
} from "../../services/attendance.service";

const EmployeeManagement = () => {
  const today = new Date();

  const [selectedMonth, setSelectedMonth] = useState(
    today.getMonth()
  );
  const [selectedYear, setSelectedYear] = useState(
    today.getFullYear()
  );

  const [groupedData, setGroupedData] = useState({});
  const [loading, setLoading] = useState(false);

  /* ================= LOAD MONTH DATA ================= */
  const loadMonthly = async () => {
    try {
      setLoading(true);

      const monthString = `${selectedYear}-${String(
        selectedMonth + 1
      ).padStart(2, "0")}`;

      const res = await getMonthlyChart(monthString);

      if (res?.success) {
        groupByEmployee(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= GROUP DATA BY EMPLOYEE ================= */
  const groupByEmployee = (data) => {
    const map = {};

    data.forEach((item) => {
      const emp = item.employee;
      if (!emp) return;

      const empId = emp._id;

      if (!map[empId]) {
        map[empId] = {
          employeeId: emp.employeeId || "N/A",
          name: emp.name,
          records: {},
        };
      }

    const d = new Date(item.date);
const dateKey = `${d.getFullYear()}-${String(
  d.getMonth() + 1
).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      map[empId].records[dateKey] = {
        checkIn: item.checkIn,
        checkOut: item.checkOut,
      };
    });

    setGroupedData(map);
  };

  useEffect(() => {
    loadMonthly();
  }, [selectedMonth, selectedYear]);

  /* ================= EXPORT MONTH ================= */
  const handleExport = async () => {
    const startDate = new Date(
      selectedYear,
      selectedMonth,
      1
    )
      .toISOString()
      .split("T")[0];

    const lastDay = new Date(
      selectedYear,
      selectedMonth + 1,
      0
    ).getDate();

    const endDate = new Date(
      selectedYear,
      selectedMonth,
      lastDay
    )
      .toISOString()
      .split("T")[0];

    await exportAttendanceExcel(startDate, endDate);
  };

  /* ================= CREATE DAYS ARRAY ================= */
  const daysInMonth = new Date(
    selectedYear,
    selectedMonth + 1,
    0
  ).getDate();

 const dateColumns = [];

for (let i = 1; i <= daysInMonth; i++) {
  const date = new Date(selectedYear, selectedMonth, i);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  dateColumns.push(`${year}-${month}-${day}`);
}


  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">
        Monthly Attendance Report
      </h1>

      {/* FILTER */}
      <div className="flex gap-4 mb-6 flex-wrap items-center">
        <select
          value={selectedMonth}
          onChange={(e) =>
            setSelectedMonth(Number(e.target.value))
          }
          className="p-2 border rounded"
        >
          {Array.from({ length: 12 }).map((_, i) => (
            <option key={i} value={i}>
              {new Date(0, i).toLocaleString("default", {
                month: "long",
              })}
            </option>
          ))}
        </select>

        <select
          value={selectedYear}
          onChange={(e) =>
            setSelectedYear(Number(e.target.value))
          }
          className="p-2 border rounded"
        >
          {[selectedYear - 1, selectedYear, selectedYear + 1].map(
            (y) => (
              <option key={y}>{y}</option>
            )
          )}
        </select>

        <button
          onClick={handleExport}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <FaFileExport />
          Export Monthly
        </button>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto bg-white shadow rounded">
        <table className="min-w-full text-xs text-center border-collapse">
          <thead className="bg-gray-200">
            <tr>
              <th className="p-2 border">Employee ID</th>
              <th className="p-2 border">Employee Name</th>

              {dateColumns.map((date) => (
                <th key={date} className="p-2 border">
                  {new Date(date).getDate()}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={dateColumns.length + 2}>
                  Loading...
                </td>
              </tr>
            ) : Object.values(groupedData).length === 0 ? (
              <tr>
                <td colSpan={dateColumns.length + 2}>
                  No records found
                </td>
              </tr>
            ) : (
              Object.values(groupedData).map((emp) => (
                <tr key={emp.employeeId} className="border-t">
                  <td className="p-2 border font-semibold">
                    {emp.employeeId}
                  </td>

                  <td className="p-2 border font-semibold">
                    {emp.name}
                  </td>

                  {dateColumns.map((date) => {
                    const record = emp.records[date];

                    return (
                      <td key={date} className="p-1 border">
                        {record ? (
                          <div className="text-[10px] leading-tight">
                            <div className="text-green-600">
                              In:{" "}
                              {record.checkIn
                                ? new Date(
                                    record.checkIn
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "--"}
                            </div>

                            <div className="text-blue-600">
                              Out:{" "}
                              {record.checkOut
                                ? new Date(
                                    record.checkOut
                                  ).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "--"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-red-500 font-bold">
                            —
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeManagement;
