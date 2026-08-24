import api from "./api";

/* ================= INVENTORY STOCK (WAREHOUSE + SECTIONS) SERVICES ================= */

/* Per-location stock breakdown for every item */
export const getStockByLocation = async (restaurantId) => {
  const res = await api.get(`/inventory-stock/${restaurantId}`);
  const data = res.data?.data;
  return Array.isArray(data) ? data : [];
};

/* Transfer stock between warehouse and a kitchen section */
export const transferStock = async (restaurantId, data) => {
  const res = await api.post(`/inventory-stock/${restaurantId}/transfer`, data);
  return res.data?.data;
};

/* Transfer history */
export const getStockTransferHistory = async (restaurantId, params = {}) => {
  const res = await api.get(`/inventory-stock/${restaurantId}/transfers`, { params });
  const data = res.data?.data;
  return Array.isArray(data) ? data : [];
};
