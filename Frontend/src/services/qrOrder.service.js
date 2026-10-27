import api from "./api";

const API_URL = import.meta.env.VITE_API_URL || "/api";

/* ===============================
   QR DINE-IN ORDER SERVICES
=============================== */

/* Customer side: no login, plain fetch so a stale staff session is never involved. */
const publicRequest = async (path, options = {}) => {
  const response = await fetch(`${API_URL}/qr-order${path}`, {
    ...options,
    headers: { "Content-Type": "application/json" },
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok || body.success === false) {
    const error = new Error(body.message || "Something went wrong. Please try again.");
    error.status = response.status;
    throw error;
  }

  return body.data;
};

/* Which table is this QR code, plus any order already running on it. */
export const getQrTable = (token) => publicRequest(`/table/${encodeURIComponent(token)}`);

/* items: [{ menuItem, quantity, customization: [] }] */
export const placeQrOrder = (token, payload) =>
  publicRequest(`/table/${encodeURIComponent(token)}/orders`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const getQrOrderStatus = (orderId) => publicRequest(`/orders/${encodeURIComponent(orderId)}`);

/* Waiter: QR orders waiting for me. */
export const getPendingQrOrders = async () => {
  const res = await api.get("/qr-order/pending");
  return Array.isArray(res.data?.data) ? res.data.data : [];
};

export const acceptQrOrder = async (orderId) => {
  const res = await api.post(`/qr-order/orders/${orderId}/accept`);
  return res.data?.data;
};

export const rejectQrOrder = async (orderId) => {
  const res = await api.post(`/qr-order/orders/${orderId}/reject`);
  return res.data?.data;
};

/* Admin / manager: the QR token of every table. */
export const getTableQrCodes = async (restaurantId) => {
  const res = await api.get(`/qr-order/codes/${restaurantId}`);
  const data = res.data?.data || {};
  return {
    restaurantName: data.restaurantName || "",
    tables: Array.isArray(data.tables) ? data.tables : [],
  };
};

export const regenerateTableQr = async (restaurantId, tableId) => {
  const res = await api.post(`/qr-order/codes/${restaurantId}/${tableId}/regenerate`);
  return res.data?.data;
};
