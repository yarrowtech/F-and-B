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

/* ================= RESTAURANT BREAKDOWN ================= */
export const getRestaurantBreakdown = (params = {}) => {
  return API.get("/admin-dashboard/restaurant-breakdown", { params });
};

/* ================= ACCOUNT HISTORY ================= */
export const getAdminAccountHistory = (params = {}) => {
  return API.get("/admin-dashboard/account-history", { params });
};

export const downloadAdminAccountHistoryExcel = async (params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });

  const res = await API.get(
    `/admin-dashboard/account-history/excel?${query.toString()}`,
    { responseType: "blob" }
  );

  const blob = new Blob([res.data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  const from = params.startDate || "all";
  const to = params.endDate || "latest";
  link.href = url;
  link.download = `admin-account-history-${from}-to-${to}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
