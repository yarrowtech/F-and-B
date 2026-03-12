// import api from "./api";

// /* ===============================
//    RESTAURANT SERVICES
// =============================== */

// // Get all restaurants (Admin)
// export const getRestaurants = async () => {
//   const res = await api.get("/restaurants");
//   return res.data;
// };

// // Get single restaurant by ID
// export const getRestaurantById = async (restaurantId) => {
//   const res = await api.get(`/restaurants/${restaurantId}`);
//   return res.data;
// };

// // Create restaurant
// export const createRestaurant = async (data) => {
//   const res = await api.post("/restaurants", data);
//   return res.data;
// };

// // Update restaurant
// export const updateRestaurant = async (id, data) => {
//   const res = await api.put(`/restaurants/${id}`, data);
//   return res.data;
// };

// // Delete restaurant
// export const deleteRestaurant = async (id) => {
//   const res = await api.delete(`/restaurants/${id}`);
//   return res.data;
// };

// // Assign employees to restaurant
// export const assignEmployeesToRestaurant = async (
//   restaurantId,
//   employeeIds
// ) => {
//   const res = await api.put(
//     `/restaurants/${restaurantId}/assign-employees`,
//     { employeeIds }
//   );
//   return res.data;
// };

// // Get employees assigned to restaurant
// export const getRestaurantEmployees = async (restaurantId) => {
//   const res = await api.get(
//     `/restaurants/${restaurantId}/employees`
//   );
//   return res.data;
// };







import api from "./api";

/* ===============================
   RESTAURANT SERVICES
=============================== */

/* Get all restaurants (Admin) */
export const getRestaurants = async () => {
  return (await api.get("/restaurants")).data;
};

/* Get single restaurant */
export const getRestaurantById = async (restaurantId) => {
  return (await api.get(`/restaurants/${restaurantId}`)).data;
};

/* Create restaurant */
export const createRestaurant = async (data) => {
  return (await api.post("/restaurants", data)).data;
};

/* Update restaurant */
export const updateRestaurant = async (restaurantId, data) => {
  return (await api.put(`/restaurants/${restaurantId}`, data)).data;
};

/* Delete restaurant */
export const deleteRestaurant = async (restaurantId) => {
  return (await api.delete(`/restaurants/${restaurantId}`)).data;
};

/* Assign employees to restaurant */
export const assignEmployeesToRestaurant = async (
  restaurantId,
  employeeIds
) => {
  return (
    await api.put(`/restaurants/${restaurantId}/assign-employees`, {
      employeeIds,
    })
  ).data;
};

/* Get employees of restaurant */
export const getRestaurantEmployees = async (restaurantId) => {
  return (
    await api.get(`/restaurants/${restaurantId}/employees`)
  ).data;
};