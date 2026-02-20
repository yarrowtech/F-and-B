

// controllers/employee.controller.js
import Employee from "../models/Employee.model.js";

/* ===============================
   CREATE EMPLOYEE
=============================== */
const createEmployee = async (req, res) => {
  try {
    const employee = await Employee.create(req.body);
    res.status(201).json(employee);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ===============================
   GET ALL EMPLOYEES
=============================== */
const getEmployees = async (_req, res) => {
  try {
    const employees = await Employee.find({});
    res.json(employees);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ===============================
   GET EMPLOYEE BY ID
=============================== */
const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json(employee);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ===============================
   UPDATE EMPLOYEE
=============================== */
const updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(employee);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ===============================
   DELETE EMPLOYEE
=============================== */
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }
    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ===============================
   REMOVE EMPLOYEE FROM RESTAURANT
=============================== */
const removeEmployeeFromRestaurant = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { restaurant: null },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json({
      success: true,
      message: "Employee removed from restaurant",
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


/* ===============================
   ✅ DEFAULT EXPORT (REQUIRED)
=============================== */
export default {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
  removeEmployeeFromRestaurant,
};
