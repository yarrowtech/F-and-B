import axios from "axios";

const API = "http://localhost:5000/api/dashboard";

export const getTodayDashboard = async (token) => {
  const res = await axios.get(`${API}/today`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const getMonthlyDashboard = async (token) => {
  const res = await axios.get(`${API}/monthly`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const getTopItems = async (token, type) => {
  const res = await axios.get(
    `${API}/top-items?type=${type}`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  return res.data;
};
