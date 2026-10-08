import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  ChevronRight,
  Building2,
  CalendarRange,
  DoorOpen,
  Download,
  Eye,
  Fingerprint,
  Globe,
  LayoutTemplate,
  Lightbulb,
  LogIn,
  LogOut,
  MonitorSmartphone,
  MousePointerClick,
  Radio,
  RefreshCw,
  ScrollText,
  Search,
  ShieldCheck,
  Star,
  Store,
  Timer,
  TrendingUp,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react";
import API from "../../services/api";

const shellCard =
  "rounded-xl border border-white/50 bg-white/80 shadow-[0_18px_45px_-30px_rgba(15,23,42,0.45)] backdrop-blur dark:border-white/10 dark:bg-[#171c25]";

const TONES = {
  emerald:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  sky: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
  indigo:
    "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
  violet:
    "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  rose: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
  slate:
    "bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-200",
};

const BAR_TONES = {
  emerald: "from-emerald-500 to-teal-400",
  sky: "from-sky-500 to-indigo-500",
  indigo: "from-indigo-500 to-violet-500",
  violet: "from-violet-500 to-purple-400",
  amber: "from-amber-500 to-orange-400",
  rose: "from-rose-500 to-amber-400",
  slate: "from-slate-500 to-slate-400",
};

const USER_TYPE_BADGES = {
  admin:
    "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
  vendor:
    "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  employee: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
  super_admin:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
};

const INSIGHT_ICONS = {
  bounce_rate: DoorOpen,
  pages_per_session: LayoutTemplate,
  signup_conversion: UserPlus,
  signups: UserPlus,
  traffic_trend: TrendingUp,
  peak_day: CalendarRange,
  top_device: MonitorSmartphone,
  top_entry: LogIn,
  top_exit: DoorOpen,
};

/* ----------------------------- formatters ----------------------------- */

const formatDuration = (seconds = 0) => {
  const total = Math.max(0, Number(seconds) || 0);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};

const formatSeconds = (seconds = 0) => {
  const total = Math.max(0, Number(seconds) || 0);
  if (total < 60) return `${total}s`;
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

const formatDateTime = (value) => {
  if (!value) return "N/A";
  return new Date(value).toLocaleString();
};

const formatClock = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString();
};

const formatRelativeTime = (value) => {
  if (!value) return "N/A";
  const diff = Date.now() - new Date(value).getTime();
  if (diff < 60000) return "just now";
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

const formatDateLabel = (value) => {
  if (!value) return "";
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
};

const formatDayLabel = (dateValue) => {
  if (!dateValue) return "";
  return new Date(`${dateValue}T00:00:00`).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
  });
};

/* ----------------------------- primitives ----------------------------- */

const Empty = ({ children }) => (
  <p className="rounded-lg border border-dashed border-gray-200 bg-white/50 px-4 py-6 text-center text-sm text-gray-500 dark:border-white/10 dark:bg-white/[0.02] dark:text-gray-400">
    {children}
  </p>
);

const Card = ({
  title,
  subtitle,
  icon,
  tone = "slate",
  aside,
  children,
  className = "",
  bodyClassName = "",
}) => (
  <div className={`${shellCard} p-4 ${className}`}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TONES[tone]}`}
        >
          {icon ? React.createElement(icon, { size: 16 }) : null}
        </span>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
      {aside}
    </div>
    <div className={`mt-3 ${bodyClassName}`}>{children}</div>
  </div>
);

const KpiTile = ({ label, value, hint, icon, tone }) => (
  <div className={`${shellCard} p-3`} title={hint}>
    <div className="flex items-center justify-between gap-2">
      <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
        {label}
      </p>
      <span
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${TONES[tone]}`}
      >
        {React.createElement(icon, { size: 12 })}
      </span>
    </div>
    <p className="mt-1.5 truncate text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
      {value}
    </p>
    <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">
      {hint}
    </p>
  </div>
);

const BarRow = ({ label, value, max, hint, tone = "sky", valueLabel }) => (
  <div className="rounded-lg border border-gray-100 bg-white/70 px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]">
    <div className="flex items-center justify-between gap-3">
      <p
        className="min-w-0 truncate text-xs font-semibold text-gray-900 dark:text-white"
        title={label}
      >
        {label}
      </p>
      <p className="shrink-0 text-xs font-semibold text-gray-700 dark:text-gray-200">
        {valueLabel ?? value}
      </p>
    </div>
    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
      <div
        className={`h-full rounded-full bg-gradient-to-r ${BAR_TONES[tone]}`}
        style={{
          width: `${
            max ? Math.max(4, Math.round((value / Math.max(1, max)) * 100)) : 0
          }%`,
        }}
      />
    </div>
    {hint ? (
      <p className="mt-1 truncate text-[11px] text-gray-500 dark:text-gray-400">
        {hint}
      </p>
    ) : null}
  </div>
);

/* ----------------------------- modal ----------------------------- */

const Modal = ({ title, subtitle, onClose, children, wide = false }) => {
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`flex max-h-[85vh] w-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl dark:bg-[#171c25] ${
          wide ? "max-w-4xl" : "max-w-xl"
        }`}
      >
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-white/10">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            {subtitle ? (
              <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                {subtitle}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-gray-500 transition hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10"
          >
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
};

const ViewAllButton = ({ onClick, label = "View all" }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-600 transition hover:bg-gray-100 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/[0.06]"
  >
    {label}
    <ChevronRight size={12} />
  </button>
);

const Pill = ({ children, className = "" }) => (
  <span
    className={`rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300 ${className}`}
  >
    {children}
  </span>
);

const DetailGrid = ({ rows }) => (
  <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
    {rows.map(([label, value]) => (
      <div key={label} className="min-w-0">
        <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500">
          {label}
        </dt>
        <dd className="mt-0.5 truncate text-sm font-medium text-gray-900 dark:text-white">
          {value ?? "N/A"}
        </dd>
      </div>
    ))}
  </dl>
);

/* ----------------------------- panels ----------------------------- */

const LiveRow = ({ user }) => (
  <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-gray-800 dark:text-gray-100">
          {user.displayName || "Guest"}
          {user.displayId ? (
            <span className="ml-2 font-normal text-gray-500 dark:text-gray-400">
              {user.displayId}
            </span>
          ) : null}
        </p>
        <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">
          {user.roleLabel || user.role || "Guest"} •{" "}
          <span className="font-mono">{user.currentPath}</span>
          {user.idleSeconds >= 60
            ? ` • idle ${formatSeconds(user.idleSeconds)}`
            : ""}
        </p>
      </div>
    </div>
    <span className="shrink-0 text-[11px] font-semibold text-emerald-600 dark:text-emerald-300">
      {formatSeconds(user.durationSeconds)}
    </span>
  </div>
);

const RealtimePanel = ({ data }) => {
  const [open, setOpen] = useState(false);
  const onlineUsers = data?.onlineUsers || [];
  const recentLogins = data?.recentLogins || [];
  const roleBreakdown = [
    ["super_admin", "Super admins"],
    ["admin", "Admins"],
    ["vendor", "Vendors"],
    ["employee", "Employees"],
    ["guest", "Guests"],
    ["other", "Others"],
  ]
    .map(([key, label]) => ({ label, count: data?.activeByRole?.[key] || 0 }))
    .filter((item) => item.count > 0);

  const stats = [
    ["Logins · 15m", data?.loginsLast15Min ?? 0, LogIn, "sky"],
    ["Logins · 1h", data?.loginsLastHour ?? 0, UsersRound, "indigo"],
    ["Signups · 24h", data?.signupsLast24h ?? 0, UserPlus, "amber"],
    ["Views · 5m", data?.pageViewsLast5Min ?? 0, MousePointerClick, "rose"],
  ];

  return (
    <>
      <Card
        title="Live Sessions"
        subtitle="Active in the last 2 minutes · refreshed every 10s"
        icon={Radio}
        tone="emerald"
        aside={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              {onlineUsers.length} live
            </span>
            {onlineUsers.length > 5 ? (
              <ViewAllButton
                onClick={() => setOpen(true)}
                label={`All ${onlineUsers.length}`}
              />
            ) : null}
          </div>
        }
      >
        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map(([label, value, icon, tone]) => (
            <div
              key={label}
              className="flex items-center gap-2.5 rounded-lg border border-gray-100 bg-white/70 px-3 py-2 dark:border-white/10 dark:bg-white/[0.03]"
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${TONES[tone]}`}
              >
                {React.createElement(icon, { size: 13 })}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500 dark:text-gray-400">
                  {label}
                </p>
                <p className="text-base font-semibold leading-tight text-gray-900 dark:text-white">
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {roleBreakdown.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {roleBreakdown.map((item) => (
              <Pill key={item.label}>
                {item.count} {item.label}
              </Pill>
            ))}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-1.5">
            {onlineUsers.length === 0 ? (
              <Empty>No active visitors right now.</Empty>
            ) : (
              onlineUsers
                .slice(0, 5)
                .map((user, index) => (
                  <LiveRow
                    key={`${user.sessionId || user.displayId || "guest"}-${index}`}
                    user={user}
                  />
                ))
            )}
          </div>
          <div className="space-y-1.5">
            {recentLogins.length === 0 ? (
              <Empty>No logins in the last 15 minutes.</Empty>
            ) : (
              recentLogins.slice(0, 5).map((item, index) => (
                <div
                  key={`${item.sessionId || item.displayId || "login"}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-gray-800 dark:text-gray-100">
                      <LogIn size={11} className="mr-1.5 inline text-sky-500" />
                      {item.displayName || "Unknown"}
                    </p>
                    <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                      {item.roleLabel || item.role || "Guest"} •{" "}
                      <span className="font-mono">{item.path}</span>
                    </p>
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                    {formatRelativeTime(item.occurredAt)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      {open ? (
        <Modal
          title="All live sessions"
          subtitle={`${onlineUsers.length} active right now`}
          onClose={() => setOpen(false)}
        >
          <div className="space-y-1.5">
            {onlineUsers.map((user, index) => (
              <LiveRow
                key={`${user.sessionId || user.displayId || "guest"}-${index}`}
                user={user}
              />
            ))}
          </div>
        </Modal>
      ) : null}
    </>
  );
};

const TrendPanel = ({ items }) => {
  const trend = items || [];
  const max = Math.max(1, ...trend.map((item) => item.pageViews || 0));
  const totalViews = trend.reduce((sum, item) => sum + (item.pageViews || 0), 0);
  const bestDay = trend.reduce(
    (best, item) => ((item.pageViews || 0) > (best?.pageViews || 0) ? item : best),
    null
  );
  const labelStep = Math.max(1, Math.ceil(trend.length / 8));

  return (
    <Card
      title="Traffic Trend"
      subtitle="Daily page views · hover a bar for details"
      icon={TrendingUp}
      tone="sky"
      aside={
        <Pill>
          {totalViews} views{bestDay ? ` • peak ${formatDayLabel(bestDay.date)}` : ""}
        </Pill>
      }
    >
      {trend.length === 0 ? (
        <Empty>No traffic recorded in this range yet.</Empty>
      ) : (
        <>
          <div className="flex h-36 items-end gap-1">
            {trend.map((item) => (
              <div
                key={item.date}
                className="flex h-full flex-1 flex-col justify-end"
                title={`${formatDayLabel(item.date)}: ${item.pageViews} views • ${item.sessions} sessions`}
              >
                <div
                  className="rounded-t bg-gradient-to-t from-sky-500/80 to-indigo-400/80 transition-all hover:from-sky-500 hover:to-indigo-400"
                  style={{
                    height: `${Math.max(3, Math.round(((item.pageViews || 0) / max) * 100))}%`,
                  }}
                />
              </div>
            ))}
          </div>
          <div className="mt-1.5 flex gap-1">
            {trend.map((item, index) => (
              <p
                key={item.date}
                className="flex-1 truncate text-center text-[10px] font-medium text-gray-400 dark:text-gray-500"
              >
                {index % labelStep === 0 || index === trend.length - 1
                  ? formatDayLabel(item.date)
                  : ""}
              </p>
            ))}
          </div>
        </>
      )}
    </Card>
  );
};

const RankedList = ({ rows, max, tone, empty }) =>
  rows.length === 0 ? (
    <Empty>{empty}</Empty>
  ) : (
    <div className="space-y-1.5">
      {rows.map(({ key, ...row }) => (
        <BarRow key={key} {...row} max={max} tone={tone} />
      ))}
    </div>
  );

const TopPagesPanel = ({ items, totalViews, mostVisited }) => {
  const [open, setOpen] = useState(false);
  const pages = items || [];
  const max = Math.max(1, ...pages.map((page) => page.views || 0));
  const rows = pages.map((page) => ({
    key: page.path,
    label: page.path,
    value: page.views,
    valueLabel: page.views,
    hint: `${page.uniqueSessions} unique sessions`,
  }));

  return (
    <>
      <Card
        title="Top Pages"
        subtitle={
          mostVisited?.option
            ? `Top feature: ${mostVisited.option.featureLabel} (${mostVisited.option.count} uses)`
            : "Most viewed paths"
        }
        icon={Eye}
        tone="indigo"
        aside={
          <div className="flex items-center gap-2">
            <Pill>{totalViews} views</Pill>
            {rows.length > 5 ? (
              <ViewAllButton
                onClick={() => setOpen(true)}
                label={`All ${rows.length}`}
              />
            ) : null}
          </div>
        }
      >
        <RankedList
          rows={rows.slice(0, 5)}
          max={max}
          tone="sky"
          empty="No page view data yet."
        />
      </Card>
      {open ? (
        <Modal
          title="All pages"
          subtitle={`${rows.length} paths · ${totalViews} total views`}
          onClose={() => setOpen(false)}
        >
          <RankedList rows={rows} max={max} tone="sky" empty="No data." />
        </Modal>
      ) : null}
    </>
  );
};

const BreakdownCard = ({ title, subtitle, icon, items, total, tone }) => {
  const rows = (items || []).slice(0, 5);
  const max = Math.max(1, ...rows.map((row) => row.count || 0));

  return (
    <Card title={title} subtitle={subtitle} icon={icon} tone={tone}>
      <RankedList
        rows={rows.map((row) => ({
          key: row.label,
          label: row.label,
          value: row.count,
          valueLabel: `${row.count} · ${
            total ? Math.round(((row.count || 0) / total) * 100) : 0
          }%`,
        }))}
        max={max}
        tone={tone}
        empty="No data available yet."
      />
    </Card>
  );
};

const ExitPagesPanel = ({ items, total }) => {
  const pages = items || [];
  const max = Math.max(1, ...pages.map((page) => page.sessions || 0));

  return (
    <Card
      title="Exit Pages"
      subtitle="Where visitors leave without signing up"
      icon={DoorOpen}
      tone="rose"
      aside={
        <Pill className="!bg-rose-50 !text-rose-700 dark:!bg-rose-500/10 dark:!text-rose-300">
          {total} abandoned
        </Pill>
      }
    >
      <RankedList
        rows={pages.slice(0, 6).map((page) => ({
          key: page.path,
          label: page.path,
          value: page.sessions,
          valueLabel: `${page.share}%`,
          hint: `${page.sessions} sessions • ${page.visitors} unique visitors`,
        }))}
        max={max}
        tone="rose"
        empty="No abandoned sessions in this range."
      />
    </Card>
  );
};

const InsightsPanel = ({ items }) => {
  const insights = items || [];

  return (
    <Card
      title="Insights"
      subtitle="Auto-generated highlights for this range"
      icon={Lightbulb}
      tone="amber"
    >
      {insights.length === 0 ? (
        <Empty>No insights yet.</Empty>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {insights.map((item) => (
            <div
              key={item.key}
              className="rounded-lg border border-gray-100 bg-white/70 px-3 py-2.5 dark:border-white/10 dark:bg-white/[0.03]"
              title={item.hint}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-500 dark:text-gray-400">
                  {item.label}
                </p>
                {React.createElement(INSIGHT_ICONS[item.key] || Lightbulb, {
                  size: 12,
                  className: "shrink-0 text-amber-500",
                })}
              </div>
              <p className="mt-0.5 truncate text-base font-semibold text-gray-900 dark:text-white">
                {item.value}
              </p>
              <p className="line-clamp-1 text-[11px] text-gray-500 dark:text-gray-400">
                {item.hint}
              </p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};

const TopFeaturesPanel = ({ items }) => {
  const [open, setOpen] = useState(false);
  const features = items || [];
  const max = Math.max(1, ...features.map((feature) => feature.count || 0));
  const rows = features.map((feature) => ({
    key: feature.featureKey,
    label: feature.featureLabel,
    value: feature.count,
    valueLabel: feature.count,
    hint: `Roles: ${(feature.roles || []).join(", ") || "N/A"}`,
  }));

  return (
    <>
      <Card
        title="Top Features"
        subtitle="Most used options across roles"
        icon={MousePointerClick}
        tone="emerald"
        aside={
          rows.length > 5 ? (
            <ViewAllButton
              onClick={() => setOpen(true)}
              label={`All ${rows.length}`}
            />
          ) : null
        }
      >
        <RankedList
          rows={rows.slice(0, 5)}
          max={max}
          tone="emerald"
          empty="No feature usage data yet."
        />
      </Card>
      {open ? (
        <Modal
          title="All features"
          subtitle={`${rows.length} tracked options`}
          onClose={() => setOpen(false)}
        >
          <RankedList rows={rows} max={max} tone="emerald" empty="No data." />
        </Modal>
      ) : null}
    </>
  );
};

const RoleUsagePanel = ({ roleTotals, liveStatus }) => {
  const roles = [
    { key: "admin", label: "Admin", icon: ShieldCheck, tone: "indigo" },
    { key: "vendor", label: "Vendor", icon: Store, tone: "amber" },
    { key: "employee", label: "Employee", icon: UsersRound, tone: "sky" },
  ];

  return (
    <Card
      title="Usage by Role"
      subtitle="Sessions, average duration and live presence"
      icon={ShieldCheck}
      tone="violet"
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="text-[10px] uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500">
              <th className="px-2 py-2 font-semibold">Role</th>
              <th className="px-2 py-2 text-right font-semibold">Sessions</th>
              <th className="px-2 py-2 text-right font-semibold">Avg duration</th>
              <th className="px-2 py-2 text-right font-semibold">Online</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-white/10">
            {roles.map((role) => {
              const totals = roleTotals?.[role.key] || {};
              return (
                <tr key={role.key}>
                  <td className="px-2 py-2.5">
                    <span className="flex items-center gap-2 text-xs font-semibold text-gray-900 dark:text-white">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-md ${TONES[role.tone]}`}
                      >
                        {React.createElement(role.icon, { size: 12 })}
                      </span>
                      {role.label}
                    </span>
                  </td>
                  <td className="px-2 py-2.5 text-right text-sm font-semibold text-gray-900 dark:text-white">
                    {totals.sessions || 0}
                  </td>
                  <td className="px-2 py-2.5 text-right text-sm font-semibold text-gray-900 dark:text-white">
                    {formatDuration(totals.avgDurationSeconds || 0)}
                  </td>
                  <td className="px-2 py-2.5 text-right text-sm font-semibold text-gray-900 dark:text-white">
                    <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {liveStatus?.[`${role.key}LoggedInNow`] || 0}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

const typeLabel = (type) =>
  type === "super_admin"
    ? "Super Admin"
    : (type || "Other").replace(/^\w/, (char) => char.toUpperCase());

const StatusBadge = ({ online }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
      online
        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
    }`}
  >
    <span
      className={`h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-500" : "bg-slate-400"}`}
    />
    {online ? "Online" : "Offline"}
  </span>
);

const UserDetailModal = ({ user, onClose }) => (
  <Modal
    title={user.displayName || "Unknown"}
    subtitle={`${user.displayId || "N/A"} • ${user.roleLabel || user.role || "Guest"}`}
    onClose={onClose}
  >
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
          USER_TYPE_BADGES[user.userType] || USER_TYPE_BADGES.employee
        }`}
      >
        {typeLabel(user.userType)}
      </span>
      <StatusBadge online={user.currentlyLoggedIn} />
    </div>
    <DetailGrid
      rows={[
        ["Restaurant", user.restaurantName || "—"],
        ["Last seen", formatDateTime(user.lastSeenAt)],
        ["Sessions", user.sessionCount || 0],
        ["Page views", user.totalPageViews || 0],
        ["Logins", user.loginCount || 0],
        ["Logouts", user.logoutCount || 0],
        ["Last login", formatDateTime(user.lastLoginAt)],
        ["Last logout", formatDateTime(user.lastLogoutAt)],
      ]}
    />
  </Modal>
);

const USERS_PREVIEW = 8;

const UserActivityPanel = ({ adminUsers, vendorUsers, employeeUsers }) => {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState(null);

  const allUsers = useMemo(
    () => [
      ...(adminUsers || []),
      ...(vendorUsers || []),
      ...(employeeUsers || []),
    ],
    [adminUsers, vendorUsers, employeeUsers]
  );

  const tabs = [
    { key: "all", label: "All", count: allUsers.length },
    { key: "admin", label: "Admins", count: (adminUsers || []).length },
    { key: "vendor", label: "Vendors", count: (vendorUsers || []).length },
    { key: "employee", label: "Employees", count: (employeeUsers || []).length },
  ];

  const filteredUsers = useMemo(() => {
    const base =
      tab === "all"
        ? allUsers
        : allUsers.filter((user) => user.userType === tab);

    const query = search.trim().toLowerCase();
    if (!query) return base;

    return base.filter((user) =>
      [user.displayName, user.displayId, user.restaurantName, user.roleLabel]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(query))
    );
  }, [allUsers, tab, search]);

  const visibleUsers = showAll
    ? filteredUsers
    : filteredUsers.slice(0, USERS_PREVIEW);

  return (
    <>
      <Card
        title="User Activity"
        subtitle="Click a row for full details"
        icon={UsersRound}
        tone="indigo"
        aside={
          <div className="relative">
            <Search
              size={13}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users…"
              className="w-44 rounded-lg border border-gray-200 bg-white py-1.5 pl-8 pr-3 text-xs text-gray-700 outline-none transition focus:border-gray-900 dark:border-white/10 dark:bg-white/[0.04] dark:text-white dark:focus:border-white"
            />
          </div>
        }
      >
        <div className="mb-3 flex flex-wrap gap-1.5">
          {tabs.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTab(item.key)}
              className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                tab === item.key
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-white/[0.06] dark:text-gray-300 dark:hover:bg-white/[0.12]"
              }`}
            >
              {item.label}
              <span className="ml-1.5 opacity-60">{item.count}</span>
            </button>
          ))}
        </div>

        {filteredUsers.length === 0 ? (
          <Empty>No user activity matches this view.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left dark:divide-white/10">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500">
                  <th className="px-3 py-2 font-semibold">User</th>
                  <th className="px-3 py-2 font-semibold">Type</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 text-right font-semibold">Sessions</th>
                  <th className="px-3 py-2 text-right font-semibold">Views</th>
                  <th className="px-3 py-2 font-semibold">Last login</th>
                  <th className="w-6" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                {visibleUsers.map((user, index) => (
                  <tr
                    key={`${user.userType}-${user.userId || user.displayId || index}`}
                    onClick={() => setSelected(user)}
                    className="cursor-pointer transition hover:bg-gray-50/70 dark:hover:bg-white/[0.03]"
                  >
                    <td className="px-3 py-2">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white">
                        {user.displayName || "Unknown"}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {user.displayId || "N/A"}
                        {user.restaurantName ? ` • ${user.restaurantName}` : ""}
                      </p>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          USER_TYPE_BADGES[user.userType] || USER_TYPE_BADGES.employee
                        }`}
                      >
                        {typeLabel(user.userType)}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge online={user.currentlyLoggedIn} />
                    </td>
                    <td className="px-3 py-2 text-right text-xs font-semibold text-gray-900 dark:text-white">
                      {user.sessionCount || 0}
                    </td>
                    <td className="px-3 py-2 text-right text-xs font-semibold text-gray-900 dark:text-white">
                      {user.totalPageViews || 0}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-gray-500 dark:text-gray-400">
                      {user.lastLoginAt ? formatRelativeTime(user.lastLoginAt) : "—"}
                    </td>
                    <td className="pr-2 text-gray-300 dark:text-gray-600">
                      <ChevronRight size={14} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredUsers.length > USERS_PREVIEW ? (
          <button
            type="button"
            onClick={() => setShowAll((value) => !value)}
            className="mt-3 w-full rounded-lg border border-dashed border-gray-200 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/[0.04]"
          >
            {showAll ? "Show less" : `Show all ${filteredUsers.length} users`}
          </button>
        ) : null}
      </Card>

      {selected ? (
        <UserDetailModal user={selected} onClose={() => setSelected(null)} />
      ) : null}
    </>
  );
};

const AdminDetailModal = ({ admin, onClose }) => (
  <Modal
    title={admin.adminName}
    subtitle={`${admin.adminId} • ${admin.restaurantCount} restaurants • ${admin.employeeCount} employees`}
    onClose={onClose}
    wide
  >
    <div className="grid gap-3 md:grid-cols-2">
      {admin.restaurants.map((restaurant) => (
        <div
          key={restaurant.restaurantObjectId || restaurant.restaurantId}
          className="rounded-xl border border-gray-100 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.03]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                {restaurant.restaurantName}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {restaurant.restaurantId} • {restaurant.activeEmployeeCount}/
                {restaurant.employeeCount} active
              </p>
            </div>
            <Store size={14} className="shrink-0 text-gray-400" />
          </div>
          <div className="mt-2.5 space-y-1.5">
            {restaurant.employees.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                No employees assigned.
              </p>
            ) : (
              restaurant.employees.map((employee) => (
                <div
                  key={employee.employeeObjectId || employee.employeeId}
                  className="flex items-center justify-between gap-3 rounded-md border border-gray-100 bg-white px-2.5 py-1.5 dark:border-white/10 dark:bg-white/[0.04]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-medium text-gray-800 dark:text-gray-100">
                      {employee.name}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {employee.employeeId} • {employee.roleLabel}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      employee.isActive
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {employee.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  </Modal>
);

const AdminRestaurantEmployees = ({ items }) => {
  const [selected, setSelected] = useState(null);
  const admins = items || [];

  return (
    <>
      <Card
        title="Restaurants & Employees"
        subtitle="Click an admin to see restaurants and rosters"
        icon={Building2}
        tone="sky"
        aside={
          <Pill>
            {admins.length} admin{admins.length === 1 ? "" : "s"}
          </Pill>
        }
      >
        {admins.length === 0 ? (
          <Empty>No admin restaurant employee data yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-left dark:divide-white/10">
              <thead>
                <tr className="text-[10px] uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500">
                  <th className="px-3 py-2 font-semibold">Admin</th>
                  <th className="px-3 py-2 text-right font-semibold">Restaurants</th>
                  <th className="px-3 py-2 text-right font-semibold">Employees</th>
                  <th className="w-6" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                {admins.map((admin) => (
                  <tr
                    key={admin.adminObjectId || admin.adminId}
                    onClick={() => setSelected(admin)}
                    className="cursor-pointer transition hover:bg-gray-50/70 dark:hover:bg-white/[0.03]"
                  >
                    <td className="px-3 py-2">
                      <p className="text-xs font-semibold text-gray-900 dark:text-white">
                        {admin.adminName}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">
                        {admin.adminId}
                      </p>
                    </td>
                    <td className="px-3 py-2 text-right text-xs font-semibold text-gray-900 dark:text-white">
                      {admin.restaurantCount}
                    </td>
                    <td className="px-3 py-2 text-right text-xs font-semibold text-gray-900 dark:text-white">
                      {admin.employeeCount}
                    </td>
                    <td className="pr-2 text-gray-300 dark:text-gray-600">
                      <ChevronRight size={14} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {selected ? (
        <AdminDetailModal admin={selected} onClose={() => setSelected(null)} />
      ) : null}
    </>
  );
};

const AuthEventRow = ({ item }) => {
  const isLogin = item.eventType === "LOGIN";
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-white px-3 py-2 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${
            isLogin ? TONES.emerald : TONES.slate
          }`}
        >
          {isLogin ? <LogIn size={12} /> : <LogOut size={12} />}
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-gray-900 dark:text-white">
            {item.displayName || "Unknown"}
            {item.displayId ? (
              <span className="ml-2 font-normal text-gray-500 dark:text-gray-400">
                {item.displayId}
              </span>
            ) : null}
          </p>
          <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">
            {item.roleLabel || item.role || "Guest"}
            {item.restaurantName ? ` • ${item.restaurantName}` : ""} •{" "}
            <span className="font-mono">{item.path}</span>
          </p>
        </div>
      </div>
      <span
        className="shrink-0 text-[11px] text-gray-500 dark:text-gray-400"
        title={formatDateTime(item.occurredAt)}
      >
        {formatRelativeTime(item.occurredAt)}
      </span>
    </div>
  );
};

const AuthLogPanel = ({ items }) => {
  const [open, setOpen] = useState(false);
  const events = items || [];

  return (
    <>
      <Card
        title="Authentication Log"
        subtitle="Latest login and logout events in range"
        icon={ScrollText}
        tone="violet"
        aside={
          events.length > 8 ? (
            <ViewAllButton
              onClick={() => setOpen(true)}
              label={`All ${events.length}`}
            />
          ) : null
        }
      >
        {events.length === 0 ? (
          <Empty>No auth activity recorded yet.</Empty>
        ) : (
          <div className="space-y-1.5">
            {events.slice(0, 8).map((item, index) => (
              <AuthEventRow
                key={`${item.sessionId}-${item.occurredAt}-${index}`}
                item={item}
              />
            ))}
          </div>
        )}
      </Card>
      {open ? (
        <Modal
          title="Authentication log"
          subtitle={`${events.length} events in range`}
          onClose={() => setOpen(false)}
          wide
        >
          <div className="space-y-1.5">
            {events.map((item, index) => (
              <AuthEventRow
                key={`${item.sessionId}-${item.occurredAt}-${index}`}
                item={item}
              />
            ))}
          </div>
        </Modal>
      ) : null}
    </>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="h-20 animate-pulse rounded-xl bg-slate-200/60 dark:bg-white/5"
        />
      ))}
    </div>
    <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
      <div className="h-72 animate-pulse rounded-xl bg-slate-200/60 dark:bg-white/5" />
      <div className="h-72 animate-pulse rounded-xl bg-slate-200/60 dark:bg-white/5" />
    </div>
    <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
      <div className="h-64 animate-pulse rounded-xl bg-slate-200/60 dark:bg-white/5" />
      <div className="h-64 animate-pulse rounded-xl bg-slate-200/60 dark:bg-white/5" />
    </div>
  </div>
);

const ErrorBanner = ({ message, onRetry }) => (
  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-500/20 dark:bg-amber-500/10">
    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
      {message || "Couldn't load the latest analytics data."}
    </p>
    <button
      type="button"
      onClick={onRetry}
      className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-amber-500"
    >
      <RefreshCw size={13} />
      Retry
    </button>
  </div>
);

/* ----------------------------- page ----------------------------- */

const ProjectAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [realtime, setRealtime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [days, setDays] = useState(7);
  const [rangeMode, setRangeMode] = useState("preset");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const buildQuery = useCallback(() => {
    const params = new URLSearchParams();

    if (rangeMode === "custom" && startDate && endDate) {
      params.set("startDate", startDate);
      params.set("endDate", endDate);
    } else {
      params.set("days", String(days));
    }

    return params.toString();
  }, [days, rangeMode, startDate, endDate]);

  useEffect(() => {
    let isMounted = true;

    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/project-analytics/summary?${buildQuery()}`);
        if (!isMounted) return;
        setAnalytics(res.data?.data || null);
        setLastUpdated(new Date());
        setHasError(false);
      } catch (error) {
        console.error("Failed to load project analytics", error);
        if (!isMounted) return;
        setHasError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAnalytics();
    return () => {
      isMounted = false;
    };
  }, [buildQuery, refreshKey]);

  useEffect(() => {
    let isMounted = true;

    const fetchRealtime = async () => {
      try {
        const res = await API.get("/project-analytics/realtime");
        if (isMounted) setRealtime(res.data?.data || null);
      } catch (error) {
        console.error("Failed to load realtime analytics", error);
      }
    };

    fetchRealtime();
    const intervalId = window.setInterval(fetchRealtime, 10 * 1000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const kpis = useMemo(() => {
    const totals = analytics?.totals || {};
    const liveStatus = analytics?.liveStatus || {};
    const totalSessions = totals.totalSessions || 0;
    const totalViews = totals.totalPageViews || 0;
    const pagesPerSession = totalSessions
      ? Math.round((totalViews / totalSessions) * 10) / 10
      : 0;

    return [
      {
        label: "Total Sessions",
        value: totalSessions,
        hint: "Tracked visits in range",
        icon: UsersRound,
        tone: "emerald",
      },
      {
        label: "Unique Visitors",
        value: totals.uniqueVisitors || 0,
        hint: `${totals.uniqueAuthenticatedVisitors || 0} signed-in • ${
          totals.uniqueGuestVisitors || 0
        } guest`,
        icon: Fingerprint,
        tone: "violet",
      },
      {
        label: "Page Views",
        value: totalViews,
        hint: `${pagesPerSession} per session`,
        icon: Eye,
        tone: "sky",
      },
      {
        label: "Home Page Visits",
        value: totals.homePageVisits || 0,
        hint: "Public landing page",
        icon: Globe,
        tone: "amber",
      },
      {
        label: "Avg Session",
        value: formatDuration(totals.avgDurationSeconds || 0),
        hint: "Average active session time",
        icon: Timer,
        tone: "rose",
      },
      {
        label: "Online Now",
        value: liveStatus.totalLoggedInNow || 0,
        hint: `${liveStatus.totalLoggedOut || 0} sessions closed`,
        icon: Radio,
        tone: "emerald",
      },
      {
        label: "Logins",
        value: totals.totalLogins || 0,
        hint: `${totals.totalLogouts || 0} logouts in range`,
        icon: LogIn,
        tone: "indigo",
      },
      {
        label: "Exit w/o Signup",
        value: totals.exitSessionsWithoutSignup || 0,
        hint: "Visits that never signed in",
        icon: DoorOpen,
        tone: "rose",
      },
    ];
  }, [analytics]);

  const rangeLabelText =
    rangeMode === "custom" && startDate && endDate
      ? `${formatDateLabel(startDate)} – ${formatDateLabel(endDate)}`
      : `Last ${days} days`;

  const handleRetry = () => setRefreshKey((key) => key + 1);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const res = await API.get(`/project-analytics/export?${buildQuery()}`, {
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "application/vnd.ms-excel" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const dateLabel = new Date().toISOString().slice(0, 10);
      const rangeLabel =
        rangeMode === "custom" && startDate && endDate
          ? `${startDate}-to-${endDate}`
          : `${days}d`;

      link.href = url;
      link.download = `project-analytics-${rangeLabel}-${dateLabel}.xls`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download project analytics", error);
    } finally {
      setDownloading(false);
    }
  };

  const totals = analytics?.totals || {};

  const tabs = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "traffic", label: "Traffic & Audience", icon: TrendingUp },
    { key: "conversion", label: "Conversion", icon: DoorOpen },
    { key: "users", label: "Users", icon: UsersRound },
    { key: "organization", label: "Organization", icon: Building2 },
    { key: "auth", label: "Auth Log", icon: ScrollText },
  ];

  const inputClass =
    "rounded-lg border border-white/15 bg-white/10 px-2.5 py-1.5 text-xs text-white [color-scheme:dark] outline-none transition focus:border-white/40";

  return (
    <div className="space-y-4">
      {/* Header */}
      <section className={`${shellCard} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-br from-gray-900 via-slate-900 to-indigo-950 px-5 py-4 text-white">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-300/90">
              <BarChart3 size={12} />
              Super Admin • Full Project
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight">
              Project Analytics
            </h1>
            <p className="mt-0.5 flex items-center gap-2 text-xs text-white/60">
              <span className="inline-flex items-center gap-1.5 font-semibold text-white/90">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                {analytics?.liveStatus?.totalLoggedInNow || 0} online
              </span>
              <span>
                • {rangeLabelText} • Updated {formatClock(lastUpdated)}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1 rounded-lg bg-white/10 p-1">
              {[7, 14, 30].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setRangeMode("preset");
                    setDays(value);
                  }}
                  className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                    rangeMode === "preset" && days === value
                      ? "bg-white text-gray-900"
                      : "text-white/80 hover:bg-white/15"
                  }`}
                >
                  {value}d
                </button>
              ))}
            </div>
            <input
              type="date"
              aria-label="Start date"
              max={endDate || undefined}
              value={startDate}
              onChange={(event) => {
                setRangeMode("custom");
                setStartDate(event.target.value);
              }}
              className={inputClass}
            />
            <input
              type="date"
              aria-label="End date"
              min={startDate || undefined}
              value={endDate}
              onChange={(event) => {
                setRangeMode("custom");
                setEndDate(event.target.value);
              }}
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => {
                setRangeMode("preset");
                setStartDate("");
                setEndDate("");
                setDays(7);
              }}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/15"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleRetry}
              disabled={loading}
              aria-label="Refresh"
              className="rounded-lg border border-white/15 bg-white/5 p-2 text-white/80 transition hover:bg-white/15 disabled:opacity-50"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading || loading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download size={13} />
              {downloading ? "Exporting…" : "Export"}
            </button>
          </div>
        </div>
      </section>

      {loading && !analytics ? (
        <LoadingSkeleton />
      ) : (
        <>
          {hasError ? (
            <ErrorBanner
              message="Couldn't refresh analytics — showing the last loaded results."
              onRetry={handleRetry}
            />
          ) : null}

          {/* KPI strip */}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
            {kpis.map((kpi) => (
              <KpiTile key={kpi.label} {...kpi} />
            ))}
          </section>

          {/* Tabs */}
          <nav
            className="flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-white/10"
            role="tablist"
          >
            {tabs.map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={activeTab === item.key}
                onClick={() => setActiveTab(item.key)}
                className={`-mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3.5 py-2 text-xs font-semibold transition ${
                  activeTab === item.key
                    ? "border-gray-900 text-gray-900 dark:border-white dark:text-white"
                    : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {React.createElement(item.icon, { size: 13 })}
                {item.label}
              </button>
            ))}
          </nav>

          {activeTab === "overview" ? (
            <div className="space-y-4">
              <RealtimePanel data={realtime} />
              <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
                <TrendPanel items={analytics?.recentTrend} />
                <TopPagesPanel
                  items={analytics?.topPages}
                  totalViews={totals.totalPageViews || 0}
                  mostVisited={analytics?.mostVisited}
                />
              </div>
            </div>
          ) : null}

          {activeTab === "traffic" ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <BreakdownCard
                  title="Role Mix"
                  subtitle="Sessions per role"
                  icon={UsersRound}
                  tone="violet"
                  items={analytics?.breakdowns?.roles}
                  total={totals.totalSessions || 0}
                />
                <BreakdownCard
                  title="Devices"
                  subtitle="Sessions per device"
                  icon={MonitorSmartphone}
                  tone="sky"
                  items={analytics?.breakdowns?.devices}
                  total={totals.totalSessions || 0}
                />
                <BreakdownCard
                  title="Browsers"
                  subtitle="Sessions per browser"
                  icon={Globe}
                  tone="indigo"
                  items={analytics?.breakdowns?.browsers}
                  total={totals.totalSessions || 0}
                />
              </div>
              <div className="grid gap-4 xl:grid-cols-2">
                <TopFeaturesPanel items={analytics?.topFeatures} />
                <RoleUsagePanel
                  roleTotals={analytics?.roleTotals}
                  liveStatus={analytics?.liveStatus}
                />
              </div>
            </div>
          ) : null}

          {activeTab === "conversion" ? (
            <div className="grid gap-4 xl:grid-cols-2">
              <ExitPagesPanel
                items={analytics?.exitPages}
                total={totals.exitSessionsWithoutSignup || 0}
              />
              <InsightsPanel items={analytics?.insights} />
            </div>
          ) : null}

          {activeTab === "users" ? (
            <UserActivityPanel
              adminUsers={analytics?.adminUsers}
              vendorUsers={analytics?.vendorUsers}
              employeeUsers={analytics?.employeeUsers}
            />
          ) : null}

          {activeTab === "organization" ? (
            <AdminRestaurantEmployees
              items={analytics?.adminRestaurantEmployees}
            />
          ) : null}

          {activeTab === "auth" ? (
            <AuthLogPanel items={analytics?.recentAuthEvents} />
          ) : null}
        </>
      )}
    </div>
  );
};

export default ProjectAnalytics;
