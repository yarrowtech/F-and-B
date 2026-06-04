









// import api from "./api";

// /* ================= ORDER SERVICES ================= */

// /* 👨‍🍽️ WAITER → FETCH ORDERS */
// export const getWaiterOrders = async () => {
//   const res = await api.get("/order/waiter");
//   return Array.isArray(res.data?.data) ? res.data.data : [];
// };

// /* 👨‍🍽️ WAITER → PLACE ORDER */
// export const createOrder = async (data) => {
//   const res = await api.post("/order", data);
//   return res.data?.data || null;
// };

// /* ➕ ADD MORE ITEMS */
// export const addItemsToOrder = async (id, data) => {
//   const res = await api.put(`/order/${id}/add-items`, data);
//   return res.data?.data || null;
// };

// /* 👨‍🍳 CHEF → FETCH ORDERS */
// export const getChefOrders = async () => {
//   const res = await api.get("/order/chef");
//   return Array.isArray(res.data?.data) ? res.data.data : [];
// };

// /* 👨‍🍳 CHEF → ACCEPT ORDER */
// export const acceptOrder = async (id) => {
//   const res = await api.put(`/order/${id}/accept`);
//   return res.data?.data || null;
// };

// /* 👨‍🍳 CHEF → UPDATE STATUS */
// export const updateOrderStatusApi = async (id, status) => {
//   if (status === "PREPARING") {
//     const res = await api.put(`/order/${id}/preparing`);
//     return res.data?.data || null;
//   }

//   if (status === "READY") {
//     const res = await api.put(`/order/${id}/ready`);
//     return res.data?.data || null;
//   }

//   throw new Error("Invalid status");
// };

// /* 👨‍🍽️ WAITER → SERVE ORDER */
// export const markOrderServed = async (id) => {
//   const res = await api.put(`/order/${id}/served`);
//   return res.data?.data || null;
// };

// /* 💰 ACCOUNTANT → CLOSE / PAID */
// export const closeOrder = async (id) => {
//   const res = await api.put(`/order/${id}/paid`);
//   return res.data?.data || null;
// };

// /* 📦 ADMIN / MANAGER → ALL ORDERS */
// export const getAllOrders = async () => {
//   const res = await api.get("/order");
//   return Array.isArray(res.data?.data) ? res.data.data : [];
// };

// /* 🔎 GET ORDER BY ID */
// export const getOrderById = async (id) => {
//   const res = await api.get(`/order/${id}`);
//   return res.data?.data || null;
// };






import api from "./api";

/* ================= ORDER SERVICES ================= */

/* ===================================================
   👨‍🍽️ WAITER
=================================================== */

/* Fetch Waiter Orders (active or all) */
export const getWaiterOrders = async (type = "active") => {
  const res = await api.get(`/order/waiter?type=${type}`);
  return Array.isArray(res.data?.data) ? res.data.data : [];
};

/* Waiter Dashboard Stats */
export const getWaiterDashboardStats = async () => {
  const res = await api.get("/order/waiter/dashboard");
  return res.data?.data || {};
};

/* Place Order */
export const createOrder = async (data) => {
  const res = await api.post("/order", data);
  return res.data?.data || null;
};

/* Add More Items */
export const addItemsToOrder = async (id, data) => {
  const res = await api.put(`/order/${id}/add-items`, data);
  return res.data?.data || null;
};

export const changeOrderTable = async (id, tableId) => {
  const res = await api.put(`/order/${id}/table`, { tableId });
  return res.data?.data || null;
};

/* Serve Order */
export const markOrderServed = async (id) => {
  const res = await api.put(`/order/${id}/served`);
  return res.data?.data || null;
};

export const printOrderKOT = async (id) => {
  const res = await api.post(`/order/${id}/kot`);
  return res.data?.data || null;
};

/* ===================================================
   👨‍🍳 CHEF
=================================================== */

/* Fetch Chef Orders
   type = "all" → kitchen orders
   type = "mine" → accepted by me
*/
export const getChefOrders = async (type = "all") => {
  const res = await api.get(`/order/chef?type=${type}`);
  return Array.isArray(res.data?.data) ? res.data.data : [];
};

/* Chef Dashboard Stats */
export const getChefDashboardStats = async () => {
  const res = await api.get("/order/chef/dashboard");
  return res.data?.data || {};
};

/* Accept Order */
export const acceptOrder = async (id) => {
  const res = await api.put(`/order/${id}/accept`);
  return res.data?.data || null;
};

/* Update Status */
export const updateOrderStatusApi = async (id, status) => {
  if (status === "READY") {
    const res = await api.put(`/order/${id}/ready`);
    return res.data?.data || null;
  }

  throw new Error("Invalid status");
};

/* ===================================================
   💰 ACCOUNTANT
=================================================== */

export const closeOrder = async (id) => {
  const res = await api.put(`/order/${id}/paid`);
  return res.data?.data || null;
};

/* ===================================================
   👑 ADMIN / MANAGER
=================================================== */

export const getAllOrders = async () => {
  const res = await api.get("/order");
  return Array.isArray(res.data?.data) ? res.data.data : [];
};

/* ===================================================
   🔎 COMMON
=================================================== */

export const getOrderById = async (id) => {
  const res = await api.get(`/order/${id}`);
  return res.data?.data || null;
};
