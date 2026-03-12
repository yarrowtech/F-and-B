
// // routes/employee.Routes.js
// import express from "express";
// import employeeController from "../controllers/employee.Controller.js";

// const router = express.Router();

// /* ===============================
//    EMPLOYEE ROUTES
// =============================== */
// router.post("/", employeeController.createEmployee);
// router.get("/", employeeController.getEmployees);
// router.get("/:id", employeeController.getEmployeeById);
// router.put("/:id", employeeController.updateEmployee);
// router.delete("/:id", employeeController.deleteEmployee);

// router.put(
//   "/:id/remove-restaurant",
//   employeeController.removeEmployeeFromRestaurant
// );


// export default router;








// routes/employee.Routes.js

import express from "express";
import employeeController from "../controllers/employee.Controller.js";
import auth from "../middlewares/auth.middleware.js";

const router = express.Router();

/* ===============================
   EMPLOYEE ROUTES
=============================== */

/* CREATE EMPLOYEE */
router.post("/", auth, employeeController.createEmployee);

/* GET ALL EMPLOYEES */
router.get("/", auth, employeeController.getEmployees);

/* GET SINGLE EMPLOYEE */
router.get("/:id", auth, employeeController.getEmployeeById);

/* UPDATE EMPLOYEE */
router.put("/:id", auth, employeeController.updateEmployee);

/* DELETE EMPLOYEE */
router.delete("/:id", auth, employeeController.deleteEmployee);

/* REMOVE EMPLOYEE FROM RESTAURANT */
router.put(
  "/:id/remove-restaurant",
  auth,
  employeeController.removeEmployeeFromRestaurant
);

/* ADMIN RESET EMPLOYEE PASSWORD */
router.put(
  "/:id/reset-password",
  auth,
  employeeController.resetEmployeePassword
);

export default router;