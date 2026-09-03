import API from "./api";

export const createSupportTicket = async (payload) => {
  const res = await API.post("/support-tickets", payload);
  return res.data?.data?.ticket;
};

export const getMySupportTickets = async (params = {}) => {
  const res = await API.get("/support-tickets/my", { params });
  return res.data?.data || {};
};

export const getAllSupportTickets = async (params = {}) => {
  const res = await API.get("/support-tickets", { params });
  return res.data?.data || {};
};

export const updateSupportTicketStatus = async (id, payload) => {
  const res = await API.patch(`/support-tickets/${id}/status`, payload);
  return res.data?.data?.ticket;
};
