const API_BASE_URL = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
const STORAGE_KEY = "projectAnalyticsSessionId";
const LAST_PAGE_VIEW_KEY = "projectAnalyticsLastPageView";

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getDeviceType = () => {
  const ua = navigator.userAgent || "";
  if (/ipad|tablet|playbook|silk/i.test(ua)) return "tablet";
  if (/mobi|android|iphone|ipod/i.test(ua)) return "mobile";
  return "desktop";
};

const getBrowser = () => {
  const ua = navigator.userAgent || "";
  if (/Edg\//.test(ua)) return "Edge";
  if (/OPR\//.test(ua) || /Opera/.test(ua)) return "Opera";
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return "Chrome";
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "Safari";
  if (/Firefox\//.test(ua)) return "Firefox";
  return "Unknown";
};

const getOs = () => {
  const ua = navigator.userAgent || "";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Android/i.test(ua)) return "Android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
  if (/Mac OS X|Macintosh/i.test(ua)) return "macOS";
  if (/Linux/i.test(ua)) return "Linux";
  return "Unknown";
};

const getSessionId = () => {
  let sessionId = sessionStorage.getItem(STORAGE_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(STORAGE_KEY, sessionId);
  }
  return sessionId;
};

export const resetAnalyticsSession = () => {
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(LAST_PAGE_VIEW_KEY);
};

const getPayloadBase = () => {
  const user = getCurrentUser();
  return {
    sessionId: getSessionId(),
    deviceType: getDeviceType(),
    browser: getBrowser(),
    os: getOs(),
    screenWidth: window.screen?.width || null,
    screenHeight: window.screen?.height || null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    referrer: document.referrer || "",
    role: user?.role || "guest",
    userId: user?.id || null,
  };
};

const postAnalytics = async (path, payload, keepalive = false) => {
  await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
    keepalive,
  });
};

export const startAnalyticsSession = async ({ path, title }) => {
  await postAnalytics("/project-analytics/session/start", {
    ...getPayloadBase(),
    path,
    title,
  });
};

export const trackAnalyticsPageView = async ({ path, title }) => {
  const dedupeKey = `${path}::${title}`;
  const now = Date.now();

  try {
    const previous = JSON.parse(sessionStorage.getItem(LAST_PAGE_VIEW_KEY) || "null");
    if (
      previous?.key === dedupeKey &&
      Number.isFinite(previous?.timestamp) &&
      now - previous.timestamp < 2000
    ) {
      return;
    }
  } catch {
    // Ignore malformed session storage.
  }

  sessionStorage.setItem(
    LAST_PAGE_VIEW_KEY,
    JSON.stringify({ key: dedupeKey, timestamp: now })
  );

  await postAnalytics("/project-analytics/page-view", {
    ...getPayloadBase(),
    path,
    title,
  });
};

export const pingAnalyticsSession = async ({ path }) => {
  await postAnalytics("/project-analytics/session/ping", {
    sessionId: getSessionId(),
    path,
  });
};

export const endAnalyticsSession = async ({ path }) => {
  try {
    await postAnalytics(
      "/project-analytics/session/end",
      {
        sessionId: getSessionId(),
        path,
      },
      true
    );
  } catch {
    // Ignore unload/network timing failures.
  }
};

export const trackAnalyticsEvent = async ({
  eventType,
  featureKey = "",
  featureLabel = "",
  path = window.location.pathname || "/",
  details = {},
}) => {
  await postAnalytics("/project-analytics/event", {
    sessionId: getSessionId(),
    path,
    eventType,
    featureKey,
    featureLabel,
    details,
  });
};
