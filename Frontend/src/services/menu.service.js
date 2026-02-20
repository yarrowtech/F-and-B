

// import api from "./api";

// /* ================= MENU SERVICES ================= */

// // Get all menu items
// export const getMenu = async (restaurantId) => {
//   const res = await api.get(`/menu/${restaurantId}`);
//   return res.data;
// };

// // Create menu item
// export const createMenu = async (restaurantId, data) => {
//   const res = await api.post(`/menu/${restaurantId}`, data);
//   return res.data;
// };

// // Update menu item
// export const updateMenu = async (restaurantId, id, data) => {
//   const res = await api.put(`/menu/${restaurantId}/${id}`, data);
//   return res.data;
// };

// // Delete menu item
// export const deleteMenu = async (restaurantId, id) => {
//   const res = await api.delete(`/menu/${restaurantId}/${id}`);
//   return res.data;
// };





import api from "./api";

/* ================= MENU SERVICES ================= */

/* Get all menu items */
export const getMenu = async (restaurantId) => {
  const res = await api.get(`/menu/${restaurantId}`);
  return Array.isArray(res.data) ? res.data : [];
};

/* Create menu item */
export const createMenu = async (restaurantId, data) => {
  const res = await api.post(`/menu/${restaurantId}`, data);
  return res.data;
};

/* Update menu item */
export const updateMenu = async (restaurantId, id, data) => {
  const res = await api.put(`/menu/${restaurantId}/${id}`, data);
  return res.data;
};

/* Delete menu item */
export const deleteMenu = async (restaurantId, id) => {
  const res = await api.delete(`/menu/${restaurantId}/${id}`);
  return res.data;
};
