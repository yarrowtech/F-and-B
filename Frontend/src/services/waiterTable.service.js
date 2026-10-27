import api from "./api";

/* ===============================
   WAITER TABLE ASSIGNMENT SERVICES
=============================== */

/* Admin / manager: all waiters + all assignments of a restaurant */
export const getWaiterAssignments = async (restaurantId) => {
  const res = await api.get(`/waiter-tables/${restaurantId}`);
  const data = res.data?.data || {};
  return {
    waiters: Array.isArray(data.waiters) ? data.waiters : [],
    assignments: Array.isArray(data.assignments) ? data.assignments : [],
  };
};

/* Admin / manager: replace one waiter's tables.
   assignments: [{ table, type: "REGULAR" | "EXTRA", reason }] - [] clears them */
export const setWaiterAssignments = async (restaurantId, waiterId, assignments) => {
  const res = await api.put(`/waiter-tables/${restaurantId}/waiters/${waiterId}`, { assignments });
  return res.data?.data || [];
};

/* Waiter: my assigned tables */
export const getMyTableAssignments = async () => {
  const res = await api.get("/waiter-tables/me");
  return Array.isArray(res.data?.data) ? res.data.data : [];
};
