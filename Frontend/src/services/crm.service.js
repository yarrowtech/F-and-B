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

/* ===============================
   CAMPAIGNS
=============================== */
export const getCampaigns = async (restaurantId) => {
  const res = await api.get(`/crm/${restaurantId}/campaigns`);
  return res.data.data;
};

export const createCampaign = async (restaurantId, payload) => {
  const res = await api.post(`/crm/${restaurantId}/campaigns`, payload);
  return res.data;
};

export const deleteCampaign = async (restaurantId, campaignId) => {
  const res = await api.delete(`/crm/${restaurantId}/campaigns/${campaignId}`);
  return res.data;
};

/* ===============================
   LOYALTY SETTINGS
=============================== */
export const getLoyaltySettings = async (restaurantId) => {
  const res = await api.get(`/crm/${restaurantId}/loyalty`);
  return res.data.data;
};

export const updateLoyaltySettings = async (restaurantId, payload) => {
  const res = await api.put(`/crm/${restaurantId}/loyalty`, payload);
  return res.data.data;
};

/* ===============================
   COUPONS
=============================== */
export const getCoupons = async (restaurantId) => {
  const res = await api.get(`/crm/${restaurantId}/coupons`);
  return res.data.data;
};

export const issueCoupon = async (restaurantId, phone, payload) => {
  const res = await api.post(`/crm/${restaurantId}/customers/${encodeURIComponent(phone)}/coupon`, payload);
  return res.data;
};
