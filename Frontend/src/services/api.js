// import axios from "axios";

// const API = axios.create({
//   baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
//   withCredentials: false, // 🔐 explicit (JWT only, no cookies)
// });

// /* ======================
//    REQUEST INTERCEPTOR
// ====================== */
// API.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("token");

//     if (token) {
//       config.headers = config.headers || {};
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// /* ======================
//    RESPONSE INTERCEPTOR
// ====================== */
// API.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     // 🔥 Global 401 handling
//     if (error.response?.status === 401) {
//       localStorage.removeItem("token");
//       localStorage.removeItem("user");

//       alert("Unauthorized or session expired.");

//       // force redirect to login
//       window.location.replace("/admin-login");
//     }

//     return Promise.reject(error);
//   }
// );

// export default API;














import axios from "axios";

/* ======================
   AXIOS INSTANCE
====================== */
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: false, // JWT only
});

/* ======================
   REQUEST INTERCEPTOR
====================== */
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ======================
   RESPONSE INTERCEPTOR
====================== */
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // 🔍 Log real error (VERY IMPORTANT for debugging)
    console.error(
      "❌ API ERROR:",
      error.response?.data || error.message
    );

    /* ======================
       HANDLE 401 (UNAUTHORIZED)
    ======================= */
    if (error.response?.status === 401) {
      // Don't intercept login endpoint errors — let the login form handle them
      const isLoginRequest = error.config?.url?.includes("/login");
      if (!isLoginRequest) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        // Redirect to login so the user can re-authenticate
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  }
);

export default API;