import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";
const BASE_URL = `${API_URL}/manager/dashboard`;
const ACCOUNT_HISTORY_URL = `${API_URL}/manager/account-history`;

export const getManagerDashboard = async (params = {}) => {
  const token = localStorage.getItem("token");

  const res = await axios.get(BASE_URL, {
    params,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data?.data || res.data;
};

export const getManagerAccountHistory = async (params = {}) => {
  const token = localStorage.getItem("token");

  const res = await axios.get(ACCOUNT_HISTORY_URL, {
    params,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data?.data || res.data;
};

export const downloadManagerAccountHistoryExcel = async (params = {}) => {
  const token = localStorage.getItem("token");
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });

  const res = await axios.get(
    `${ACCOUNT_HISTORY_URL}/excel?${query.toString()}`,
    {
      responseType: "blob",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const blob = new Blob([res.data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  const from = params.startDate || "all";
  const to = params.endDate || "latest";
  link.href = url;
  link.download = `manager-account-history-${from}-to-${to}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
