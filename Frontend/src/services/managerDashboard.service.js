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
