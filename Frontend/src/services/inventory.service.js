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
export const createInventoryItem = async (restaurantId, data) => {

  const res = await api.post(`/inventory/${restaurantId}`, data);

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

/* ================= MANAGER INVENTORY ================= */
/* GET /api/inventory/manager */

export const getManagerInventory = async () => {

  const res = await api.get("/inventory/manager");

  return Array.isArray(res.data?.data)
    ? res.data.data
    : [];

};

/* ================= INVENTORY CATEGORIES ================= */
/* GET /api/inventory/categories */
export const getInventoryCategories = async (restaurantId = null) => {
  const url = restaurantId
    ? `/inventory/categories?restaurantId=${restaurantId}`
    : "/inventory/categories";
  const res = await api.get(url);
  return Array.isArray(res.data?.data) ? res.data.data : [];
};

/* POST /api/inventory/categories */
export const addInventoryCategory = async (name, restaurantId = null) => {
  const body = { name };
  if (restaurantId) body.restaurantId = restaurantId;
  const res = await api.post("/inventory/categories", body);
  return res.data?.data || null;
};

/* ================= INVENTORY MANAGER DASHBOARD STATS ================= */
/* GET /api/inventory/my-stats */
export const getMyInventoryStats = async ({ period = "today", from = "", to = "" } = {}) => {
  let url = `/inventory/my-stats?period=${period}`;
  if (period === "custom" && from && to) url += `&from=${from}&to=${to}`;
  const res = await api.get(url);
  return res.data?.data || {};
};

/* ================= INVENTORY DAY-WISE EXCEL ================= */
/* GET /api/inventory/report/day-wise/excel */
export const downloadInventoryDayWiseExcel = async ({
  restaurantId = "",
  date = "",
  from = "",
  to = "",
} = {}) => {
  const params = new URLSearchParams();
  if (restaurantId) params.set("restaurantId", restaurantId);
  if (from || date) params.set("from", from || date);
  if (to || date) params.set("to", to || date);

  const res = await api.get(`/inventory/report/day-wise/excel?${params.toString()}`, {
    responseType: "blob",
  });

  const blob = new Blob([res.data], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const fileFrom = from || date || new Date().toISOString().slice(0, 10);
  const fileTo = to || date || fileFrom;
  const sanitize = (value) =>
    String(value || "")
      .replace("T", "-")
      .replace(/[^\dA-Za-z-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  link.download = `inventory-day-wise-${sanitize(fileFrom)}-to-${sanitize(fileTo)}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

/* ================= STOCK APPROVALS ================= */
/* GET /api/inventory/stock-approvals */
export const getStockApprovalRequests = async ({
  restaurantId = "",
  status = "PENDING",
} = {}) => {
  const params = new URLSearchParams();
  if (restaurantId) params.set("restaurantId", restaurantId);
  if (status) params.set("status", status);

  const res = await api.get(`/inventory/stock-approvals?${params.toString()}`);
  return Array.isArray(res.data?.data) ? res.data.data : [];
};

/* PUT /api/inventory/stock-approvals/:id/approve */
export const approveStockApprovalRequest = async (id, restaurantId = "") => {
  const params = new URLSearchParams();
  if (restaurantId) params.set("restaurantId", restaurantId);
  const res = await api.put(
    `/inventory/stock-approvals/${id}/approve?${params.toString()}`
  );
  return res.data?.data || null;
};

/* PUT /api/inventory/stock-approvals/:id/reject */
export const rejectStockApprovalRequest = async (id, reason = "", restaurantId = "") => {
  const params = new URLSearchParams();
  if (restaurantId) params.set("restaurantId", restaurantId);
  const res = await api.put(
    `/inventory/stock-approvals/${id}/reject?${params.toString()}`,
    { reason }
  );
  return res.data?.data || null;
};

/* ================= INVENTORY LOGS ================= */
/* GET /api/inventory/logs/:itemId */

export const getItemLogs = async (itemId, restaurantId) => {

  const res = await api.get(
    `/inventory/logs/${itemId}?restaurantId=${restaurantId}`
  );

  return Array.isArray(res.data?.data)
    ? res.data.data
    : [];

};


/* ===== ADD STOCK ===== */
/* PUT /api/inventory/:restaurantId/:id/add-stock */

export const addStock = async (
  restaurantId,
  id,
  quantity,
  effectiveDate = ""
) => {

  const res = await api.put(
    `/inventory/${restaurantId}/${id}/add-stock`,
    { quantity, effectiveDate }
  );

  return res.data?.data || null;

};
