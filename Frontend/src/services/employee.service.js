// import api from "./api";

// /* ===============================
//    EMPLOYEE MANAGEMENT SERVICES
// =============================== */

// // Get all employees (Admin / Manager)
// export const getAllEmployees = async () => {
//   const res = await api.get("/employees");
//   return res.data;
// };

// // Remove employee from restaurant
// export const removeEmployeeFromRestaurant = async (employeeId) => {
//   const res = await api.put(
//     `/employees/${employeeId}/remove-restaurant`
//   );
//   return res.data;
// };


import api from "./api";

/* ===============================
   EMPLOYEE MANAGEMENT SERVICES
=============================== */

/* Get all employees */
export const getAllEmployees = async () => {
  return (await api.get("/employees")).data;
};

/* Get single employee */
export const getEmployeeById = async (employeeId) => {
  return (await api.get(`/employees/${employeeId}`)).data;
};

/* Create employee */
export const createEmployee = async (data) => {
  return (await api.post("/employees", data)).data;
};

/* Update employee */
export const updateEmployee = async (employeeId, data) => {
  return (await api.put(`/employees/${employeeId}`, data)).data;
};

/* Delete employee */
export const deleteEmployee = async (employeeId) => {
  return (await api.delete(`/employees/${employeeId}`)).data;
};

/* Remove employee from restaurant */
export const removeEmployeeFromRestaurant = async (employeeId) => {
  return (
    await api.put(`/employees/${employeeId}/remove-restaurant`)
  ).data;
};

/* Reset employee password */
export const resetEmployeePassword = async (employeeId, newPassword) => {
  return (
    await api.put(`/employees/${employeeId}/reset-password`, {
      newPassword,
    })
  ).data;
};