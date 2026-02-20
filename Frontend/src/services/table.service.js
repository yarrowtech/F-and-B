// import api from "./api";

// /* ===============================
//    TABLE SERVICES
// =============================== */

// /**
//  * GET ALL TABLES
//  * Backend response:
//  * {
//  *   success: true,
//  *   data: [...]
//  * }
//  */
// export const getAllTables = async () => {
//   const res = await api.get("/tables");
//   return res.data.data; // ✅ return ARRAY only
// };

// /**
//  * CREATE TABLE (ADMIN)
//  * Expects:
//  * {
//  *   tableNumber: Number,
//  *   capacity: Number,
//  *   status: "available" | "occupied"
//  * }
//  */
// export const createTable = async (data) => {
//   const res = await api.post("/tables", data);
//   return res.data; // success object
// };

// /**
//  * UPDATE TABLE STATUS
//  * Backend: PUT /tables/:id/status
//  * Expects backend enum values
//  */
// export const updateTableStatus = async (id, status) => {
//   const res = await api.put(`/tables/${id}/status`, {
//     status, // "available" | "occupied"
//   });
//   return res.data;
// };

// /**
//  * DELETE TABLE
//  */
// export const deleteTable = async (id) => {
//   const res = await api.delete(`/tables/${id}`);
//   return res.data;
// };

// /* ===============================
//    OPTIONAL HELPERS (UI Friendly)
// =============================== */

// /**
//  * MARK TABLE FREE
//  */
// export const markTableFree = async (id) => {
//   return updateTableStatus(id, "available");
// };

// /**
//  * MARK TABLE OCCUPIED
//  */
// export const markTableOccupied = async (id) => {
//   return updateTableStatus(id, "occupied");
// };





import api from "./api";

/* ===============================
   TABLE SERVICES (Multi-Restaurant)
=============================== */

export const getTables = async (restaurantId) => {
  const res = await api.get(`/tables/${restaurantId}`);
  return res.data.data; // return array only
};

export const createTable = async (restaurantId, data) => {
  const res = await api.post(`/tables/${restaurantId}`, data);
  return res.data.data;
};

export const updateTableStatus = async (restaurantId, id, status) => {
  const res = await api.put(
    `/tables/${restaurantId}/${id}/status`,
    { status }
  );
  return res.data.data;
};

export const deleteTable = async (restaurantId, id) => {
  const res = await api.delete(
    `/tables/${restaurantId}/${id}`
  );
  return res.data;
};
