

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

/* ================= ANALYTICS ================= */

/* Date wise analytics */
export const getMenuOrdersByDate = async (restaurantId, dateOrRange) => {
  const params =
    typeof dateOrRange === "object"
      ? dateOrRange
      : { date: dateOrRange };

  const res = await api.get(`/menu/orders-by-date/${restaurantId}`, {
    params,
  });

  return Array.isArray(res.data) ? res.data : [];
};

/* Range analytics (NEW) */

export const getMenuAnalytics = async (restaurantId, range) => {
  const res = await api.get(
    `/menu/orders-by-date/${restaurantId}?range=${range}`
  );

  return Array.isArray(res.data) ? res.data : [];
};

export const downloadMenuSalesExcel = async (restaurantId, params = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });

  const res = await api.get(
    `/menu/orders-by-date/${restaurantId}/excel?${query.toString()}`,
    { responseType: "blob" }
  );

  const blob = new Blob([res.data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  const from = params.startDate || params.date || params.range || "sales";
  const to = params.endDate || params.date || "";
  link.href = url;
  link.download = `menu-item-sales-${from}${to ? `-to-${to}` : ""}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
