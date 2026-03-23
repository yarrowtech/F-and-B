import API from "./api";

/* =========================================================
   👨‍💼 ADMIN DASHBOARD SERVICES (UPDATED)
========================================================= */

/* ================= SUMMARY ================= */
export const getAdminSummary = (params = {}) => {
  return API.get("/admin-dashboard/summary", { params });
};

/* ================= MONTHLY CHART ================= */
export const getMonthlyChart = (params = {}) => {
  return API.get("/admin-dashboard/monthly", { params });
};

/* ================= TOP ITEMS ================= */
export const getTopItems = (params = {}) => {
  return API.get("/admin-dashboard/top-items", { params });
};

/* ================= DAILY SALES ================= */
export const getDailySales = (params = {}) => {
  return API.get("/admin-dashboard/daily-sales", { params });
};