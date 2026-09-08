import API from "./api";

/* =========================================================
   SUPER ADMIN · SYSTEM USAGE
========================================================= */
export const getSystemUsage = async (params = {}) => {
  const res = await API.get("/super_admin/system-usage", { params });
  return res.data?.data || {};
};

/* Admin-scoped: only the accounts this admin created / manages. */
export const getAdminSystemUsage = async (params = {}) => {
  const res = await API.get("/admin-dashboard/system-usage", { params });
  return res.data?.data || {};
};

/* =========================================================
   LOGOUT TRACKING
   Best-effort: records the server-side last-logout time
   before local storage is cleared. Never blocks logout.
========================================================= */
export const recordLogout = async () => {
  try {
    if (!localStorage.getItem("token")) return;
    await API.post("/session/logout");
  } catch {
    /* logout must never fail because of tracking */
  }
};
