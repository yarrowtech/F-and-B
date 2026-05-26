const API_URL = import.meta.env.VITE_API_URL || "/api";

export const getPublicMenu = async (restaurantId) => {
  const response = await fetch(`${API_URL}/menu/public/${restaurantId}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to load menu");
  }

  return response.json();
};
