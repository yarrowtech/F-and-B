import React, { useEffect, useMemo, useState } from "react";

/* ---------------------------------------------------
   Demo: read the logged-in user from localStorage
   - Set localStorage.setItem("auth.user", JSON.stringify({...}))
   - Or pass <CheifProfile user={...} />
--------------------------------------------------- */
function useLoggedInUser() {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("auth.user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "auth.user") {
        try {
          setUser(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {
          setUser(null);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return user;
}

/* ---------------- Helpers ---------------- */
const cn = (...xs) => xs.filter(Boolean).join(" ");
const formatINR = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const initials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/* ---------------- Component ---------------- */
const CheifProfile = ({
  user: userProp,
  payments: paymentsProp,     // optional override
  attendance: attendanceProp, // optional override
}) => {
  // 1) Logged-in user (prop > localStorage > default)
  const logged = useLoggedInUser();
  const profile = userProp ?? logged ?? {
    id: "CH12345",
    name: "John Doe",
    designation: "cheif",
    department: "Kitchen",
    email: "john.doe@example.com",
    phone: "+91 9876543210",
    dateOfJoining: "01-Jan-2025",
  };

  // 2) Mock source if not provided; replace with real data as needed
  const payments = paymentsProp ?? [
    { month: "Jan", year: 2025, basic: 50000, allowances: 10000, deductions: 5000 },
    { month: "Feb", year: 2025, basic: 50000, allowances: 10000, deductions: 5000 },
    { month: "Mar", year: 2025, basic: 50000, allowances: 12000, deductions: 5000 },
  ];

  const attendance = attendanceProp ?? [
    { month: "Jan", year: 2025, present: 26, absent: 2, leaves: 2 },
    { month: "Feb", year: 2025, present: 24, absent: 4, leaves: 2 },
    { month: "Mar", year: 2025, present: 28, absent: 2, leaves: 0 },
  ];

  const [tab, setTab] = useState("id");

  // --- Derived: payments
  const paymentsWithNet = useMemo(
    () => payments.map((p) => ({ ...p, net: p.basic + p.allowances - p.deductions })),
    [payments]
  );
  const latestPayment = paymentsWithNet[paymentsWithNet.length - 1];
  const yearlyNet = useMemo(
    () => paymentsWithNet.reduce((sum, p) => sum + p.net, 0),
    [paymentsWithNet]
  );

  // --- Derived: attendance
  const totals = useMemo(
    () =>
      attendance.reduce(
        (acc, a) => ({
          present: acc.present + a.present,
          absent: acc.absent + a.absent,
          leaves: acc.leaves + a.leaves,
        }),
        { present: 0, absent: 0, leaves: 0 }
      ),
    [attendance]
  );
  const latestAtt = attendance[attendance.length - 1] ?? { present: 0, absent: 0, leaves: 0 };
  const totalDays = totals.present + totals.absent + totals.leaves;
  const presentPct = totalDays ? Math.round((totals.present / totalDays) * 100) : 0;

  // --- UI bits
  const tabs = [
    { key: "id", label: "Employee ID" },
    { key: "payment", label: "Payment" },
    { key: "details", label: "Employee Details" },
    { key: "attendance", label: "Attendance" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      {/* Header / Hero (Mobile-friendly) */}
      <header className="sticky top-0 z-20 border-b bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-gray-900/80">
        <div className="mx-auto flex max-w-5xl items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            {initials(profile.name)}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold sm:text-2xl">
              Cheif Profile
            </h1>
            <p className="truncate text-xs text-gray-600 dark:text-gray-300">
              Welcome, {profile.name || "-"} — {profile.designation || "cheif"}
            </p>
          </div>
        </div>

        {/* Tabs — scrollable on mobile */}
        <nav
          role="tablist"
          aria-label="cheif profile sections"
          className="mx-auto max-w-5xl overflow-x-auto border-t border-neutral-200 px-2 dark:border-neutral-800"
        >
          <div className="flex gap-1 py-2">
            {tabs.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={active}
                  aria-controls={`panel-${t.key}`}
                  id={`tab-${t.key}`}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium outline-none",
                    active
                      ? "border-b-2 border-green-600 text-green-700 dark:text-green-400"
                      : "text-neutral-700 hover:text-green-700 dark:text-neutral-300 dark:hover:text-green-400"
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl p-4 sm:p-6">
        {tab === "id" && (
          <section
            id="panel-id"
            role="tabpanel"
            aria-labelledby="tab-id"
            className="space-y-4"
          >
            <div className="flex flex-col gap-2">
              <h2 className="text-base font-semibold sm:text-lg">Employee ID</h2>
              <p className="w-fit rounded-md border border-green-300 bg-green-50 px-3 py-1.5 text-sm text-green-700 dark:border-green-700/40 dark:bg-green-900/30 dark:text-green-300">
                {profile.id || "-"}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Card label="Name" value={profile.name} />
              <Card label="Designation" value={profile.designation || "cheif"} />
              <Card label="Department" value={profile.department || "Kitchen"} />
            </div>
          </section>
        )}

        {tab === "payment" && (
          <section
            id="panel-payment"
            role="tabpanel"
            aria-labelledby="tab-payment"
            className="space-y-5"
          >
            <h2 className="text-base font-semibold sm:text-lg">Payment</h2>

            {/* KPIs */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card
                label="Latest Net Pay"
                value={formatINR(latestPayment?.net || 0)}
                helper={`${latestPayment?.month ?? "-"} ${latestPayment?.year ?? ""}`}
                valueClass="text-2xl"
              />
              <Card
                label="Year-to-Date Net"
                value={formatINR(yearlyNet)}
                valueClass="text-2xl"
              />
              <Card
                label="Months Paid"
                value={paymentsWithNet.length}
                valueClass="text-2xl"
              />
            </div>

            {/* Table */}
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
                  {paymentsWithNet.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-3 text-center text-neutral-500">
                        No payment records
                      </td>
                    </tr>
                  ) : (
                    paymentsWithNet.map((p, idx) => (
                      <tr
                        key={`${p.month}-${p.year}-${idx}`}
                        className={idx % 2 ? "bg-neutral-50/60 dark:bg-neutral-800" : "bg-white dark:bg-neutral-900"}
                      >
                        <Td>{p.month}</Td>
                        <Td>{p.year}</Td>
                        <Td>{formatINR(p.basic)}</Td>
                        <Td>{formatINR(p.allowances)}</Td>
                        <Td>{formatINR(p.deductions)}</Td>
                        <Td className="font-semibold">{formatINR(p.net)}</Td>
                      </tr>
                    ))
                  )}
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
          </section>
        )}

        {tab === "details" && (
          <section
            id="panel-details"
            role="tabpanel"
            aria-labelledby="tab-details"
            className="grid gap-5 md:grid-cols-2"
          >
            <div className="rounded-xl border bg-white p-5 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
              <h3 className="mb-3 text-base font-semibold sm:text-lg">Employee Details</h3>
              <dl className="grid grid-cols-3 gap-y-2 text-sm">
                <Dt>Name</Dt><Dd>{profile.name || "-"}</Dd>
                <Dt>Designation</Dt><Dd>{profile.designation || "cheif"}</Dd>
                <Dt>Department</Dt><Dd>{profile.department || "-"}</Dd>
                <Dt>Email</Dt>
                <Dd>
                  {profile.email ? (
                    <a className="text-green-700 hover:underline dark:text-green-400" href={`mailto:${profile.email}`}>
                      {profile.email}
                    </a>
                  ) : "-"}
                </Dd>
                <Dt>Phone</Dt>
                <Dd>
                  {profile.phone ? (
                    <a className="text-green-700 hover:underline dark:text-green-400" href={`tel:${profile.phone}`}>
                      {profile.phone}
                    </a>
                  ) : "-"}
                </Dd>
                <Dt>Date of Joining</Dt><Dd>{profile.dateOfJoining || "-"}</Dd>
              </dl>
            </div>
          </section>
        )}

        {tab === "attendance" && (
          <section
            id="panel-attendance"
            role="tabpanel"
            aria-labelledby="tab-attendance"
            className="space-y-5"
          >
            <h2 className="text-base font-semibold sm:text-lg">Attendance</h2>

            {/* KPIs */}
            <div className="grid gap-4 sm:grid-cols-5">
              <Card label="Today" value="present" />
              <Card label="Monthly Present" value={latestAtt.present} />
              <Card label="Yearly Present" value={totals.present} />
              <Card label="Total Leaves" value={totals.leaves} />
              <div
                className={cn(
                  "rounded-xl border p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800",
                  presentPct < 90 ? "bg-red-50 dark:bg-red-900/30" : "bg-white"
                )}
              >
                <p className="text-sm text-neutral-600 dark:text-neutral-300">Attendance %</p>
                <p
                  className={cn(
                    "mt-1 text-2xl font-semibold",
                    presentPct < 90 ? "text-red-600 dark:text-red-400" : ""
                  )}
                >
                  {presentPct}%
                </p>
              </div>
            </div>

            {/* Table */}
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
                  {attendance.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-3 text-center text-neutral-500">
                        No attendance records
                      </td>
                    </tr>
                  ) : (
                    attendance.map((a, idx) => (
                      <tr
                        key={`${a.month}-${a.year}-${idx}`}
                        className={idx % 2 ? "bg-neutral-50/60 dark:bg-neutral-800" : "bg-white dark:bg-neutral-900"}
                      >
                        <Td>{a.month}</Td>
                        <Td>{a.year}</Td>
                        <Td>{a.present}</Td>
                        <Td>{a.absent}</Td>
                        <Td>{a.leaves}</Td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-neutral-50 text-sm dark:bg-neutral-700/50">
                  <tr>
                    <td className="px-4 py-2 font-medium" colSpan={2}>Totals</td>
                    <td className="px-4 py-2 font-semibold">{totals.present}</td>
                    <td className="px-4 py-2 font-semibold">{totals.absent}</td>
                    <td className="px-4 py-2 font-semibold">{totals.leaves}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

/* ---------- Small presentational bits ---------- */
const Card = ({ label, value, helper, valueClass = "text-xl" }) => (
  <div className="rounded-xl border bg-white p-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
    <p className="text-sm text-neutral-600 dark:text-neutral-300">{label}</p>
    <p className={cn("mt-1 font-semibold", valueClass)}>{value ?? "-"}</p>
    {helper && <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{helper}</p>}
  </div>
);

const Th = ({ children }) => (
  <th className="px-4 py-2 font-medium text-neutral-700 dark:text-neutral-200">{children}</th>
);
const Td = ({ children, className }) => (
  <td className={cn("px-4 py-2 text-neutral-800 dark:text-neutral-100", className)}>{children}</td>
);
const Dt = ({ children }) => (
  <dt className="text-neutral-600 dark:text-neutral-300">{children}</dt>
);
const Dd = ({ children }) => <dd className="col-span-2 font-medium">{children}</dd>;

export default CheifProfile;
