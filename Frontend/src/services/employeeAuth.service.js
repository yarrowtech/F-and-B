import axios from "axios";

const API_URL = `${import.meta.env.VITE_API_URL || "/api"}/employee`;

/* =========================
   🔐 EMPLOYEE LOGIN
========================= */
export const employeeLogin = async (data) => {
  const res = await axios.post(`${API_URL}/login`, data);

  // ✅ Normalize response (VERY IMPORTANT)
  const responseData = res.data?.data || res.data;

  return {
    token: responseData.token,
    user: responseData.user,
  };
  // NOTE: on failure the raw axios error propagates so the
  // caller can read response.status / response.data.code
  // (see parseAuthError).
};
