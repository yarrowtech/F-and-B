import axios from "axios";
import {
  clearAuthSession,
  enforceSession,
} from "./session.service";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: false,
});

const getLoginPath = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return user?.role === "super_admin" ? "/superadmin-login" : "/login";
  } catch {
    return "/login";
  }
};

const isPublicRequest = (url = "") =>
  url.includes("/login") ||
  url.includes("/vendor/invitations/") ||
  url.includes("/vendor/self-signup/global") ||
  url.includes("/subscriptions/plans") ||
  url.includes("/vendor-subscriptions/plans") ||
  url.includes("/subscriptions/admin-signup/");

API.interceptors.request.use(
  (config) => {
    const publicRequest = isPublicRequest(config.url || "");
    const loginPath = getLoginPath();

    if (!publicRequest && !enforceSession()) {
      window.location.replace(loginPath);
      return Promise.reject(new Error("Session expired due to inactivity"));
    }

    const token = localStorage.getItem("token");
    if (token && !publicRequest) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API ERROR:", error.response?.data || error.message);

    if (error.response?.status === 401) {
      const publicRequest = isPublicRequest(error.config?.url || "");
      if (!publicRequest) {
        const loginPath = getLoginPath();
        clearAuthSession();
        window.location.replace(loginPath);
      }
    }

    return Promise.reject(error);
  }
);

export default API;
