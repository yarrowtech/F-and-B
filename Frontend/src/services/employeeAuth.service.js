import axios from "axios";

const API_URL = "http://localhost:5000/api/employee";

export const employeeLogin = async (data) => {
  const res = await axios.post(`${API_URL}/login`, data);
  return res.data;
};
