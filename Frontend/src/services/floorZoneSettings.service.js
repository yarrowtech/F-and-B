import api from "./api";

/* ===============================
   FLOOR ZONE SIZE / BACKGROUND SETTINGS
   (physical width/height + an optional background photo of the real
   room, so the canvas matches the real room's proportions and look)
=============================== */

export const getFloorZoneSettings = async (restaurantId) => {
  const res = await api.get(`/floor-zone-settings/${restaurantId}`);
  return res.data.data;
};

export const saveFloorZoneSettings = async (restaurantId, payload) => {
  // payload: { zone, widthFt, heightFt, backgroundOpacity?, imageDataUrl?, removeBackground? }
  const res = await api.put(`/floor-zone-settings/${restaurantId}`, payload);
  return res.data.data;
};
