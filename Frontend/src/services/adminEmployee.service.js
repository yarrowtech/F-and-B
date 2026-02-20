// src/services/adminEmployee.service.js
import axios from "axios";

const API_URL = "http://localhost:5000/api/admin";

/* ============================
   AUTH HEADER
============================ */
const authHeader = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

/* ============================
   GET ALL EMPLOYEES
============================ */
export const getEmployees = async () => {
  return axios.get(`${API_URL}/employee`, authHeader());
};

/* ============================
   CREATE EMPLOYEE
============================ */
export const createEmployee = async (data) => {
  return axios.post(`${API_URL}/employee`, data, authHeader());
};

/* ============================
   DELETE EMPLOYEE
============================ */
export const deleteEmployee = async (id) => {
  return axios.delete(`${API_URL}/employee/${id}`, authHeader());
};
