import api from "./api";

/* ===============================
   EMPLOYEE MANAGEMENT SERVICES
=============================== */

// Get all employees (Admin / Manager)
export const getAllEmployees = async () => {
  const res = await api.get("/employees");
  return res.data;
};

// Remove employee from restaurant
export const removeEmployeeFromRestaurant = async (employeeId) => {
  const res = await api.put(
    `/employees/${employeeId}/remove-restaurant`
  );
  return res.data;
};
