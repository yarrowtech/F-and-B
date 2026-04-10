import axios from "axios";

const BASE_URL = "http://localhost:5000/api/manager/dashboard";

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
