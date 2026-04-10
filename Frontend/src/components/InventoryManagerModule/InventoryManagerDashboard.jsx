import { useEffect, useState, useCallback } from "react";
import { getMyInventoryStats } from "../../services/inventory.service";

const ACTION_META = {
  ADD: {
    label: "ADD",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  UPDATE: {
    label: "EDIT",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-400",
  },
  DELETE: {
    label: "DELETE",
    bg: "bg-rose-100 dark:bg-rose-900/30",
    text: "text-rose-700 dark:text-rose-400",
  },
};

function LogDetailModal({ title, accent, logs, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-gray-900">
        <div className={`shrink-0 px-6 py-5 ${accent} flex items-center justify-between`}>
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xl leading-none text-white transition-colors hover:bg-white/30"
          >
            x
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-12">
            <div className="text-center">
              <div className="mb-3 text-5xl">[]</div>
              <p className="font-medium text-gray-400 dark:text-gray-500">No records found</p>
            </div>
          </div>
        ) : (
          <>
            <div className="shrink-0 border-b border-gray-100 px-6 py-3 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {logs.length} record{logs.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                  <tr>
                    <th className="px-5 py-3 text-left font-semibold">#</th>
                    <th className="px-5 py-3 text-left font-semibold">Item</th>
                    <th className="px-5 py-3 text-left font-semibold">Action</th>
                    <th className="px-5 py-3 text-left font-semibold">Qty</th>
                    <th className="px-5 py-3 text-left font-semibold">Unit</th>
                    <th className="px-5 py-3 text-left font-semibold">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                  {logs.map((log, idx) => {
                    const meta = ACTION_META[log.action] || ACTION_META.ADD;
                    return (
                      <tr key={log._id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60">
                        <td className="px-5 py-3.5 font-mono text-xs text-gray-400 dark:text-gray-500">{idx + 1}</td>
                        <td className="px-5 py-3.5 font-semibold text-gray-800 dark:text-gray-100">{log.item?.name || "-"}</td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${meta.bg} ${meta.text}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-gray-800 dark:text-gray-100">
                          <span className={log.quantityAdded >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}>
                            {log.quantityAdded > 0 ? "+" : ""}
                            {log.quantityAdded}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400">{log.unit}</td>
                        <td className="px-5 py-3.5 whitespace-nowrap text-xs text-gray-400 dark:text-gray-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, gradient, onClick, loading, clickable }) {
  return (
    <button
      onClick={onClick}
      disabled={!clickable || loading}
      className={`group relative w-full overflow-hidden rounded-3xl text-left shadow-md transition-all duration-200 ${clickable ? "cursor-pointer hover:-translate-y-1 hover:shadow-xl" : "cursor-default"} ${gradient}`}
    >
      <div className="p-6">
        <div className="mb-5 flex items-start justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-2xl shadow-inner">
            {icon}
          </div>
          {clickable ? (
            <span className="mt-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75 transition-colors group-hover:text-white">
              View
            </span>
          ) : null}
        </div>
        {loading ? (
          <div className="mb-1 h-10 w-20 animate-pulse rounded-lg bg-white/20" />
        ) : (
          <p className="mb-1 text-4xl font-extrabold text-white">{value ?? "-"}</p>
        )}
        <p className="text-sm font-medium text-white/75">{label}</p>
      </div>
      <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-white/5" />
    </button>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-t border-gray-100 dark:border-gray-700">
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div
            className="h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-700"
            style={{ width: `${[30, 80, 50, 40, 40, 90][i]}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

const PERIODS = [
  { key: "today", label: "Today" },
  { key: "7days", label: "Last 7 Days" },
  { key: "month", label: "Last 30 Days" },
  { key: "custom", label: "Custom" },
];

const InventoryManagerDashboard = () => {
  const [period, setPeriod] = useState("today");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState(null);

  const loadStats = useCallback(async () => {
    if (period === "custom" && (!fromDate || !toDate)) return;
    try {
      setLoading(true);
      setError("");
      const data = await getMyInventoryStats({ period, from: fromDate, to: toDate });
      setStats(data);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, [period, fromDate, toDate]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const periodLabel =
    period === "today"
      ? "Today"
      : period === "7days"
        ? "Last 7 Days"
        : period === "month"
          ? "Last 30 Days"
          : fromDate && toDate
            ? `${fromDate} to ${toDate}`
            : "Custom Range";

  const openModal = (title, accent, logs) => setModal({ title, accent, logs });

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="rounded-[28px] bg-gradient-to-r from-slate-900 via-emerald-900 to-teal-700 p-6 text-white shadow-xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <div className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-100">
                Inventory Activity
              </div>
              <h1 className="mt-3 text-3xl font-bold">Inventory Dashboard</h1>
              <p className="mt-2 text-sm text-emerald-50/90">
                Track your stock activity, review add or edit or delete actions, and drill into detailed logs for the selected range.
              </p>
              <p className="mt-3 text-sm font-medium text-emerald-100">{today}</p>
            </div>

            <div className="rounded-3xl bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-100">Current Range</p>
              <p className="mt-2 text-lg font-bold text-white">{periodLabel}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-[130px]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Filter Activity</p>
              <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Choose your time range</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {PERIODS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setPeriod(key)}
                  className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${period === key ? "bg-green-600 text-white shadow-md shadow-green-200 dark:shadow-green-900/30" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"}`}
                >
                  {label}
                </button>
              ))}

              {period === "custom" ? (
                <div className="ml-2 flex flex-wrap items-center gap-2">
                  <label className="text-xs font-semibold text-gray-400 dark:text-gray-500">From</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  <label className="text-xs font-semibold text-gray-400 dark:text-gray-500">To</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    onClick={loadStats}
                    disabled={!fromDate || !toDate || loading}
                    className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                  >
                    Apply
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {error ? (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-600 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-400">
            <span>[!]</span> {error}
          </div>
        ) : null}

        <div>
          <p className="mb-3 px-1 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            {periodLabel}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard
              icon="+"
              label="Stock Added"
              value={stats?.addCount}
              gradient="bg-gradient-to-br from-emerald-500 to-green-600"
              loading={loading}
              clickable={!!stats}
              onClick={stats ? () => openModal(`Stock Added - ${periodLabel}`, "bg-gradient-to-r from-emerald-500 to-green-600", stats.addLogs) : null}
            />
            <StatCard
              icon="E"
              label="Items Edited"
              value={stats?.updateCount}
              gradient="bg-gradient-to-br from-amber-400 to-orange-500"
              loading={loading}
              clickable={!!stats}
              onClick={stats ? () => openModal(`Items Edited - ${periodLabel}`, "bg-gradient-to-r from-amber-400 to-orange-500", stats.updateLogs) : null}
            />
            <StatCard
              icon="D"
              label="Items Deleted"
              value={stats?.deleteCount}
              gradient="bg-gradient-to-br from-rose-500 to-red-600"
              loading={loading}
              clickable={!!stats}
              onClick={stats ? () => openModal(`Items Deleted - ${periodLabel}`, "bg-gradient-to-r from-rose-500 to-red-600", stats.deleteLogs) : null}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between border-b border-gray-100 bg-slate-50/80 px-6 py-5 dark:border-gray-700 dark:bg-gray-800/60">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-green-100 text-lg dark:bg-green-900/30">
                L
              </div>
              <div>
                <h2 className="text-base font-bold leading-tight text-gray-800 dark:text-white">My Activity Log</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500">{periodLabel}</p>
              </div>
            </div>
            {stats?.allLogs?.length > 0 ? (
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-green-700 ring-1 ring-green-100 dark:bg-gray-700 dark:text-green-400 dark:ring-green-900/40">
                {stats.allLogs.length} records
              </span>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[640px] w-full">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500 dark:bg-gray-700/60 dark:text-gray-400">
                <tr>
                  <th className="px-5 py-3.5 text-left font-semibold">#</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Item Name</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Action</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Qty Change</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Unit</th>
                  <th className="px-5 py-3.5 text-left font-semibold">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {loading ? (
                  [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                ) : !stats || stats.allLogs?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center">
                      <div className="mb-3 text-4xl">[]</div>
                      <p className="text-sm font-medium text-gray-400 dark:text-gray-500">No activity found for this period</p>
                    </td>
                  </tr>
                ) : (
                  stats.allLogs.map((log, idx) => {
                    const meta = ACTION_META[log.action] || ACTION_META.ADD;
                    return (
                      <tr key={log._id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40">
                        <td className="px-5 py-4 font-mono text-xs text-gray-400 dark:text-gray-500">{idx + 1}</td>
                        <td className="px-5 py-4 text-sm font-semibold text-gray-800 dark:text-gray-100">{log.item?.name || "-"}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${meta.bg} ${meta.text}`}>
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-sm font-bold ${log.quantityAdded >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                            {log.quantityAdded > 0 ? "+" : ""}
                            {log.quantityAdded}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{log.unit}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-400 dark:text-gray-500">
                          {new Date(log.createdAt).toLocaleString()}
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

      {modal ? (
        <LogDetailModal
          title={modal.title}
          accent={modal.accent}
          logs={modal.logs}
          onClose={() => setModal(null)}
        />
      ) : null}
    </div>
  );
};

export default InventoryManagerDashboard;
