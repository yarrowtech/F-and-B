import React, { useMemo, useState } from "react";

/* ------------------------------------------------------------------ */
/* Defaults (works out of the box; swap with real API data later)     */
/* ------------------------------------------------------------------ */
const DEFAULT_EMPLOYEE = {
  id: "AC98765",
  name: "Rahul Verma",
  designation: "Accountant",
  department: "Accounts",
  email: "rahul.verma@example.com",
  phone: "+91 9876543210",
  dateOfJoining: "15-Feb-2023",
};

const DEFAULT_PAYMENTS = [
  { month: "Jan", year: 2025, basic: 48000, allowances: 7000, deductions: 3500 },
  { month: "Feb", year: 2025, basic: 48000, allowances: 7200, deductions: 3500 },
  { month: "Mar", year: 2025, basic: 48000, allowances: 7500, deductions: 3500 },
];

const DEFAULT_ATTENDANCE = [
  { month: "Jan", year: 2025, present: 25, absent: 2, leaves: 2 },
  { month: "Feb", year: 2025, present: 24, absent: 3, leaves: 1 },
  { month: "Mar", year: 2025, present: 26, absent: 2, leaves: 1 },
];

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
const monthOrder = { Jan:1, Feb:2, Mar:3, Apr:4, May:5, Jun:6, Jul:7, Aug:8, Sep:9, Oct:10, Nov:11, Dec:12 };
const formatINR = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN")}`;
const cn = (...xs) => xs.filter(Boolean).join(" ");

const Th = ({ children }) => <th className="px-4 py-2 font-medium text-neutral-700 dark:text-neutral-200">{children}</th>;
const Td = ({ children, className }) => <td className={cn("px-4 py-2", className)}>{children}</td>;

const InfoCard = ({ label, value }) => (
  <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
    <p className="text-sm text-neutral-500 dark:text-neutral-300">{label}</p>
    <p className="mt-0.5 font-medium">{value ?? "—"}</p>
  </div>
);

const StatCard = ({ label, value, sub }) => (
  <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
    <p className="text-sm text-neutral-500 dark:text-neutral-300">{label}</p>
    <p className="mt-1 text-2xl font-semibold">{value}</p>
    {sub ? <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{sub}</p> : null}
  </div>
);

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
const AccountantProfile = ({
  employee = DEFAULT_EMPLOYEE,
  payments = DEFAULT_PAYMENTS,
  attendance = DEFAULT_ATTENDANCE,
  initialTab = "employeeId",
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);

  // Defensive ordering
  const paymentsSorted = useMemo(
    () => [...payments].sort((a, b) => a.year - b.year || monthOrder[a.month] - monthOrder[b.month]),
    [payments]
  );
  const attendanceSorted = useMemo(
    () => [...attendance].sort((a, b) => a.year - b.year || monthOrder[a.month] - monthOrder[b.month]),
    [attendance]
  );

  // Payments with net & aggregates
  const paymentWithNet = useMemo(
    () =>
      paymentsSorted.map((p) => ({
        ...p,
        net: (p.basic || 0) + (p.allowances || 0) - (p.deductions || 0),
      })),
    [paymentsSorted]
  );
  const latestPayment = paymentWithNet[paymentWithNet.length - 1];
  const yearlyNet = useMemo(
    () => paymentWithNet.reduce((acc, p) => acc + (p.net || 0), 0),
    [paymentWithNet]
  );

  // Attendance totals & percentage
  const attendanceTotals = useMemo(
    () =>
      attendanceSorted.reduce(
        (acc, a) => ({
          present: acc.present + (a.present || 0),
          absent: acc.absent + (a.absent || 0),
          leaves: acc.leaves + (a.leaves || 0),
        }),
        { present: 0, absent: 0, leaves: 0 }
      ),
    [attendanceSorted]
  );
  const totalWorkingDays =
    attendanceTotals.present + attendanceTotals.absent + attendanceTotals.leaves;
  const presentPct = totalWorkingDays
    ? Math.round((attendanceTotals.present / totalWorkingDays) * 100)
    : 0;

  const latestAttendance = attendanceSorted[attendanceSorted.length - 1] ?? {
    present: 0,
    absent: 0,
    leaves: 0,
  };

  /* ----------------------------- Sections --------------------------- */
  const renderEmployeeId = () => (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">Employee ID</h2>
      <p className="inline-flex w-fit items-center gap-2 rounded-md border border-green-300 bg-green-50 px-3 py-1.5 text-green-700 dark:border-green-700/40 dark:bg-green-900/30 dark:text-green-300">
        <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
        {employee.id}
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <InfoCard label="Name" value={employee.name} />
        <InfoCard label="Designation" value={employee.designation} />
        <InfoCard label="Department" value={employee.department} />
      </div>
    </div>
  );

  const renderPayment = () => (
    <div className="flex flex-col gap-5">
      <h2 className="text-lg font-semibold">Payment</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Latest Net Pay"
          value={formatINR(latestPayment?.net || 0)}
          sub={`${latestPayment?.month ?? ""} ${latestPayment?.year ?? ""}`}
        />
        <StatCard label="Year-to-Date Net" value={formatINR(yearlyNet)} />
        <StatCard label="Months Paid" value={paymentWithNet.length} />
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
        <table className="min-w-full text-left">
          <thead className="bg-neutral-50 text-sm dark:bg-neutral-700/50">
            <tr>
              <Th>Month</Th>
              <Th>Year</Th>
              <Th>Basic</Th>
              <Th>Allowances</Th>
              <Th>Deductions</Th>
              <Th>Net Pay</Th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {paymentWithNet.map((p, idx) => (
              <tr
                key={`${p.month}-${p.year}-${idx}`}
                className={cn(
                  idx % 2 ? "bg-neutral-50/60 dark:bg-neutral-800" : "bg-white dark:bg-neutral-900"
                )}
              >
                <Td>{p.month}</Td>
                <Td>{p.year}</Td>
                <Td>{formatINR(p.basic)}</Td>
                <Td>{formatINR(p.allowances)}</Td>
                <Td>{formatINR(p.deductions)}</Td>
                <Td className="font-semibold">{formatINR(p.net)}</Td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-neutral-50 text-sm dark:bg-neutral-700/50">
            <tr>
              <Td className="font-medium" colSpan={5}>
                Total (Net)
              </Td>
              <Td className="font-semibold">{formatINR(yearlyNet)}</Td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );

  const renderEmployeeDetails = () => (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="rounded-xl border bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
        <h2 className="mb-3 text-lg font-semibold">Accountant Details</h2>
        <dl className="grid grid-cols-3 gap-y-2 text-sm">
          <dt className="text-neutral-500 dark:text-neutral-300">Name</dt>
          <dd className="col-span-2 font-medium">{employee.name}</dd>

          <dt className="text-neutral-500 dark:text-neutral-300">Designation</dt>
          <dd className="col-span-2 font-medium">{employee.designation}</dd>

          <dt className="text-neutral-500 dark:text-neutral-300">Department</dt>
          <dd className="col-span-2 font-medium">{employee.department}</dd>

          <dt className="text-neutral-500 dark:text-neutral-300">Email</dt>
          <dd className="col-span-2 font-medium">{employee.email}</dd>

          <dt className="text-neutral-500 dark:text-neutral-300">Phone</dt>
          <dd className="col-span-2 font-medium">{employee.phone}</dd>

          <dt className="text-neutral-500 dark:text-neutral-300">Date of Joining</dt>
          <dd className="col-span-2 font-medium">{employee.dateOfJoining}</dd>
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
          <p className="mt-1 text-2xl font-semibold">—</p>
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
          className={cn(
            "rounded-xl border p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800",
            presentPct < 90 ? "bg-red-50 dark:bg-red-900/30" : "bg-white"
          )}
        >
          <p className="text-sm text-neutral-500 dark:text-neutral-300">Attendance %</p>
          <p className={cn("mt-1 text-2xl font-semibold", presentPct < 90 && "text-red-600 dark:text-red-400")}>
            {presentPct}%
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
        <table className="min-w-full text-left">
          <thead className="bg-neutral-50 text-sm dark:bg-neutral-700/50">
            <tr>
              <Th>Month</Th>
              <Th>Year</Th>
              <Th>Present</Th>
              <Th>Absent</Th>
              <Th>Leaves</Th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {attendanceSorted.map((a, idx) => (
              <tr
                key={`${a.month}-${a.year}-${idx}`}
                className={cn(
                  idx % 2 ? "bg-neutral-50/60 dark:bg-neutral-800" : "bg-white dark:bg-neutral-900"
                )}
              >
                <Td>{a.month}</Td>
                <Td>{a.year}</Td>
                <Td>{a.present}</Td>
                <Td>{a.absent}</Td>
                <Td>{a.leaves}</Td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-neutral-50 text-sm dark:bg-neutral-700/50">
            <tr>
              <Td className="font-medium" colSpan={2}>
                Totals
              </Td>
              <Td className="font-semibold">{attendanceTotals.present}</Td>
              <Td className="font-semibold">{attendanceTotals.absent}</Td>
              <Td className="font-semibold">{attendanceTotals.leaves}</Td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );

  const tabs = [
    { key: "employeeId", label: "Accountant ID" },
    { key: "payment", label: "Payment" },
    { key: "employeeDetails", label: "Accountant Details" },
    { key: "attendance", label: "Attendance" },
  ];

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

  /* ------------------------------- UI -------------------------------- */
  return (
    <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-900 sm:p-6 print:bg-white">
      <header className="sticky top-0 z-10 mb-4 border-b bg-gray-50/80 backdrop-blur dark:border-neutral-800 dark:bg-gray-900/80 print:static print:border-none print:bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Accountant Profile</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Welcome, {employee.name} — {employee.designation}
            </p>
          </div>
        </div>

        <nav
          role="tablist"
          aria-label="Accountant profile sections"
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
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium outline-none",
                  selected
                    ? "border-b-2 border-green-600 text-green-700 dark:text-green-400"
                    : "text-neutral-600 hover:text-green-700 dark:text-neutral-300 dark:hover:text-green-400"
                )}
                onClick={() => setActiveTab(t.key)}
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

export default AccountantProfile;



