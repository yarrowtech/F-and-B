import api from "./api";

/* ===============================
   MESSAGE SERVICES
   (role-to-role chat, shared by every role)
=============================== */

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
