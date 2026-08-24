import api from "./api";

/* ================= KITCHEN SECTION SERVICES ================= */

/* Get all kitchen sections for a restaurant */
export const getKitchenSections = async (restaurantId) => {
  const res = await api.get(`/kitchen-sections/${restaurantId}`);
  const data = res.data?.data;
  return Array.isArray(data) ? data : [];
};

/* Create a kitchen section */
export const createKitchenSection = async (restaurantId, data) => {
  const res = await api.post(`/kitchen-sections/${restaurantId}`, data);
  return res.data?.data;
};

/* Update a kitchen section */
export const updateKitchenSection = async (restaurantId, id, data) => {
  const res = await api.put(`/kitchen-sections/${restaurantId}/${id}`, data);
  return res.data?.data;
};

/* Delete a kitchen section */
export const deleteKitchenSection = async (restaurantId, id) => {
  const res = await api.delete(`/kitchen-sections/${restaurantId}/${id}`);
  return res.data?.data;
};
