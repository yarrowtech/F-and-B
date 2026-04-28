import React, { useMemo, useState } from "react";

/* ---------------- Mock Data (swap with API later) ---------------- */
const employeeData = {
  id: "SUCH12345",
  name: "John Smith",
  designation: "Su cheif",
  department: "Kitchen",
  email: "john.smith@example.com",
  phone: "+91 9876543210",
  dateOfJoining: "01-Jan-2025",
};

const paymentHistory = [
  { month: "Jan", year: 2025, basic: 50000, allowances: 10000, deductions: 5000 },
  { month: "Feb", year: 2025, basic: 50000, allowances: 10000, deductions: 5000 },
  { month: "Mar", year: 2025, basic: 50000, allowances: 12000, deductions: 5000 },
];

const attendanceData = [
  { month: "Jan", year: 2025, present: 22, absent: 6, leaves: 3 },
  { month: "Feb", year: 2025, present: 25, absent: 3, leaves: 2 },
  { month: "Mar", year: 2025, present: 27, absent: 2, leaves: 1 },
];

/* ---------------- Helpers ---------------- */
const formatINR = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;
const classNames = (...xs) => xs.filter(Boolean).join(" ");

/* ---------------- Component ---------------- */
const SucheifProfile = () => {
  const [activeTab, setActiveTab] = useState("employeeId");

  // Payment totals
  const paymentWithNet = useMemo(
    () =>
      paymentHistory.map((p) => ({
        ...p,
        net: p.basic + p.allowances - p.deductions,
      })),
    []
  );

  const latestPayment = paymentWithNet[paymentWithNet.length - 1];

  const yearlyNet = useMemo(
    () => paymentWithNet.reduce((acc, p) => acc + p.net, 0),
    [paymentWithNet]
  );

  // Attendance totals
  const attendanceTotals = useMemo(
    () =>
      attendanceData.reduce(
        (acc, a) => ({
          present: acc.present + a.present,
          absent: acc.absent + a.absent,
          leaves: acc.leaves + a.leaves,
        }),
        { present: 0, absent: 0, leaves: 0 }
      ),
    []
  );

  const latestAttendance = attendanceData[attendanceData.length - 1] || { present: 0, absent: 0, leaves: 0 };
  const totalWorkingDays = attendanceTotals.present + attendanceTotals.absent + attendanceTotals.leaves;
  const presentPct = totalWorkingDays ? Math.round((attendanceTotals.present / totalWorkingDays) * 100) : 0;

  /* -------------- Render sections -------------- */
  const renderEmployeeId = () => (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Employee ID</h2>
      <p className="inline-flex w-fit items-center gap-2 rounded-md border border-green-300 bg-green-50 px-3 py-1.5 text-green-700 dark:border-green-700/40 dark:bg-green-900/30 dark:text-green-300">
        <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
        {employeeData.id}
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-300">Name</p>
          <p className="font-medium">{employeeData.name}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-300">Designation</p>
          <p className="font-medium">{employeeData.designation}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-300">Department</p>
          <p className="font-medium">{employeeData.department}</p>
        </div>
      </div>
    </div>
  );

  const renderPayment = () => (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold">Payment</h2>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-300">Latest Net Pay</p>
          <p className="mt-1 text-2xl font-semibold">{formatINR(latestPayment?.net || 0)}</p>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {latestPayment?.month} {latestPayment?.year}
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-300">Year-to-Date Net</p>
          <p className="mt-1 text-2xl font-semibold">{formatINR(yearlyNet)}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-300">Months Paid</p>
          <p className="mt-1 text-2xl font-semibold">{paymentWithNet.length}</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
        <table className="min-w-full text-left">
          <thead className="bg-neutral-50 text-sm dark:bg-neutral-700/50">
            <tr>
              <th className="px-4 py-2">Month</th>
              <th className="px-4 py-2">Year</th>
              <th className="px-4 py-2">Basic</th>
              <th className="px-4 py-2">Allowances</th>
              <th className="px-4 py-2">Deductions</th>
              <th className="px-4 py-2">Net Pay</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {paymentWithNet.map((p, idx) => (
              <tr
                key={`${p.month}-${p.year}-${idx}`}
                className={classNames(idx % 2 ? "bg-neutral-50/60 dark:bg-neutral-800" : "bg-white dark:bg-neutral-900")}
              >
                <td className="px-4 py-2">{p.month}</td>
                <td className="px-4 py-2">{p.year}</td>
                <td className="px-4 py-2">{formatINR(p.basic)}</td>
                <td className="px-4 py-2">{formatINR(p.allowances)}</td>
                <td className="px-4 py-2">{formatINR(p.deductions)}</td>
                <td className="px-4 py-2 font-semibold">{formatINR(p.net)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-neutral-50 text-sm dark:bg-neutral-700/50">
            <tr>
              <td className="px-4 py-2 font-medium" colSpan={5}>
                Total (Net)
              </td>
              <td className="px-4 py-2 font-semibold">{formatINR(yearlyNet)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );

  const renderEmployeeDetails = () => (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="rounded-xl border bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
        <h2 className="mb-3 text-lg font-semibold">Employee Details</h2>
        <dl className="grid grid-cols-3 gap-y-2 text-sm">
          <dt className="text-neutral-500 dark:text-neutral-300">Name</dt>
          <dd className="col-span-2 font-medium">{employeeData.name}</dd>

          <dt className="text-neutral-500 dark:text-neutral-300">Designation</dt>
          <dd className="col-span-2 font-medium">{employeeData.designation}</dd>

          <dt className="text-neutral-500 dark:text-neutral-300">Department</dt>
          <dd className="col-span-2 font-medium">{employeeData.department}</dd>

          <dt className="text-neutral-500 dark:text-neutral-300">Email</dt>
          <dd className="col-span-2 font-medium">{employeeData.email}</dd>

          <dt className="text-neutral-500 dark:text-neutral-300">Phone</dt>
          <dd className="col-span-2 font-medium">{employeeData.phone}</dd>

          <dt className="text-neutral-500 dark:text-neutral-300">Date of Joining</dt>
          <dd className="col-span-2 font-medium">{employeeData.dateOfJoining}</dd>
        </dl>
      </div>
    </div>
  );

  const renderAttendance = () => (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold">Attendance</h2>

      <div className="grid gap-4 sm:grid-cols-5">
        <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-300">Today</p>
          <p className="mt-1 text-2xl font-semibold">Present</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-300">Monthly Present</p>
          <p className="mt-1 text-2xl font-semibold">{latestAttendance.present}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-300">Yearly Present</p>
          <p className="mt-1 text-2xl font-semibold">{attendanceTotals.present}</p>
        </div>
        <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
          <p className="text-sm text-neutral-500 dark:text-neutral-300">Total Leaves</p>
          <p className="mt-1 text-2xl font-semibold">{attendanceTotals.leaves}</p>
        </div>
        <div
          className={classNames(
            "rounded-xl border p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800",
            presentPct < 90 ? "bg-red-50 dark:bg-red-900/30" : "bg-white"
          )}
        >
          <p className="text-sm text-neutral-500 dark:text-neutral-300">Attendance %</p>
          <p
            className={classNames(
              "mt-1 text-2xl font-semibold",
              presentPct < 90 ? "text-red-600 dark:text-red-400" : ""
            )}
          >
            {presentPct}%
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
        <table className="min-w-full text-left">
          <thead className="bg-neutral-50 text-sm dark:bg-neutral-700/50">
            <tr>
              <th className="px-4 py-2">Month</th>
              <th className="px-4 py-2">Year</th>
              <th className="px-4 py-2">Present</th>
              <th className="px-4 py-2">Absent</th>
              <th className="px-4 py-2">Leaves</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {attendanceData.map((a, idx) => (
              <tr
                key={`${a.month}-${a.year}-${idx}`}
                className={classNames(idx % 2 ? "bg-neutral-50/60 dark:bg-neutral-800" : "bg-white dark:bg-neutral-900")}
              >
                <td className="px-4 py-2">{a.month}</td>
                <td className="px-4 py-2">{a.year}</td>
                <td className="px-4 py-2">{a.present}</td>
                <td className="px-4 py-2">{a.absent}</td>
                <td className="px-4 py-2">{a.leaves}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-neutral-50 text-sm dark:bg-neutral-700/50">
            <tr>
              <td className="px-4 py-2 font-medium" colSpan={2}>
                Totals
              </td>
              <td className="px-4 py-2 font-semibold">{attendanceTotals.present}</td>
              <td className="px-4 py-2 font-semibold">{attendanceTotals.absent}</td>
              <td className="px-4 py-2 font-semibold">{attendanceTotals.leaves}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
        <h3 className="text-lg font-semibold mb-3">Leave Requests</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">No leave requests pending.</p>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "employeeId":
        return renderEmployeeId();
      case "payment":
        return renderPayment();
      case "employeeDetails":
        return renderEmployeeDetails();
      case "attendance":
        return renderAttendance();
      default:
        return null;
    }
  };

  /* -------------- UI -------------- */
  const tabs = [
    { key: "employeeId", label: "Employee ID" },
    { key: "payment", label: "Payment" },
    { key: "employeeDetails", label: "Employee Details" },
    { key: "attendance", label: "Attendance" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-900 sm:p-6 print:bg-white">
      <header className="sticky top-0 z-10 mb-4 border-b bg-gray-50/80 backdrop-blur dark:border-neutral-800 dark:bg-gray-900/80 print:static print:border-none print:bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sucheif Profile</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Welcome, {employeeData.name} — {employeeData.designation}
            </p>
          </div>
        </div>

        <nav
          role="tablist"
          aria-label="Su cheif profile sections"
          className="mx-auto flex max-w-5xl flex-wrap gap-1 border-t border-neutral-200 pt-2 dark:border-neutral-800"
        >
          {tabs.map((t) => {
            const selected = activeTab === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={selected}
                aria-controls={`panel-${t.key}`}
                id={`tab-${t.key}`}
                className={classNames(
                  "rounded-md px-3 py-2 text-sm font-medium outline-none",
                  selected
                    ? "border-b-2 border-green-600 text-green-700 dark:text-green-400"
                    : "text-neutral-600 hover:text-green-700 dark:text-neutral-300 dark:hover:text-green-400"
                )}
                onClick={() => setActiveTab(t.key)}
                onKeyDown={(e) => {
                  const idx = tabs.findIndex((x) => x.key === activeTab);
                  if (e.key === "ArrowRight") setActiveTab(tabs[(idx + 1) % tabs.length].key);
                  if (e.key === "ArrowLeft") setActiveTab(tabs[(idx - 1 + tabs.length) % tabs.length].key);
                }}
              >
                {t.label}
              </button>
            );
          })}
        </nav>
      </header>

      <main
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="mx-auto mt-4 max-w-5xl"
      >
        {renderContent()}
      </main>
    </div>
  );
};

export default SucheifProfile;
