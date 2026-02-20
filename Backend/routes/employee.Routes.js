
// routes/employee.Routes.js
import express from "express";
import employeeController from "../controllers/employee.Controller.js";

const router = express.Router();

/* ===============================
   EMPLOYEE ROUTES
=============================== */
router.post("/", employeeController.createEmployee);
router.get("/", employeeController.getEmployees);
router.get("/:id", employeeController.getEmployeeById);
router.put("/:id", employeeController.updateEmployee);
router.delete("/:id", employeeController.deleteEmployee);

router.put(
  "/:id/remove-restaurant",
  employeeController.removeEmployeeFromRestaurant
);


export default router;
