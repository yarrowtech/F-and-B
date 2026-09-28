import api from "./api";

export const getCustomers = async (restaurantId, search = "") => {
  const res = await api.get(`/crm/${restaurantId}/customers`, {
    params: search ? { search } : undefined,
  });
  return res.data.data;
};

export const getCustomerDetail = async (restaurantId, phone) => {
  const res = await api.get(`/crm/${restaurantId}/customers/${encodeURIComponent(phone)}`);
  return res.data.data;
};

export const addCustomerNote = async (restaurantId, phone, note) => {
  const res = await api.post(`/crm/${restaurantId}/customers/${encodeURIComponent(phone)}/notes`, {
    note,
  });
  return res.data.data;
};

export const deleteCustomerNote = async (restaurantId, noteId) => {
  const res = await api.delete(`/crm/${restaurantId}/notes/${noteId}`);
  return res.data;
};
