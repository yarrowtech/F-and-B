import axios from "axios";

const API_URL = "http://localhost:5000/api/employee";

/* =========================
   🔐 EMPLOYEE LOGIN
========================= */
export const employeeLogin = async (data) => {
  try {
    const res = await axios.post(`${API_URL}/login`, data);

    // ✅ Normalize response (VERY IMPORTANT)
    const responseData = res.data?.data || res.data;

    return {
      token: responseData.token,
      user: responseData.user,
    };
  } catch (error) {
    // 🔥 Clean error handling
    throw error.response?.data || { message: "Server error" };
  }
};