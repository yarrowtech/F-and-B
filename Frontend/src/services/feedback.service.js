import api from "./api";

const API_URL = import.meta.env.VITE_API_URL || "/api";

/* ===============================
   PUBLIC (no auth)
=============================== */
export const getPublicFeedbackContext = async (billId, token) => {
  const response = await fetch(
    `${API_URL}/feedback/public/${billId}?token=${encodeURIComponent(token || "")}`
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Failed to load feedback form");
  }
  return data.data;
};

export const submitPublicFeedback = async (
  billId,
  { token, rating, comment, customerName, via, serviceRating, ambianceRating, itemRatings }
) => {
  const response = await fetch(`${API_URL}/feedback/public/${billId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token,
      rating,
      comment,
      customerName,
      via,
      serviceRating,
      ambianceRating,
      itemRatings,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Failed to submit feedback");
  }
  return data;
};

/* ===============================
   ADMIN / MANAGER (auth)
=============================== */
export const getRestaurantFeedback = async (restaurantId) => {
  const res = await api.get(`/feedback/${restaurantId}`);
  return res.data; // { success, data, summary }
};
