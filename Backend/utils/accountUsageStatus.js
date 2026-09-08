/* =========================================================
   ACCOUNT USAGE STATUS
   Shared helpers for the Super Admin & Admin "System Usage"
   screens: turns login / activity timestamps into a status.
========================================================= */

export const ONLINE_WINDOW_MS = 5 * 60 * 1000;
export const DAY_MS = 24 * 60 * 60 * 1000;

export const roleLabel = (value = "") =>
  String(value)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const computeStatus = (acc, idleMs, now) => {
  if (!acc.lastLoginAt && !acc.lastActivityAt) {
    return { status: "never", idleDays: null };
  }

  const activity = acc.lastActivityAt || acc.lastLoginAt;
  const sinceMs = now - new Date(activity).getTime();

  if (sinceMs <= ONLINE_WINDOW_MS) return { status: "online", idleDays: 0 };

  const idleDays = Math.floor(sinceMs / DAY_MS);
  if (sinceMs >= idleMs) return { status: "idle", idleDays };
  return { status: "offline", idleDays };
};

export const byName = (a, b) =>
  String(a.name || "").localeCompare(String(b.name || ""));

export const parseIdleDays = (raw, fallback = 3) =>
  Math.min(365, Math.max(1, Number(raw) || fallback));
