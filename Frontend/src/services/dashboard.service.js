// import axios from "axios";

// const API = "http://localhost:5000/api/dashboard";

// export const getTodayDashboard = async (token) => {
//   const res = await axios.get(`${API}/today`, {
//     headers: { Authorization: `Bearer ${token}` }
//   });
//   return res.data;
// };

// export const getMonthlyDashboard = async (token) => {
//   const res = await axios.get(`${API}/monthly`, {
//     headers: { Authorization: `Bearer ${token}` }
//   });
//   return res.data;
// };

// export const getTopItems = async (token, type) => {
//   const res = await axios.get(
//     `${API}/top-items?type=${type}`,
//     {
//       headers: { Authorization: `Bearer ${token}` }
//     }
//   );
//   return res.data;
// };





import API from "./api";

/* ================= ADMIN ================= */

export const getAdminDashboard = async () => {
  const res = await API.get("/admin/dashboard");
  return res.data;
};

/* ================= MANAGER ================= */

export const getManagerDashboard = async () => {
  const res = await API.get("/manager/dashboard");
  return res.data;
};

/* ================= WAITER ================= */

export const getWaiterDashboard = async () => {
  const res = await API.get("/waiter/dashboard");
  return res.data;
};

/* ================= ACCOUNTANT ================= */

export const getAccountantDashboard = async () => {
  const res = await API.get("/accountant/dashboard");
  return res.data;
};

/* ================= CHEF ================= */

export const getChefDashboard = async () => {
  const res = await API.get("/chef/dashboard");
  return res.data;
};

/* ================= INVENTORY ================= */

export const getInventoryDashboard = async () => {
  const res = await API.get("/inventory/dashboard");
  return res.data;
};