// import API from "./api";

// /* ======================
//    LOGIN (ROLE BASED)
// ====================== */
// export const login = async (role, credentials) => {
//   const res = await API.post(`/${role}/login`, credentials);

//   /**
//    * We normalize user data so ProtectedRoute
//    * always gets `user.role`
//    */
//   const user = {
//     id: res.data.user?._id || res.data.user?.id || null,
//     role: role, // 👈 very important
//     name: res.data.user?.name || "",
//     email: res.data.user?.email || "",
//   };

//   // ✅ Store auth data
//   localStorage.setItem("token", res.data.token);
//   localStorage.setItem("user", JSON.stringify(user));

//   return res.data;
// };

// /* ======================
//    AUTH HELPERS
// ====================== */
// export const getUser = () => {
//   try {
//     const user = localStorage.getItem("user");
//     return user ? JSON.parse(user) : null;
//   } catch (err) {
//     console.error("Invalid user data in storage");
//     return null;
//   }
// };

// export const isAuthenticated = () => {
//   return Boolean(localStorage.getItem("token"));
// };

// /* ======================
//    LOGOUT
// ====================== */
// export const logout = () => {
//   localStorage.removeItem("token");
//   localStorage.removeItem("user");

//   // hard redirect to clear protected state
//   window.location.replace("/");
// };
















import API from "./api";

/* ======================
   LOGIN (ROLE BASED)
====================== */
export const login = async (role, credentials) => {
  try {
    const res = await API.post(`/${role}/login`, credentials);

    // 🔥 match backend response
const data = res.data;

if (!data || !data.token) {
  throw new Error("Invalid login response from server");
}

// ✅ use backend response directly
const user = data.user;

localStorage.setItem("token", data.token);
localStorage.setItem("user", JSON.stringify(user));

return data;
  } catch (error) {
    throw error.response?.data || { message: "Login failed" };
  }
};

/* ======================
   GET USER
====================== */
export const getUser = () => {
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch (err) {
    console.error("Invalid user data in storage");
    return null;
  }
};

/* ======================
   GET TOKEN
====================== */
export const getToken = () => {
  return localStorage.getItem("token");
};

/* ======================
   CHECK AUTH
====================== */
export const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

/* ======================
   LOGOUT
====================== */
export const logout = () => {
  localStorage.clear(); // 🔥 clear everything
  window.location.replace("/"); // redirect to home/login
};
