const SESSION_TIMEOUT_MS = 4 * 24 * 60 * 60 * 1000;
const LAST_ACTIVITY_KEY = "authLastActivity";

const authKeys = ["token", "user", "role", LAST_ACTIVITY_KEY];

const getLoginPath = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return user?.role === "super_admin" ? "/superadmin-login" : "/login";
  } catch {
    return "/login";
  }
};

export const markSessionActivity = () => {
  if (!localStorage.getItem("token")) return;
  localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
};

export const startSession = () => {
  localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
};

export const hasSessionTimedOut = () => {
  const token = localStorage.getItem("token");
  if (!token) return false;

  const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
  if (!lastActivity) return true;

  return Date.now() - lastActivity > SESSION_TIMEOUT_MS;
};

export const clearAuthSession = () => {
  authKeys.forEach((key) => localStorage.removeItem(key));
};

export const enforceSession = () => {
  if (!hasSessionTimedOut()) return true;
  clearAuthSession();
  return false;
};

export const setupSessionActivityTracking = () => {
  let lastWrite = 0;

  const updateActivity = () => {
    if (!localStorage.getItem("token")) return;
    const loginPath = getLoginPath();
    if (!enforceSession()) {
      window.location.replace(loginPath);
      return;
    }

    const now = Date.now();
    if (now - lastWrite < 60 * 1000) return;
    lastWrite = now;
    markSessionActivity();
  };

  const events = ["click", "keydown", "mousemove", "scroll", "touchstart"];
  events.forEach((event) =>
    window.addEventListener(event, updateActivity, { passive: true })
  );

  return () => {
    events.forEach((event) =>
      window.removeEventListener(event, updateActivity)
    );
  };
};
