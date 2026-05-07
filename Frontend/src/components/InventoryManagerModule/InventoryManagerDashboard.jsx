import { useEffect, useState, useCallback } from "react";
import { FaBoxOpen, FaCalendarAlt, FaEdit, FaHistory, FaPlus, FaTrash } from "react-icons/fa";
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

const ACTION_ICON = {
  ADD: <FaPlus />,
  UPDATE: <FaEdit />,
  DELETE: <FaTrash />,
};

const formatDateTime = (value) => (value ? new Date(value).toLocaleString() : "-");

function LogDetailModal({ title, accent, logs, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700">
        <div className={`shrink-0 px-4 py-4 sm:px-6 sm:py-5 ${accent} flex items-center justify-between gap-4`}>
          <h2 className="min-w-0 text-base font-bold text-white sm:text-lg">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-xl leading-none text-white transition-colors hover:bg-white/30"
          >
            x
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="text-center">
              <FaHistory className="mx-auto mb-3 text-4xl text-slate-300 dark:text-neutral-600" />
              <p className="font-medium text-gray-400 dark:text-gray-500">No records found</p>
            </div>
          </div>
        ) : (
          <>
            <div className="shrink-0 border-b border-gray-100 px-4 py-3 dark:border-neutral-700 sm:px-6">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {logs.length} record{logs.length !== 1 ? "s" : ""}
              </span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <div className="grid gap-3 p-4 lg:hidden">
                {logs.map((log, idx) => (
                  <LogMobileCard key={log._id} log={log} index={idx} />
                ))}
              </div>
              <table className="hidden w-full text-sm lg:table">
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
                          {formatDateTime(log.createdAt)}
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

function StatCard({ icon, label, value, tone, onClick, loading, clickable }) {
  const tones = {
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
    amber: "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300",
    rose: "border-rose-100 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300",
  };

  return (
    <button
      onClick={onClick}
      disabled={!clickable || loading}
      className={`group w-full rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-200 transition-all duration-200 dark:bg-neutral-900 dark:ring-neutral-700 sm:p-5 ${clickable ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md" : "cursor-default"}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl border text-lg ${tones[tone]}`}>
            {icon}
          </div>
          {loading ? (
            <div className="mb-2 h-8 w-20 animate-pulse rounded-lg bg-slate-200 dark:bg-neutral-700" />
          ) : (
            <p className="mb-1 text-3xl font-extrabold text-slate-900 dark:text-white">{value ?? "-"}</p>
          )}
          <p className="text-sm font-semibold text-slate-500 dark:text-neutral-400">{label}</p>
        </div>
        <div>
          {clickable ? (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-600 transition-colors group-hover:bg-slate-900 group-hover:text-white dark:bg-neutral-800 dark:text-neutral-300">
              View
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function EmptyState({ children }) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center px-5 py-10 text-center">
      <FaHistory className="mb-3 text-4xl text-slate-300 dark:text-neutral-600" />
      <p className="text-sm font-medium text-slate-400 dark:text-neutral-500">{children}</p>
    </div>
  );
}

function LogMobileCard({ log, index }) {
  const meta = ACTION_META[log.action] || ACTION_META.ADD;
  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-neutral-500">#{index + 1}</p>
          <p className="mt-1 text-base font-bold text-slate-900 dark:text-white">{log.item?.name || "-"}</p>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${meta.bg} ${meta.text}`}>
          {ACTION_ICON[log.action] || ACTION_ICON.ADD}
          {meta.label}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-sm dark:bg-neutral-800">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-neutral-500">Qty Change</p>
          <p className={`mt-1 font-bold ${log.quantityAdded >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {log.quantityAdded > 0 ? "+" : ""}
            {log.quantityAdded}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400 dark:text-neutral-500">Unit</p>
          <p className="mt-1 font-semibold text-slate-700 dark:text-neutral-200">{log.unit || "-"}</p>
        </div>
      </div>

      <p className="mt-3 text-xs font-medium text-slate-400 dark:text-neutral-500">
        {formatDateTime(log.createdAt)}
      </p>
    </article>
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
    <div className="min-h-screen bg-slate-50 p-3 dark:bg-neutral-950 sm:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">
                <FaBoxOpen />
                Inventory Activity
              </div>
              <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">Inventory Dashboard</h1>
              <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-neutral-400">
                <FaCalendarAlt className="text-emerald-600 dark:text-emerald-300" />
                {today}
              </p>
            </div>

            <div className="rounded-xl bg-emerald-50 px-4 py-3 dark:bg-emerald-950/40">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Current Range</p>
              <p className="mt-1 text-sm font-bold text-emerald-900 dark:text-emerald-100 sm:text-base">{periodLabel}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="shrink-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Filter Activity</p>
              <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">Choose your time range</p>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {PERIODS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setPeriod(key)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all ${period === key ? "bg-emerald-600 text-white shadow" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-neutral-800 dark:text-gray-300 dark:hover:bg-neutral-700"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {period === "custom" ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[170px_170px_auto]">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-gray-400 dark:text-gray-500">From</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold text-gray-400 dark:text-gray-500">To</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
                  />
                </div>
                  <button
                    onClick={loadStats}
                    disabled={!fromDate || !toDate || loading}
                  className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-700 sm:col-span-2 xl:col-span-1 xl:self-end"
                  >
                    Apply
                  </button>
                </div>
              ) : null}
          </div>
        </div>

        {error ? (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-600 dark:border-rose-800 dark:bg-rose-900/20 dark:text-rose-400">
            <span>[!]</span> {error}
          </div>
        ) : null}

        <div>
          <p className="mb-3 px-1 text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            {periodLabel}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard
              icon={<FaPlus />}
              label="Stock Added"
              value={stats?.addCount}
              tone="emerald"
              loading={loading}
              clickable={!!stats}
              onClick={stats ? () => openModal(`Stock Added - ${periodLabel}`, "bg-emerald-600", stats.addLogs) : null}
            />
            <StatCard
              icon={<FaEdit />}
              label="Items Edited"
              value={stats?.updateCount}
              tone="amber"
              loading={loading}
              clickable={!!stats}
              onClick={stats ? () => openModal(`Items Edited - ${periodLabel}`, "bg-amber-500", stats.updateLogs) : null}
            />
            <StatCard
              icon={<FaTrash />}
              label="Items Deleted"
              value={stats?.deleteCount}
              tone="rose"
              loading={loading}
              clickable={!!stats}
              onClick={stats ? () => openModal(`Items Deleted - ${periodLabel}`, "bg-rose-600", stats.deleteLogs) : null}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700">
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 bg-slate-50/80 px-4 py-4 dark:border-neutral-700 dark:bg-neutral-900 sm:px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                <FaHistory />
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

          <div className="lg:hidden">
            {loading ? (
              <div className="grid gap-3 p-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-100 dark:bg-neutral-800" />
                ))}
              </div>
            ) : !stats || stats.allLogs?.length === 0 ? (
              <EmptyState>No activity found for this period</EmptyState>
            ) : (
              <div className="grid gap-3 p-4">
                {stats.allLogs.map((log, idx) => (
                  <LogMobileCard key={log._id} log={log} index={idx} />
                ))}
              </div>
            )}
          </div>

          <div className="hidden overflow-x-auto lg:block">
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
                      <FaHistory className="mx-auto mb-3 text-4xl text-slate-300 dark:text-neutral-600" />
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
                          {formatDateTime(log.createdAt)}
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
