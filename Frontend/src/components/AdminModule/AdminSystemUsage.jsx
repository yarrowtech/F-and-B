import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BellRing,
  CheckCheck,
  CircleSlash,
  Clock,
  RefreshCw,
  ShieldCheck,
  Store,
  UserCircle,
  Users,
} from "lucide-react";
import {
  getAdminSystemUsage,
  markAdminSystemUsageSeen,
} from "../../services/systemUsage.service";
import PushAlertToggle from "../common/PushAlertToggle";

const card =
  "rounded-xl border border-gray-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#171c25]";

const IDLE_OPTIONS = [1, 3, 7, 14, 30];

const fmtAbsolute = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const fmtRelative = (value) => {
  if (!value) return "never";
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "never";
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  const months = Math.round(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
};

const STATUS_META = {
  online: { label: "Online", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" },
  offline: { label: "Offline", cls: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300" },
  idle: { label: "Idle", cls: "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300" },
  never: { label: "Never logged in", cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
};

const StatusPill = ({ status }) => {
  const meta = STATUS_META[status] || STATUS_META.offline;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {meta.label}
    </span>
  );
};

const SummaryCard = ({ title, value, icon: Icon, accent, hint }) => (
  <div className={`${card} p-4`}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {title}
        </p>
        <p className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>
        {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
      </div>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${accent}`}>
        {React.createElement(Icon, { size: 18 })}
      </div>
    </div>
  </div>
);

const AccountRow = ({ acc }) => (
  <tr className="border-t border-gray-100 text-sm dark:border-white/5">
    <td className="py-2.5 pr-3">
      <div className="flex flex-col">
        <span className="font-medium text-gray-800 dark:text-gray-100">{acc.name}</span>
        <span className="text-xs text-gray-400">
          {acc.displayId}
          {acc.role ? ` · ${acc.role}` : ""}
          {acc.restaurantName ? ` · ${acc.restaurantName}` : ""}
          {acc.email ? ` · ${acc.email}` : ""}
          {acc.isActive === false ? " · inactive" : ""}
        </span>
      </div>
    </td>
    <td className="py-2.5 pr-3 whitespace-nowrap text-gray-700 dark:text-gray-200" title={fmtAbsolute(acc.lastLoginAt)}>
      {acc.lastLoginAt ? fmtRelative(acc.lastLoginAt) : "—"}
    </td>
    <td className="py-2.5 pr-3 whitespace-nowrap text-gray-700 dark:text-gray-200" title={fmtAbsolute(acc.lastLogoutAt)}>
      {acc.lastLogoutAt ? fmtRelative(acc.lastLogoutAt) : "—"}
    </td>
    <td className="py-2.5 pr-3 whitespace-nowrap text-gray-500 dark:text-gray-400" title={fmtAbsolute(acc.lastActivityAt)}>
      {acc.lastActivityAt ? fmtRelative(acc.lastActivityAt) : "—"}
    </td>
    <td className="py-2.5 pr-3 whitespace-nowrap">
      <StatusPill status={acc.status} />
      {acc.status === "idle" && acc.idleDays != null && (
        <span className="ml-2 text-xs text-rose-500">{acc.idleDays}d</span>
      )}
    </td>
  </tr>
);

const TableHead = () => (
  <thead>
    <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
      <th className="pb-2 pr-3 font-medium">Name / ID</th>
      <th className="pb-2 pr-3 font-medium">Last login</th>
      <th className="pb-2 pr-3 font-medium">Last logout</th>
      <th className="pb-2 pr-3 font-medium">Last seen</th>
      <th className="pb-2 pr-3 font-medium">Status</th>
    </tr>
  </thead>
);

const AdminSystemUsage = ({ onAlertCountChange }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [idleDays, setIdleDays] = useState(3);
  const [tab, setTab] = useState("staff");
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [marking, setMarking] = useState(false);
  const autoMarkedRef = useRef(false);

  const load = useCallback(
    async (opts = {}) => {
      if (opts.silent) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await getAdminSystemUsage({ idleDays });
        setData(res);
        setError("");
        onAlertCountChange?.(Number(res.summary?.unseenCount) || 0);
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load usage data");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [idleDays, onAlertCountChange]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => load({ silent: true }), 60000);
    return () => window.clearInterval(id);
  }, [load]);

  const summary = data?.summary || {};
  const self = data?.self || null;
  const staff = data?.staff || [];
  const vendors = data?.vendors || [];
  const notifications = useMemo(() => data?.notifications || [], [data]);
  const unseenCount = notifications.filter((n) => !n.seen).length;
  const visibleAlerts = showAllAlerts ? notifications : notifications.slice(0, 6);

  const markAllSeen = useCallback(
    async ({ silent } = {}) => {
      const ids = (data?.notifications || [])
        .filter((n) => !n.seen)
        .map((n) => n.id);
      if (!ids.length) return;
      if (!silent) setMarking(true);
      try {
        await markAdminSystemUsageSeen(ids);
        setData((prev) =>
          prev
            ? {
                ...prev,
                notifications: prev.notifications.map((n) => ({
                  ...n,
                  seen: true,
                })),
                summary: { ...prev.summary, unseenCount: 0 },
              }
            : prev
        );
        onAlertCountChange?.(0);
      } catch {
        /* non-critical */
      } finally {
        if (!silent) setMarking(false);
      }
    },
    [data, onAlertCountChange]
  );

  useEffect(() => {
    if (autoMarkedRef.current || loading) return;
    if (!(data?.summary?.unseenCount > 0)) return;
    autoMarkedRef.current = true;
    const t = window.setTimeout(() => markAllSeen({ silent: true }), 2500);
    return () => window.clearTimeout(t);
  }, [data, loading, markAllSeen]);

  return (
    <div className="space-y-5">
      {/* header */}
      <div className={`${card} p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-semibold text-gray-900 dark:text-white">
              <Activity size={20} className="text-emerald-500" />
              System Usage
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
              Login, logout and activity for the accounts you created — your
              restaurant staff and the local vendors you created. Accounts with no
              activity for the selected window are flagged below.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Clock size={15} />
              Idle after
              <select
                value={idleDays}
                onChange={(e) => setIdleDays(Number(e.target.value))}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-sm dark:border-white/10 dark:bg-[#0f131a] dark:text-gray-100"
              >
                {IDLE_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} day{d === 1 ? "" : "s"}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => load({ silent: true })}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>
        {data?.generatedAt && (
          <p className="mt-3 text-xs text-gray-400">
            Updated {fmtRelative(data.generatedAt)} · "Online" = active in the last{" "}
            {data.onlineWindowMinutes || 5} min
          </p>
        )}
      </div>

      <PushAlertToggle />

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
          {error}
        </div>
      )}

      {loading && !data ? (
        <div className={`${card} p-6 text-sm text-gray-500 dark:text-gray-400`}>
          Loading system usage…
        </div>
      ) : (
        <>
          {/* self card */}
          {self && (
            <div className={`${card} flex flex-wrap items-center justify-between gap-4 p-4`}>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300">
                  <UserCircle size={22} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {self.name}{" "}
                    <span className="text-xs font-normal text-gray-400">
                      (you · {self.displayId})
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Last login {fmtRelative(self.lastLoginAt)} · Last logout{" "}
                    {fmtRelative(self.lastLogoutAt)}
                  </p>
                </div>
              </div>
              <StatusPill status={self.status} />
            </div>
          )}

          {/* summary cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <SummaryCard
              title="Your accounts"
              value={summary.totalAccounts ?? 0}
              hint={`${summary.staff ?? 0} staff · ${summary.vendors ?? 0} vendors`}
              icon={Users}
              accent="bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-300"
            />
            <SummaryCard
              title="Online now"
              value={summary.onlineNow ?? 0}
              icon={Activity}
              accent="bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
            />
            <SummaryCard
              title={`Idle ≥ ${data?.idleDays ?? idleDays}d`}
              value={summary.idleCount ?? 0}
              icon={AlertTriangle}
              accent="bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-300"
            />
            <SummaryCard
              title="Never logged in"
              value={summary.neverLoggedIn ?? 0}
              icon={CircleSlash}
              accent="bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"
            />
          </div>

          {/* notifications */}
          <div
            className={`${card} p-5 ${
              notifications.length
                ? "ring-1 ring-amber-300/60 dark:ring-amber-500/30"
                : ""
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                <BellRing size={16} className="text-amber-500" />
                Inactivity notifications
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                  {notifications.length}
                </span>
                {unseenCount > 0 && (
                  <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-bold text-white">
                    {unseenCount} new
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-3">
                {unseenCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAllSeen()}
                    disabled={marking}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-60 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
                  >
                    <CheckCheck size={13} />
                    Mark all as seen
                  </button>
                )}
                {notifications.length > 6 && (
                  <button
                    type="button"
                    onClick={() => setShowAllAlerts((v) => !v)}
                    className="text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    {showAllAlerts ? "Show less" : `Show all ${notifications.length}`}
                  </button>
                )}
              </div>
            </div>

            {notifications.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                Every account has been active within the last{" "}
                {data?.idleDays ?? idleDays} day
                {(data?.idleDays ?? idleDays) === 1 ? "" : "s"}.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {visibleAlerts.map((n) => (
                  <li
                    key={`${n.accountType}-${n.id}`}
                    className={`flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm ${
                      n.seen
                        ? "bg-gray-50 opacity-60 dark:bg-white/5"
                        : "bg-amber-50 dark:bg-amber-500/10"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          n.seen ? "bg-transparent" : "bg-rose-500"
                        }`}
                      />
                      {n.accountType === "vendor" ? (
                        <Store size={14} className="text-amber-500" />
                      ) : (
                        <Users size={14} className="text-gray-400" />
                      )}
                      <span className="font-medium text-gray-800 dark:text-gray-100">
                        {n.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {n.displayId} · {n.role}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill status={n.status} />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {n.status === "never"
                          ? "no login recorded"
                          : `idle ${n.idleDays}d · last seen ${fmtRelative(
                              n.lastActivityAt || n.lastLoginAt
                            )}`}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* tabs */}
          <div className={`${card} overflow-hidden`}>
            <div className="flex border-b border-gray-100 dark:border-white/5">
              {[
                { key: "staff", label: `Staff (${staff.length})`, icon: Users },
                { key: "vendors", label: `Local Vendors (${vendors.length})`, icon: Store },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition ${
                    tab === t.key
                      ? "border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  {React.createElement(t.icon, { size: 15 })}
                  {t.label}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto p-4">
              {tab === "staff" ? (
                staff.length === 0 ? (
                  <p className="py-6 text-center text-sm text-gray-400">
                    You haven't created any staff accounts yet.
                  </p>
                ) : (
                  <table className="w-full min-w-[720px]">
                    <TableHead />
                    <tbody>
                      {staff.map((s) => (
                        <AccountRow key={s.id} acc={s} />
                      ))}
                    </tbody>
                  </table>
                )
              ) : vendors.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400">
                  You haven't created any local vendors yet.
                </p>
              ) : (
                <table className="w-full min-w-[720px]">
                  <TableHead />
                  <tbody>
                    {vendors.map((v) => (
                      <AccountRow key={v.id} acc={v} />
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <p className="flex items-center gap-1.5 text-xs text-gray-400">
            <ShieldCheck size={13} />
            Data starts building from each account's first login/logout after this
            feature was enabled.
          </p>
        </>
      )}
    </div>
  );
};

export default AdminSystemUsage;
