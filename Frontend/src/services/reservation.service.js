import api from "./api";

/* ===============================
   RESERVATION SERVICES (Multi-Restaurant)
=============================== */

export const getReservations = async (restaurantId, status) => {
  const res = await api.get(`/reservations/${restaurantId}`, {
    params: status ? { status } : undefined,
  });
  return res.data.data; // return array only
};

export const createReservation = async (restaurantId, data) => {
  const res = await api.post(`/reservations/${restaurantId}`, data);
  return res.data.data;
};

export const updateReservationStatus = async (restaurantId, id, status) => {
  const res = await api.put(
    `/reservations/${restaurantId}/${id}/status`,
    { status }
  );
  return res.data.data;
};

export const updateReservation = async (restaurantId, id, data) => {
  const res = await api.put(`/reservations/${restaurantId}/${id}`, data);
  return res.data.data;
};

export const deleteReservation = async (restaurantId, id) => {
  const res = await api.delete(`/reservations/${restaurantId}/${id}`);
  return res.data;
};
