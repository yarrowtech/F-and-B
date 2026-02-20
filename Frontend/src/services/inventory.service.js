import api from "./api";

/* ================= INVENTORY SERVICES ================= */

/* ===== GET INVENTORY ===== */
/* GET /api/inventory/:restaurantId */
export const getInventory = async (restaurantId) => {
  if (!restaurantId) return [];

  const res = await api.get(`/inventory/${restaurantId}`);
  return Array.isArray(res.data?.data)
    ? res.data.data
    : [];
};

/* ===== CREATE INVENTORY ITEM ===== */
/* POST /api/inventory/:restaurantId */
export const createInventoryItem = async (
  restaurantId,
  data
) => {
  const res = await api.post(
    `/inventory/${restaurantId}`,
    data
  );

  return res.data?.data || null;
};

/* ===== UPDATE INVENTORY ITEM ===== */
/* PUT /api/inventory/:restaurantId/:id */
export const updateInventoryItem = async (
  restaurantId,
  id,
  data
) => {
  const res = await api.put(
    `/inventory/${restaurantId}/${id}`,
    data
  );

  return res.data?.data || null;
};

/* ===== DELETE INVENTORY ITEM ===== */
/* DELETE /api/inventory/:restaurantId/:id */
export const deleteInventoryItem = async (
  restaurantId,
  id
) => {
  const res = await api.delete(
    `/inventory/${restaurantId}/${id}`
  );

  return res.data?.data || null;
};

/* ===== ADD STOCK ===== */
/* PUT /api/inventory/:restaurantId/:id/add-stock */
export const addStock = async (
  restaurantId,
  id,
  quantity
) => {
  const res = await api.put(
    `/inventory/${restaurantId}/${id}/add-stock`,
    { quantity }
  );

  return res.data?.data || null;
};
