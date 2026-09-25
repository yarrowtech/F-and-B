import api from "./api";

/* ===============================
   MESSAGE SERVICES
   (role-to-role chat, shared by every role)
=============================== */

export const getMessageTemplates = async () => {
  const res = await api.get("/messages/templates");
  return res.data.data;
};

export const createMessageTemplate = async (data) => {
  const res = await api.post("/messages/templates", data);
  return res.data.data;
};

export const updateMessageTemplate = async (id, data) => {
  const res = await api.put(`/messages/templates/${id}`, data);
  return res.data.data;
};

export const deleteMessageTemplate = async (id) => {
  await api.delete(`/messages/templates/${id}`);
};

export const getMessageRestaurants = async () => {
  const res = await api.get("/messages/restaurants");
  return res.data.data;
};

export const getMessageContacts = async (restaurantId) => {
  const res = await api.get("/messages/contacts", {
    params: restaurantId ? { restaurantId } : {},
  });
  return res.data.data;
};

export const getUnreadMessageCount = async () => {
  const res = await api.get("/messages/unread-count");
  return res.data.data;
};

export const getMessageThread = async (contactId, restaurantId) => {
  const res = await api.get(`/messages/${contactId}`, {
    params: restaurantId ? { restaurantId } : {},
  });
  return res.data.data;
};

export const sendMessage = async (contactId, text, restaurantId, priority = "normal") => {
  const res = await api.post(`/messages/${contactId}`, {
    text,
    priority,
    ...(restaurantId ? { restaurantId } : {}),
  });
  return res.data.data;
};
