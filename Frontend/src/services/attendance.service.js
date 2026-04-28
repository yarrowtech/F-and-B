import axios from "axios";

const API =
  import.meta.env.VITE_API_URL ||
  "/api";

const instance = axios.create({
  baseURL: API,
});

/* ===============================
   TOKEN INTERCEPTOR
=============================== */
instance.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");

  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

/* ===============================
   HELPER: DOWNLOAD EXCEL FILE
=============================== */
const downloadExcel = (data, filename) => {
  const url = window.URL.createObjectURL(
    new Blob([data])
  );

  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.URL.revokeObjectURL(url);
};

/* ===============================
   CHECK IN
=============================== */
export const checkIn = async (lat, lng) => {
  try {
    const res = await instance.post(
      "/attendance/check-in",
      { lat, lng }
    );
    return res.data;
  } catch (error) {
    throw (
      error.response?.data?.message ||
      "Check-in failed"
    );
  }
};

/* ===============================
   CHECK OUT
=============================== */
export const checkOut = async () => {
  try {
    const res = await instance.post(
      "/attendance/check-out"
    );
    return res.data;
  } catch (error) {
    throw (
      error.response?.data?.message ||
      "Check-out failed"
    );
  }
};

/* ===============================
   GET TODAY ATTENDANCE
=============================== */
export const getTodayAttendance = async (type = "") => {
  try {
    const query = type ? `?type=${type}` : "";

    const res = await instance.get(
      `/attendance/today${query}`
    );

    return res.data;
  } catch (error) {
    throw (
      error.response?.data?.message ||
      "Failed to fetch today attendance"
    );
  }
};

/* ===============================
   GET MONTHLY STATS
=============================== */
export const getMonthlyStats = async (month, type = "") => {
  try {
    const query = type ? `&type=${type}` : "";

    const res = await instance.get(
      `/attendance/monthly-stats?month=${month}${query}`
    );

    return res.data;
  } catch (error) {
    throw (
      error.response?.data?.message ||
      "Failed to fetch monthly stats"
    );
  }
};

/* ===============================
   GET MONTHLY CHART
=============================== */
export const getMonthlyChart = async (month, type = "") => {
  try {
    const query = type ? `&type=${type}` : "";

    const res = await instance.get(
      `/attendance/monthly-chart?month=${month}${query}`
    );

    return res.data;
  } catch (error) {
    throw (
      error.response?.data?.message ||
      "Failed to fetch monthly chart"
    );
  }
};

/* ==================================================
   EXPORT DETAILED ATTENDANCE (DATE RANGE)
================================================== */
export const exportAttendanceExcel = async (
  startDate,
  endDate
) => {
  try {
    const res = await instance.get(
      `/attendance/export?startDate=${startDate}&endDate=${endDate}`,
      { responseType: "blob" }
    );

    downloadExcel(
      res.data,
      `attendance-details-${startDate}-to-${endDate}.xlsx`
    );
  } catch (error) {
    throw (
      error.response?.data?.message ||
      "Detailed export failed"
    );
  }
};

/* ==================================================
   EXPORT MONTHLY SUMMARY (ALL EMPLOYEES)
   Endpoint:
   /attendance/export-monthly-summary?month=YYYY-MM
================================================== */
export const exportMonthlySummaryExcel = async (
  month
) => {
  try {
    const res = await instance.get(
      `/attendance/export-monthly-summary?month=${month}`,
      { responseType: "blob" }
    );

    downloadExcel(
      res.data,
      `monthly-summary-${month}.xlsx`
    );
  } catch (error) {
    throw (
      error.response?.data?.message ||
      "Monthly summary export failed"
    );
  }
};

/* ==================================================
   EXPORT FULL MONTH DETAILED (AUTO RANGE)
================================================== */
export const exportFullMonthDetailed = async (
  month
) => {
  try {
    const [year, monthNum] = month.split("-");

    const startDate = `${month}-01`;

    const lastDay = new Date(
      Number(year),
      Number(monthNum),
      0
    ).getDate();

    const endDate = `${month}-${String(
      lastDay
    ).padStart(2, "0")}`;

    await exportAttendanceExcel(startDate, endDate);

  } catch {
    throw "Full month export failed";
  }
};
