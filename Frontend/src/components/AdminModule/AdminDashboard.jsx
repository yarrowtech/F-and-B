import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getAdminInsights,
  getAdminSummary,
  getDailySales,
  getMonthlyChart,
  getRestaurantBreakdown,
  getTopItems,
} from "../../services/adminDashboard.service";
import { getRestaurants } from "../../services/restaurant.service";

/* ═════════════════════════ formatting ═════════════════════════ */
const fmt = (v) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(v || 0));

const fmtCompact = (v) =>
  `₹${new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(v || 0))}`;

const titleCase = (value = "") =>
  String(value)
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const hourLabel = (h) => `${h % 12 || 12}${h < 12 ? "a" : "p"}`;
const hourRange = (h) => {
  const to = (h + 1) % 24;
  const suffix = (x) => (x < 12 ? "AM" : "PM");
  const twelve = (x) => x % 12 || 12;
  return `${twelve(h)} ${suffix(h)} – ${twelve(to)} ${suffix(to)}`;
};

/* ═════════════════════════ filters ═════════════════════════ */
const PRESETS = [
  { label: "All Time", key: "all" },
  { label: "Today", key: "today" },
  { label: "Last 7 Days", key: "7days" },
  { label: "This Week", key: "week" },
  { label: "Last Month", key: "lastmonth" },
];

const isoDay = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const getDateRange = (key) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (key) {
    case "today":
      return { startDate: isoDay(today), endDate: isoDay(today) };
    case "7days": {
      const s = new Date(today);
      s.setDate(s.getDate() - 6);
      return { startDate: isoDay(s), endDate: isoDay(today) };
    }
    case "week": {
      const s = new Date(today);
      s.setDate(s.getDate() - today.getDay());
      return { startDate: isoDay(s), endDate: isoDay(today) };
    }
    case "lastmonth": {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: isoDay(s), endDate: isoDay(e) };
    }
    default:
      return { startDate: "", endDate: "" };
  }
};

/* ═════════════════════════ chart palette (validated reference palette) ═════════════════════════ */
// categorical slots 1-3 validate together in light + dark mode
const SERIES = [
  "bg-[#2a78d6] dark:bg-[#3987e5]",
  "bg-[#eb6834] dark:bg-[#d95926]",
  "bg-[#1baf7a] dark:bg-[#199e70]",
];
const OTHER_BG = "bg-gray-400 dark:bg-gray-500";
const BAR_BG = "bg-[#2a78d6] dark:bg-[#3987e5]";
const LINE_STROKE = "stroke-[#2a78d6] dark:stroke-[#3987e5]";
const AREA_FILL = "fill-[#2a78d6]/10 dark:fill-[#3987e5]/10";

const niceCeil = (max) => {
  if (max <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(max)));
  const n = max / exp;
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return step * exp;
};

/* ═════════════════════════ shared UI ═════════════════════════ */
const Card = ({ title, subtitle, children, className = "" }) => (
  <section
    className={`rounded-xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 ${className}`}
  >
    <header className="mb-3">
      <h3 className="text-sm font-semibold text-gray-800 dark:text-white">{title}</h3>
      {subtitle && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
    </header>
    {children}
  </section>
);

const Empty = ({ children }) => (
  <p className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">{children}</p>
);

const Tooltip = ({ children, style }) => (
  <div
    className="pointer-events-none absolute z-20 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-lg dark:bg-gray-950"
    style={style}
  >
    {children}
  </div>
);

/* ── revenue trend: 2px line + 10% area, crosshair + tooltip ── */
function TrendChart({ points }) {
  const [hover, setHover] = useState(null);
  const plotRef = useRef(null);

  const max = niceCeil(Math.max(1, ...points.map((p) => p.revenue)));
  const xAt = (i) => (points.length < 2 ? 50 : (i / (points.length - 1)) * 100);
  const yAt = (v) => 100 - (v / max) * 100;

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${xAt(i)} ${yAt(p.revenue)}`)
    .join(" ");
  const area = `${line} L${xAt(points.length - 1)} 100 L${xAt(0)} 100 Z`;

  const onMove = (e) => {
    const rect = plotRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const frac = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setHover(points.length < 2 ? 0 : Math.round(frac * (points.length - 1)));
  };

  const active = hover ?? points.length - 1;
  const activePoint = points[active];
  const flip = xAt(active) > 65;

  return (
    <div className="flex">
      <div className="relative h-44 w-11 shrink-0 text-[10px] text-gray-400 dark:text-gray-500">
        {[0, 0.5, 1].map((f) => (
          <span
            key={f}
            className="absolute right-1.5 -translate-y-1/2"
            style={{ top: `${(1 - f) * 100}%` }}
          >
            {fmtCompact(max * f)}
          </span>
        ))}
      </div>

      <div className="min-w-0 flex-1">
        <div
          ref={plotRef}
          className="relative h-44 cursor-crosshair"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          {[0, 50, 100].map((t) => (
            <div
              key={t}
              className="absolute inset-x-0 border-t border-gray-100 dark:border-gray-700"
              style={{ top: `${t}%` }}
            />
          ))}

          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
          >
            {points.length > 1 && <path d={area} className={AREA_FILL} />}
            {points.length > 1 && (
              <path
                d={line}
                fill="none"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
                className={LINE_STROKE}
              />
            )}
          </svg>

          {hover !== null && (
            <div
              className="absolute inset-y-0 border-l border-gray-300 dark:border-gray-600"
              style={{ left: `${xAt(active)}%` }}
            />
          )}

          {activePoint && (
            <span
              className={`absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white dark:ring-gray-800 ${BAR_BG}`}
              style={{ left: `${xAt(active)}%`, top: `${yAt(activePoint.revenue)}%` }}
            />
          )}

          {hover !== null && activePoint && (
            <Tooltip
              style={{
                top: 4,
                left: `${xAt(active)}%`,
                transform: `translateX(${flip ? "calc(-100% - 10px)" : "10px"})`,
              }}
            >
              <p className="font-semibold">{activePoint.label}</p>
              <p>
                {fmt(activePoint.revenue)} · {activePoint.orders} bill
                {activePoint.orders === 1 ? "" : "s"}
              </p>
            </Tooltip>
          )}
        </div>

        <div className="mt-1.5 flex justify-between text-[10px] text-gray-400 dark:text-gray-500">
          <span>{points[0]?.label}</span>
          {points.length > 2 && <span>{points[Math.floor(points.length / 2)]?.label}</span>}
          {points.length > 1 && <span>{points[points.length - 1]?.label}</span>}
        </div>
      </div>
    </div>
  );
}

/* ── peak hours: thin columns, 4px rounded tops, square baseline ── */
function HourlyChart({ rows }) {
  const [hover, setHover] = useState(null);
  const byHour = new Map(rows.map((r) => [r.hour, r]));
  const hours = rows.map((r) => r.hour);
  const from = Math.max(0, Math.min(...hours) - 1);
  const to = Math.min(23, Math.max(...hours) + 1);
  const range = Array.from({ length: to - from + 1 }, (_, i) => from + i);
  const maxOrders = Math.max(1, ...rows.map((r) => r.orders));
  const peak = rows.reduce((a, b) => (b.orders > a.orders ? b : a), rows[0]);

  return (
    <div>
      <div className="flex h-32 items-end gap-[3px] border-b border-gray-200 dark:border-gray-600">
        {range.map((h) => {
          const row = byHour.get(h);
          const height = row ? Math.max(4, (row.orders / maxOrders) * 100) : 0;
          return (
            <div
              key={h}
              className="relative flex h-full flex-1 items-end justify-center"
              onMouseEnter={() => setHover(h)}
              onMouseLeave={() => setHover(null)}
            >
              {row && (
                <div
                  className={`w-full max-w-[24px] rounded-t-[4px] ${BAR_BG} ${
                    hover !== null && hover !== h ? "opacity-50" : ""
                  }`}
                  style={{ height: `${height}%` }}
                />
              )}
              {hover === h && (
                <Tooltip
                  style={{
                    bottom: "100%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    marginBottom: 6,
                  }}
                >
                  <p className="font-semibold">{hourRange(h)}</p>
                  <p>{row ? `${row.orders} bills · ${fmt(row.revenue)}` : "No bills"}</p>
                </Tooltip>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-1 flex gap-[3px] text-[10px] text-gray-400 dark:text-gray-500">
        {range.map((h) => (
          <span key={h} className="flex-1 text-center">
            {range.length > 14 && (h - from) % 2 !== 0 ? "" : hourLabel(h)}
          </span>
        ))}
      </div>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        Busiest hour:{" "}
        <span className="font-semibold text-gray-800 dark:text-white">{hourRange(peak.hour)}</span> ·{" "}
        {peak.orders} bills · {fmt(peak.revenue)}
      </p>
    </div>
  );
}

/* ── ranked horizontal bars (single hue) ── */
function BarList({ rows, valueLabel }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-2.5">
      {rows.map((row, i) => (
        <li key={row.key ?? i}>
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="min-w-0 truncate font-medium text-gray-700 dark:text-gray-200">
              <span className="mr-1.5 text-gray-400 dark:text-gray-500">{i + 1}</span>
              {row.label}
            </span>
            <span className="shrink-0 text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-gray-800 dark:text-white">{valueLabel(row)}</span>
              {row.sub ? ` · ${row.sub}` : ""}
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full rounded-r bg-gray-100 dark:bg-gray-700">
            <div
              className={`h-full rounded-r-[4px] ${BAR_BG}`}
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ── part-to-whole: one stacked bar (2px gaps) + legend ── */
function ShareBar({ rows, total, format }) {
  const sum = total || rows.reduce((s, r) => s + r.value, 0) || 1;
  return (
    <div>
      <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded-[4px]">
        {rows.map((row, i) => (
          <div
            key={row.key}
            title={`${row.label}: ${format(row.value)} (${((row.value / sum) * 100).toFixed(0)}%)`}
            className={i < SERIES.length ? SERIES[i] : OTHER_BG}
            style={{ width: `${(row.value / sum) * 100}%` }}
          />
        ))}
      </div>
      <ul className="mt-3 space-y-1.5">
        {rows.map((row, i) => (
          <li key={row.key} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex min-w-0 items-center gap-2 text-gray-700 dark:text-gray-200">
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-sm ${i < SERIES.length ? SERIES[i] : OTHER_BG}`}
              />
              <span className="truncate">{row.label}</span>
            </span>
            <span className="shrink-0 text-gray-500 dark:text-gray-400">
              <span className="font-semibold text-gray-800 dark:text-white">{format(row.value)}</span>
              {" · "}
              {((row.value / sum) * 100).toFixed(0)}%
              {row.sub ? ` · ${row.sub}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// 3 named series + "Other" (the palette is only validated for the first three together)
const foldRows = (rows, keep = SERIES.length + 1) => {
  if (rows.length <= keep) return rows;
  const head = rows.slice(0, keep - 1);
  const tail = rows.slice(keep - 1);
  const bills = tail.reduce((s, r) => s + (r.countRaw || 0), 0);
  return [
    ...head,
    {
      key: "other",
      label: "Other",
      value: tail.reduce((s, r) => s + r.value, 0),
      sub: bills ? `${bills} bills` : "",
    },
  ];
};

const Stat = ({ label, value, sub, tone = "text-gray-900 dark:text-white" }) => (
  <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
      {label}
    </p>
    <p className={`mt-0.5 text-2xl font-bold leading-tight ${tone}`}>{value}</p>
    {sub && <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">{sub}</p>}
  </div>
);

/* ═════════════════════════ page ═════════════════════════ */
const AdminDashboard = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantId, setRestaurantId] = useState("");
  const [activePreset, setActivePreset] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [customActive, setCustomActive] = useState(false);

  const [summary, setSummary] = useState(null);
  const [insights, setInsights] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [trend, setTrend] = useState({ points: [], monthly: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async (scopeId, range) => {
    try {
      setLoading(true);
      setError("");
      const params = { ...range, ...(scopeId ? { restaurantId: scopeId } : {}) };

      const [s, i, b, t, d] = await Promise.all([
        getAdminSummary(params),
        getAdminInsights(params),
        getRestaurantBreakdown(params),
        getTopItems(params),
        getDailySales(params),
      ]);

      let points = (d.data?.data || []).map((row) => {
        const [day, month, year] = String(row.date).split("/").map(Number);
        const date = new Date(year, month - 1, day);
        return {
          label: date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
          revenue: row.revenue || 0,
          orders: row.orders || 0,
        };
      });

      let monthly = false;
      if (points.length > 62) {
        const m = await getMonthlyChart(params);
        monthly = true;
        points = (m.data?.data || []).map((row) => {
          const [month, year] = String(row.month).split("/").map(Number);
          return {
            label: new Date(year, month - 1, 1).toLocaleDateString("en-IN", {
              month: "short",
              year: "2-digit",
            }),
            revenue: row.revenue || 0,
            orders: row.orders || 0,
          };
        });
      }

      setSummary(s.data?.data || {});
      setInsights(i.data?.data || {});
      setBreakdown(b.data?.data || []);
      setTopItems(t.data?.data || []);
      setTrend({ points, monthly });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    getRestaurants()
      .then((list) => setRestaurants(Array.isArray(list) ? list : []))
      .catch(() => setRestaurants([]));
    fetchData("", {});
  }, [fetchData]);

  const currentRange = () => {
    if (activePreset === "custom") return customActive ? { startDate, endDate } : {};
    return getDateRange(activePreset);
  };

  const changeRestaurant = (id) => {
    setRestaurantId(id);
    fetchData(id, currentRange());
  };

  const applyPreset = (key) => {
    setActivePreset(key);
    setCustomActive(false);
    setStartDate("");
    setEndDate("");
    fetchData(restaurantId, getDateRange(key));
  };

  const applyCustom = () => {
    if (!startDate && !endDate) return;
    setCustomActive(true);
    fetchData(restaurantId, { startDate, endDate });
  };

  const reset = () => {
    setRestaurantId("");
    setActivePreset("all");
    setCustomActive(false);
    setStartDate("");
    setEndDate("");
    fetchData("", {});
  };

  /* ── derived data ── */
  const totalRevenue = insights?.revenue ?? summary?.totalRevenue ?? 0;
  const paidBills = insights?.paidBills ?? 0;
  const avgBill = paidBills ? totalRevenue / paidBills : 0;

  const roles = useMemo(() => {
    const map = new Map();
    breakdown.forEach((r) =>
      (r.employeeRoles || []).forEach((role) =>
        map.set(role.role, (map.get(role.role) || 0) + role.count)
      )
    );
    return [...map.entries()]
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count);
  }, [breakdown]);

  const vendors = useMemo(() => {
    const map = new Map();
    breakdown.forEach((r) =>
      (r.topVendors || []).forEach((v) => {
        const key = String(v._id);
        const cur = map.get(key) || { ...v, spend: 0, orders: 0, outstanding: 0 };
        cur.spend += v.spend || 0;
        cur.orders += v.orders || 0;
        cur.outstanding += v.outstanding || 0;
        map.set(key, cur);
      })
    );
    return [...map.values()].sort((a, b) => b.spend - a.spend).slice(0, 5);
  }, [breakdown]);

  const paymentRows = useMemo(
    () =>
      foldRows(
        (insights?.paymentMix || []).map((row) => ({
          key: row.method,
          label: titleCase(row.method),
          value: row.amount,
          countRaw: row.count,
          sub: `${row.count} bill${row.count === 1 ? "" : "s"}`,
        }))
      ),
    [insights]
  );

  const orderMixRows = useMemo(
    () =>
      foldRows(
        (insights?.orderTypes || []).map((row) => ({
          key: row.type,
          label: titleCase(row.type),
          value: row.revenue,
          countRaw: row.orders,
          sub: `${row.orders} bill${row.orders === 1 ? "" : "s"}`,
        }))
      ),
    [insights]
  );

  const restaurantShare = useMemo(
    () =>
      foldRows(
        breakdown
          .filter((r) => (r.totalRevenue || 0) > 0)
          .sort((a, b) => b.totalRevenue - a.totalRevenue)
          .map((r) => ({ key: String(r._id), label: r.name, value: r.totalRevenue }))
      ),
    [breakdown]
  );

  const showAll = !restaurantId;
  const showShare = showAll && restaurantShare.length > 1;

  const scopeName = restaurantId
    ? restaurants.find((r) => r._id === restaurantId)?.name || "Restaurant"
    : `All restaurants${summary?.totalRestaurants ? ` (${summary.totalRestaurants})` : ""}`;

  const periodName =
    activePreset === "custom"
      ? customActive && startDate
        ? `${startDate} → ${endDate || "now"}`
        : "Custom range"
      : PRESETS.find((p) => p.key === activePreset)?.label || "All Time";

  const selectClass =
    "min-h-9 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white";
  const labelClass =
    "text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400";

  return (
    <div className="min-h-screen space-y-3 bg-gradient-to-br from-slate-100 to-blue-50 p-3 dark:from-gray-900 dark:to-gray-800 sm:p-5">
      {/* ── FILTER BAR ── */}
      <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-wrap items-center gap-2">
          <label className={labelClass}>Restaurant</label>
          <select
            value={restaurantId}
            onChange={(e) => changeRestaurant(e.target.value)}
            className={`${selectClass} min-w-[180px]`}
          >
            <option value="">All Restaurants</option>
            {restaurants.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name}
              </option>
            ))}
          </select>

          <label className={`${labelClass} ml-2`}>Period</label>
          <select
            value={activePreset}
            onChange={(e) => {
              const key = e.target.value;
              if (key === "custom") {
                setActivePreset("custom");
                setCustomActive(false);
              } else {
                applyPreset(key);
              }
            }}
            className={`${selectClass} min-w-[150px]`}
          >
            {PRESETS.map(({ label, key }) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
            <option value="custom">Date Wise</option>
          </select>

          {activePreset === "custom" && (
            <>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                aria-label="From date"
                className={selectClass}
              />
              <span className="text-xs text-gray-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                aria-label="To date"
                className={selectClass}
              />
              <button
                onClick={applyCustom}
                disabled={!startDate && !endDate}
                className="min-h-9 rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 disabled:opacity-40"
              >
                Apply
              </button>
            </>
          )}

          <button
            onClick={reset}
            className="min-h-9 rounded-lg bg-gray-100 px-4 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 sm:ml-auto"
          >
            Reset
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Showing{" "}
          <span className="font-semibold text-gray-700 dark:text-gray-200">{scopeName}</span> ·{" "}
          {periodName}
        </p>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <p className="animate-pulse text-base text-gray-400 dark:text-gray-500">Loading dashboard…</p>
        </div>
      ) : error ? (
        <p className="rounded-xl bg-red-50 px-5 py-4 text-base text-red-500 dark:bg-red-900/20">
          {error}
        </p>
      ) : (
        <>
          {/* ── KPI ROW ── */}
          <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-6">
            <div className="col-span-2 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 px-5 py-4 text-white shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/75">
                Total Revenue
              </p>
              <p className="mt-1 text-5xl font-extrabold leading-none">{fmt(totalRevenue)}</p>
              <p className="mt-2 text-xs font-medium text-white/80">
                {paidBills} paid bill{paidBills === 1 ? "" : "s"} · {fmt(avgBill)} average
              </p>
            </div>
            <Stat
              label="Orders"
              value={summary?.totalOrders ?? 0}
              sub={`${paidBills} paid`}
              tone="text-violet-600 dark:text-violet-400"
            />
            <Stat label="Avg Bill" value={fmt(avgBill)} sub="Revenue ÷ paid bills" />
            <Stat
              label="Staff"
              value={summary?.totalEmployees ?? 0}
              sub={showAll ? `${summary?.totalRestaurants ?? 0} restaurants` : "Active employees"}
              tone="text-sky-600 dark:text-sky-400"
            />
            <Stat
              label="Vendor Payable"
              value={fmt(summary?.pendingVendorPayables ?? 0)}
              sub={`${fmt(summary?.totalVendorSpend ?? 0)} spent`}
              tone={
                (summary?.pendingVendorPayables ?? 0) > 0
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-gray-900 dark:text-white"
              }
            />
          </div>

          {/* ── TREND + PAYMENT MIX ── */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <Card
              className="lg:col-span-2"
              title="Revenue trend"
              subtitle={trend.monthly ? "Monthly revenue" : "Daily revenue"}
            >
              {trend.points.length ? (
                <TrendChart points={trend.points} />
              ) : (
                <Empty>No paid bills in this period.</Empty>
              )}
            </Card>

            <Card title="Payment mix" subtitle="Share of revenue by method">
              {paymentRows.length ? (
                <ShareBar rows={paymentRows} total={totalRevenue} format={fmt} />
              ) : (
                <Empty>No payments yet.</Empty>
              )}
            </Card>
          </div>

          {/* ── PEAK HOURS + BILLING HEALTH ── */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <Card className="lg:col-span-2" title="Peak hours" subtitle="Paid bills by hour of day">
              {insights?.hourly?.length ? (
                <HourlyChart rows={insights.hourly} />
              ) : (
                <Empty>No data yet.</Empty>
              )}
            </Card>

            <Card title="Billing health" subtitle="Adjustments in this period">
              <dl className="divide-y divide-gray-100 text-sm dark:divide-gray-700">
                {[
                  {
                    label: "Voided bills",
                    value: insights?.voided?.count || 0,
                    sub: fmt(insights?.voided?.amount || 0),
                    flag: (insights?.voided?.count || 0) > 0,
                  },
                  { label: "Discounts given", value: fmt(insights?.discount || 0) },
                  {
                    label: "Complimentary",
                    value: fmt(insights?.complimentary || 0),
                    sub: `${insights?.complimentaryBills || 0} bills`,
                  },
                  { label: "Tax collected", value: fmt(insights?.tax || 0), sub: "CGST + SGST" },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between py-2.5">
                    <dt className="text-gray-600 dark:text-gray-300">{row.label}</dt>
                    <dd className="text-right">
                      <span
                        className={`font-bold ${
                          row.flag
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-gray-900 dark:text-white"
                        }`}
                      >
                        {row.value}
                      </span>
                      {row.sub && (
                        <span className="ml-1.5 text-xs text-gray-500 dark:text-gray-400">
                          {row.sub}
                        </span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
          </div>

          {/* ── ITEMS · ORDER MIX · TEAM ── */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <Card title="Top items" subtitle="By quantity sold">
              {topItems.length ? (
                <BarList
                  rows={topItems.slice(0, 6).map((item) => ({
                    key: item._id,
                    label: item.name,
                    value: item.totalSold || 0,
                    sub: fmt(item.revenue || 0),
                  }))}
                  valueLabel={(row) => `${row.value} sold`}
                />
              ) : (
                <Empty>No paid item sales yet.</Empty>
              )}
            </Card>

            <Card title="Order mix" subtitle="Share of revenue by order type">
              {orderMixRows.length ? (
                <ShareBar rows={orderMixRows} total={totalRevenue} format={fmt} />
              ) : (
                <Empty>No data yet.</Empty>
              )}

              {insights?.topWaiters?.length > 0 && (
                <div className="mt-4 border-t border-gray-100 pt-3 dark:border-gray-700">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Top waiters
                  </p>
                  <BarList
                    rows={insights.topWaiters.map((w) => ({
                      key: w._id,
                      label: w.name,
                      value: w.revenue,
                      sub: `${w.orders} bills`,
                    }))}
                    valueLabel={(row) => fmt(row.value)}
                  />
                </div>
              )}
            </Card>

            <Card title="Team" subtitle={`${summary?.totalEmployees ?? 0} active employees`}>
              {roles.length ? (
                <ul className="space-y-2">
                  {roles.map((r) => (
                    <li key={r.role} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-200">{titleCase(r.role)}</span>
                      <span className="rounded-md bg-violet-50 px-2 py-0.5 text-xs font-bold text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                        {r.count}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty>No active employees.</Empty>
              )}
            </Card>
          </div>

          {/* ── VENDORS + RESTAURANT SHARE ── */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <Card
              className={showShare ? "lg:col-span-2" : "lg:col-span-3"}
              title="Vendor spend"
              subtitle={`${summary?.totalActiveVendors ?? 0} active vendors · ${
                summary?.paidVendorSettlements ?? 0
              }/${summary?.totalVendorSettlements ?? 0} settlements paid`}
            >
              {vendors.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead className="text-left text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      <tr>
                        <th className="pb-2 font-semibold">Vendor</th>
                        <th className="pb-2 text-right font-semibold">Orders</th>
                        <th className="pb-2 text-right font-semibold">Spend</th>
                        <th className="pb-2 text-right font-semibold">Outstanding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {vendors.map((v) => (
                        <tr key={v._id}>
                          <td className="py-2 font-medium text-gray-800 dark:text-gray-100">
                            {v.name}
                            {v.vendorCode && v.vendorCode !== "-" && (
                              <span className="ml-1.5 text-[11px] text-gray-400">{v.vendorCode}</span>
                            )}
                          </td>
                          <td className="py-2 text-right tabular-nums text-gray-600 dark:text-gray-300">
                            {v.orders}
                          </td>
                          <td className="py-2 text-right font-semibold tabular-nums text-gray-900 dark:text-white">
                            {fmt(v.spend)}
                          </td>
                          <td
                            className={`py-2 text-right tabular-nums ${
                              v.outstanding > 0
                                ? "font-semibold text-amber-600 dark:text-amber-400"
                                : "text-gray-400"
                            }`}
                          >
                            {v.outstanding > 0 ? fmt(v.outstanding) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty>No vendor orders in this period.</Empty>
              )}
            </Card>

            {showShare && (
              <Card title="Revenue by restaurant" subtitle="Share of total revenue">
                <ShareBar rows={restaurantShare} total={totalRevenue} format={fmt} />
              </Card>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
