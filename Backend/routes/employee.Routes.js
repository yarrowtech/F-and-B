// // const express = require("express");
// // // const { createEmployee, getEmployees } = require("../controllers/employeeController");
// // const { createEmployee, getEmployees } = require("../controllers/employee.Controller ");
// // const router = express.Router();

// // router.post("/create", createEmployee);
// // router.get("/", getEmployees);

// // module.exports = router;

// // const express = require("express");
// // const { createEmployee, loginEmployee, getEmployees } = require("../controllers/employee.Controller");
// // const { protect } = require("../middlewares/authMiddleware");

// // const router = express.Router();

// // router.post("/create", protect, createEmployee);
// // router.get("/", protect, getEmployees);
// // router.post("/", protect, createEmployee);
// // router.post("/login", loginEmployee);

// // module.exports = router;


// // routes/employeeRoutes.js

// // const express = require("express");
// // const {
// //   registerEmployee,
// //   loginEmployee,
// //   getAllEmployees,
// //   updateEmployee,
// //   deleteEmployee,
// // } = require("../controllers/employee.Controller");
// // const { protect, adminOnly } = require("../middlewares/authMiddleware");

// // const router = express.Router();

// // // ===============================
// // // Public Routes
// // // ===============================
// // router.post("/login", loginEmployee);

// // // ===============================
// // // Admin Protected Routes
// // // ===============================
// // router.post("/register", protect, adminOnly, registerEmployee);
// // router.get("/", protect, adminOnly, getAllEmployees);
// // router.put("/:id", protect, adminOnly, updateEmployee);
// // router.delete("/:id", protect, adminOnly, deleteEmployee);

// // module.exports = router;

// const express = require("express");
// const {
//   registerEmployee,
//   loginEmployee,
//   getAllEmployees,
//   updateEmployee,
//   deleteEmployee,
// } = require("../controllers/employee.Controller");

// const router = express.Router();

// // ===============================
// // Public Routes (No Token Required)
// // ===============================
// router.post("/login", loginEmployee);
// router.post("/register", registerEmployee);
// router.get("/", getAllEmployees);
// router.put("/:id", updateEmployee);
// router.delete("/:id", deleteEmployee);

// module.exports = router;



// const express = require("express");
// const {
//   registerEmployee,
//   loginEmployee,
//   getAllEmployees,
//   updateEmployee,
//   deleteEmployee,
// } = require("../controllers/employee.Controller");
// const { protect, adminOnly } = require("../middlewares/authMiddleware");

// const router = express.Router();

// // Public
// router.post("/login", loginEmployee);

// // Admin Protected
// router.post("/register",  registerEmployee);
// router.get("/", getAllEmployees);
// router.put("/:id" ,updateEmployee);
// router.delete("/:id", deleteEmployee);

// module.exports = router;



// const express = require('express');
// const router = express.Router();
// const ctrl = require('../controllers/employee.Controller');
// const { protect, authorizeRoles } = require('../middlewares/authMiddleware');

// router.post('/login', ctrl.loginEmployee);
// router.post('/register', authorizeRoles('Admin','SuperAdmin'), ctrl.registerEmployee);
// router.get('/',authorizeRoles('Admin','SuperAdmin'), ctrl.getAllEmployees);
// router.put('/:id', authorizeRoles('Admin','SuperAdmin'), ctrl.updateEmployee);
// router.delete('/:id', authorizeRoles('Admin','SuperAdmin'), ctrl.deleteEmployee);

// module.exports = router;

const express = require("express");
const {
  registerEmployee,
  loginEmployee,
  getAllEmployees,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/employee.Controller");
const router = express.Router();

// No auth middleware, all routes are public
router.post("/register", registerEmployee);
router.post("/login", loginEmployee);
router.get("/", getAllEmployees);
router.put("/:id", updateEmployee);
router.delete("/:id", deleteEmployee);

module.exports = router;