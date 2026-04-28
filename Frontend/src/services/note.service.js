import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL || "/api"}/notes`;

/* ================= TOKEN ================= */

const getAuthConfig = () => {
  const token = localStorage.getItem("token");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

/* ================= CREATE NOTE ================= */

export const createNote = async (note) => {
  const res = await axios.post(
    API_URL,
    { note },
    getAuthConfig()
  );

  return res.data;
};

/* ================= GET ALL NOTES ================= */

export const getNotes = async () => {
  const res = await axios.get(
    API_URL,
    getAuthConfig()
  );

  return res.data;
};

/* ================= SEARCH WORD ================= */

export const searchNotes = async (word) => {
  const res = await axios.get(
    `${API_URL}/search?word=${word}`,
    getAuthConfig()
  );

  return res.data;
};

/* ================= SEARCH DATE ================= */

export const getNotesByDate = async (date) => {
  const res = await axios.get(
    `${API_URL}/date/${date}`,
    getAuthConfig()
  );

  return res.data;
};

/* ================= PIN NOTE ================= */

export const togglePinNote = async (id) => {
  const res = await axios.patch(
    `${API_URL}/pin/${id}`,
    {},
    getAuthConfig()
  );

  return res.data;
};

/* ================= DELETE NOTE ================= */

export const deleteNote = async (id) => {
  const res = await axios.delete(
    `${API_URL}/${id}`,
    getAuthConfig()
  );

  return res.data;
};


export const updateNote = async (id, note) => {
  const res = await axios.put(
    `${API_URL}/${id}`,
    { note },
    getAuthConfig()
  );

  return res.data;
};
