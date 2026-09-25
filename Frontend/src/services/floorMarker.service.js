import api from "./api";

/* ===============================
   FLOOR MARKER SERVICES
   (Entrance / Kitchen / Bar / Wall labels on the floor plan)
=============================== */

export const getFloorMarkers = async (restaurantId) => {
  const res = await api.get(`/floor-markers/${restaurantId}`);
  return res.data.data;
};

export const createFloorMarker = async (restaurantId, data) => {
  const res = await api.post(`/floor-markers/${restaurantId}`, data);
  return res.data.data;
};

export const updateFloorMarker = async (restaurantId, id, data) => {
  const res = await api.put(`/floor-markers/${restaurantId}/${id}`, data);
  return res.data.data;
};

export const deleteFloorMarker = async (restaurantId, id) => {
  const res = await api.delete(`/floor-markers/${restaurantId}/${id}`);
  return res.data;
};
