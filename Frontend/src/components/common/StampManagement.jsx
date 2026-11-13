import { createElement, useCallback, useEffect, useMemo, useState } from "react";
import { FaDownload, FaExternalLinkAlt, FaGift, FaQrcode, FaStamp, FaStar } from "react-icons/fa";
import { getRestaurants } from "../../services/restaurant.service";
import { getStampOverview, redeemStampReward, updateStampSettings } from "../../services/stamp.service";

const getPublicOrigin = () =>
  (import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, "");

const getStampUrl = (restaurantId) => `${getPublicOrigin()}/stamp/${restaurantId}`;

const getQrImageUrl = (url, size = 320) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;

const getAssignedRestaurant = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const restaurantId =
      typeof user?.restaurant === "object" ? user?.restaurant?._id : user?.restaurant || "";
    const restaurantName =
      typeof user?.restaurant === "object"
        ? user?.restaurant?.name
        : user?.restaurantName || "Assigned Restaurant";
    return { restaurantId, restaurantName };
  } catch {
    return { restaurantId: "", restaurantName: "Assigned Restaurant" };
  }
};

const card =
  "rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:ring-neutral-700 sm:p-5";
const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-400 disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-800 dark:text-white";

const Stars = ({ rating }) => (
  <span className="text-amber-400">
    {"★".repeat(rating)}
    <span className="text-slate-200 dark:text-neutral-700">{"★".repeat(5 - rating)}</span>
  </span>
);

const fmtDate = (value) => (value ? new Date(value).toLocaleDateString() : "-");
const fmtDateTime = (value) => (value ? new Date(value).toLocaleString() : "-");

const TABS = [
  { key: "qr", label: "QR Code", icon: FaQrcode },
  { key: "stamps", label: "Digital Stamps", icon: FaStamp },
  { key: "reviews", label: "Reviews", icon: FaStar },
  { key: "reward", label: "Reward", icon: FaGift },
];

export default function StampManagement({ mode = "admin" }) {
  const isAdmin = mode === "admin";
  const assigned = useMemo(() => getAssignedRestaurant(), []);

  const [restaurants, setRestaurants] = useState([]);
  const [restaurantId, setRestaurantId] = useState(isAdmin ? "" : assigned.restaurantId);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("qr");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!isAdmin) return;
    getRestaurants()
      .then((list) => {
        const items = list || [];
        setRestaurants(items);
        if (items.length) setRestaurantId(items[0]._id);
      })
      .catch(() => setError("Failed to load restaurants"));
  }, [isAdmin]);

  const load = useCallback(async () => {
    if (!restaurantId) return;
    try {
      setLoading(true);
      setError("");
      const overview = await getStampOverview(restaurantId);
      setData(overview);
      setForm({
        enabled: overview.settings.enabled,
        stampsRequired: overview.settings.stampsRequired,
        rewardTitle: overview.settings.rewardTitle,
        rewardDescription: overview.settings.rewardDescription || "",
        rewardValidityDays: overview.settings.rewardValidityDays,
        cooldownHours: overview.settings.cooldownHours,
        welcomeMessage: overview.settings.welcomeMessage,
      });
    } catch (err) {
      setData(null);
      setError(err?.response?.data?.message || "Failed to load stamp data");
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => {
    load();
  }, [load]);

  const restaurantName = isAdmin
    ? restaurants.find((r) => r._id === restaurantId)?.name || data?.restaurant?.name || ""
    : data?.restaurant?.name || assigned.restaurantName;

  const stampUrl = restaurantId ? getStampUrl(restaurantId) : "";
  const qrUrl = stampUrl ? getQrImageUrl(stampUrl) : "";

  const downloadQr = async () => {
    try {
      const blob = await (await fetch(qrUrl)).blob();
      const href = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = href;
      const base = `${restaurantName || "restaurant"}-stamp-qr`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      link.download = `${base}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(href);
    } catch {
      window.open(qrUrl, "_blank", "noopener,noreferrer");
    }
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setNotice("");
      setError("");
      await updateStampSettings(restaurantId, {
        ...form,
        stampsRequired: Number(form.stampsRequired),
        rewardValidityDays: Number(form.rewardValidityDays),
        cooldownHours: Number(form.cooldownHours),
      });
      setNotice("Reward settings saved");
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const redeem = async (cardId, rewardId) => {
    try {
      setError("");
      await redeemStampReward(restaurantId, cardId, rewardId);
      await load();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to redeem reward");
      load();
    }
  };

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    const cards = data?.cards || [];
    if (!q) return cards;
    return cards.filter(
      (c) =>
        (c.customerName || "").toLowerCase().includes(q) || (c.customerPhone || "").includes(q)
    );
  }, [data, search]);

  const stats = data?.stats;
  const required = data?.settings?.stampsRequired || 5;

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Stamp</h1>
          <p className="text-sm text-slate-500 dark:text-neutral-400">
            Customers scan the QR, leave a review and collect digital stamps towards a reward.
          </p>
        </div>

        {isAdmin ? (
          <select
            value={restaurantId}
            onChange={(e) => setRestaurantId(e.target.value)}
            className={`${inputCls} sm:w-64`}
          >
            {restaurants.length === 0 && <option value="">No restaurants</option>}
            {restaurants.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name}
              </option>
            ))}
          </select>
        ) : (
          <span className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            {restaurantName}
          </span>
        )}
      </div>

      {!restaurantId && !error && (
        <div className={`${card} text-center text-sm text-slate-500 dark:text-neutral-400`}>
          {isAdmin ? "Select a restaurant to continue." : "No restaurant is assigned to you."}
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      )}
      {notice && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
          {notice}
        </p>
      )}

      {restaurantId && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {[
              ["Customers", stats?.customers ?? 0],
              ["Stamps given", stats?.totalStamps ?? 0],
              ["Reviews", stats?.reviews ?? 0],
              ["Avg rating", stats?.averageRating ?? 0],
              ["Rewards (used/earned)", `${stats?.rewardsRedeemed ?? 0}/${stats?.rewardsEarned ?? 0}`],
            ].map(([label, value]) => (
              <div key={label} className={card}>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-neutral-400">
                  {label}
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  tab === key
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-neutral-900 dark:text-neutral-300 dark:ring-neutral-700 dark:hover:bg-neutral-800"
                }`}
              >
                {createElement(Icon)} {label}
              </button>
            ))}
          </div>

          {loading && !data && (
            <p className="text-sm text-slate-500 dark:text-neutral-400">Loading...</p>
          )}

          {tab === "qr" && (
            <div className={`${card} flex flex-col items-center gap-4 text-center`}>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{restaurantName}</h2>
              <img
                src={qrUrl}
                alt="Stamp QR code"
                className="h-64 w-64 rounded-2xl bg-white p-3 ring-1 ring-slate-200"
              />
              <p className="max-w-md break-all text-xs text-slate-500 dark:text-neutral-400">{stampUrl}</p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={downloadQr}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  <FaDownload /> Download QR
                </button>
                <a
                  href={stampUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100 dark:text-neutral-200 dark:ring-neutral-700 dark:hover:bg-neutral-800"
                >
                  <FaExternalLinkAlt /> Open page
                </a>
              </div>
              <p className="text-xs text-slate-500 dark:text-neutral-400">
                Print this QR and place it on tables or at the counter. One QR per restaurant.
              </p>
            </div>
          )}

          {tab === "stamps" && (
            <div className={`${card} space-y-4`}>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or phone..."
                className={inputCls}
              />
              {filteredCards.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500 dark:text-neutral-400">
                  No stamp cards yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {filteredCards.map((c) => (
                    <div
                      key={c._id}
                      className="rounded-xl border border-slate-200 p-4 dark:border-neutral-700"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {c.customerName || "Customer"}
                          </p>
                          <p className="text-sm text-slate-500 dark:text-neutral-400">{c.customerPhone}</p>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-neutral-400">
                          Last stamp: {fmtDateTime(c.lastStampAt)} · Total: {c.totalStamps}
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {Array.from({ length: required }).map((_, i) => (
                          <span
                            key={i}
                            className={`flex h-7 w-7 items-center justify-center rounded-full border-2 text-xs ${
                              i < c.stamps
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : "border-dashed border-slate-300 text-transparent dark:border-neutral-600"
                            }`}
                          >
                            ✓
                          </span>
                        ))}
                        <span className="ml-1 self-center text-xs font-semibold text-slate-600 dark:text-neutral-300">
                          {c.stamps}/{required}
                        </span>
                      </div>

                      {c.rewards.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {c.rewards.map((r) => (
                            <div
                              key={r._id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-neutral-800"
                            >
                              <span className="text-slate-700 dark:text-neutral-200">
                                <FaGift className="mr-1.5 inline text-emerald-600 dark:text-emerald-400" />
                                {r.title} ·{" "}
                                <span className="font-mono font-bold">{r.code}</span>
                                <span className="ml-2 text-xs text-slate-500 dark:text-neutral-400">
                                  {r.redeemed
                                    ? `Redeemed ${fmtDate(r.redeemedAt)}`
                                    : r.expired
                                    ? "Expired"
                                    : `Valid till ${fmtDate(r.expiresAt)}`}
                                </span>
                              </span>
                              {!r.redeemed && !r.expired && (
                                <button
                                  type="button"
                                  onClick={() => redeem(c._id, r._id)}
                                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
                                >
                                  Mark redeemed
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "reviews" && (
            <div className={`${card} space-y-3`}>
              {(data?.reviews || []).length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-500 dark:text-neutral-400">
                  No reviews from the stamp QR yet.
                </p>
              ) : (
                data.reviews.map((r) => (
                  <div
                    key={r._id}
                    className="rounded-xl border border-slate-200 p-4 dark:border-neutral-700"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {r.customerName || "Customer"}{" "}
                        <span className="text-sm font-normal text-slate-500 dark:text-neutral-400">
                          {r.customerPhone}
                        </span>
                      </p>
                      <Stars rating={r.rating} />
                    </div>
                    {r.comment && (
                      <p className="mt-2 text-sm text-slate-600 dark:text-neutral-300">{r.comment}</p>
                    )}
                    <p className="mt-2 text-xs text-slate-400 dark:text-neutral-500">
                      {fmtDateTime(r.createdAt)}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "reward" && form && (
            <form onSubmit={saveSettings} className={`${card} space-y-4`}>
              {!isAdmin && (
                <p className="text-sm text-slate-500 dark:text-neutral-400">
                  Only the admin can change the reward. This is what customers currently see.
                </p>
              )}
              <label className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-neutral-200">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  disabled={!isAdmin}
                  onChange={(e) => setForm({ ...form, enabled: e.target.checked })}
                />
                Stamp rewards enabled
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700 dark:text-neutral-200">
                  Stamps needed for reward
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={form.stampsRequired}
                    disabled={!isAdmin}
                    onChange={(e) => setForm({ ...form, stampsRequired: e.target.value })}
                    className={`${inputCls} mt-1`}
                  />
                </label>
                <label className="text-sm font-medium text-slate-700 dark:text-neutral-200">
                  Reward name
                  <input
                    value={form.rewardTitle}
                    maxLength={80}
                    disabled={!isAdmin}
                    onChange={(e) => setForm({ ...form, rewardTitle: e.target.value })}
                    placeholder="e.g. Free dessert, 20% off"
                    className={`${inputCls} mt-1`}
                  />
                </label>
                <label className="text-sm font-medium text-slate-700 dark:text-neutral-200 sm:col-span-2">
                  Reward details (optional)
                  <textarea
                    rows={2}
                    maxLength={300}
                    value={form.rewardDescription}
                    disabled={!isAdmin}
                    onChange={(e) => setForm({ ...form, rewardDescription: e.target.value })}
                    className={`${inputCls} mt-1`}
                  />
                </label>
                <label className="text-sm font-medium text-slate-700 dark:text-neutral-200">
                  Reward valid for (days)
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={form.rewardValidityDays}
                    disabled={!isAdmin}
                    onChange={(e) => setForm({ ...form, rewardValidityDays: e.target.value })}
                    className={`${inputCls} mt-1`}
                  />
                </label>
                <label className="text-sm font-medium text-slate-700 dark:text-neutral-200">
                  Hours between stamps (same phone)
                  <input
                    type="number"
                    min="0"
                    max="720"
                    value={form.cooldownHours}
                    disabled={!isAdmin}
                    onChange={(e) => setForm({ ...form, cooldownHours: e.target.value })}
                    className={`${inputCls} mt-1`}
                  />
                </label>
                <label className="text-sm font-medium text-slate-700 dark:text-neutral-200 sm:col-span-2">
                  Message shown to customers
                  <input
                    value={form.welcomeMessage}
                    maxLength={200}
                    disabled={!isAdmin}
                    onChange={(e) => setForm({ ...form, welcomeMessage: e.target.value })}
                    className={`${inputCls} mt-1`}
                  />
                </label>
              </div>

              {isAdmin && (
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save reward"}
                </button>
              )}
            </form>
          )}
        </>
      )}
    </div>
  );
}
