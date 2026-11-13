import api from "./api";

const API_URL = import.meta.env.VITE_API_URL || "/api";

/* ===============================
   PUBLIC (no auth)
=============================== */
export const getPublicStampContext = async (restaurantId) => {
  const response = await fetch(`${API_URL}/stamp/public/${restaurantId}`);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Failed to load stamp page");
  return data.data;
};

export const submitPublicStampReview = async (restaurantId, payload) => {
  const response = await fetch(`${API_URL}/stamp/public/${restaurantId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Failed to submit review");
  return data.data;
};

/* ===============================
   ADMIN / MANAGER (auth)
=============================== */
export const getStampOverview = async (restaurantId) => {
  const res = await api.get(`/stamp/${restaurantId}`);
  return res.data.data;
};

export const updateStampSettings = async (restaurantId, settings) => {
  const res = await api.put(`/stamp/${restaurantId}/settings`, settings);
  return res.data.data;
};

export const redeemStampReward = async (restaurantId, cardId, rewardId) => {
  const res = await api.patch(
    `/stamp/${restaurantId}/cards/${cardId}/rewards/${rewardId}/redeem`
  );
  return res.data;
};
