import API from "./api";
import {
  clearAuthSession,
  enforceSession,
  startSession,
} from "./session.service";

export const login = async (role, credentials) => {
  try {
    const res = await API.post(`/${role}/login`, credentials);
    const data = res.data;

    if (!data || !data.token) {
      throw new Error("Invalid login response from server");
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    startSession();

    return data;
  } catch (error) {
    throw error.response?.data || { message: "Login failed" };
  }
};

export const getUser = () => {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch {
    console.error("Invalid user data in storage");
    return null;
  }
};

export const getToken = () => {
  return localStorage.getItem("token");
};

export const isAuthenticated = () => {
  return enforceSession() && !!localStorage.getItem("token");
};

export const logout = () => {
  clearAuthSession();
  window.location.replace("/");
};
