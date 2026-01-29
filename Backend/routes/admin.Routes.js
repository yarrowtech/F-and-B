
// const express = require("express");
// const { registerAdmin, loginAdmin } = require("../controllers/admin.Controller");

// const router = express.Router();

// router.post("/register", registerAdmin);
// router.post("/login", loginAdmin);

// module.exports = router;



import express from "express";
import {
  createEmployee,
  createMenuItem,
  createTable,
} from "../controllers/admin.Controller.js";

import auth from "../middlewares/auth.middleware.js";
import role from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(auth, role("ADMIN"));

router.post("/employee", createEmployee);
router.post("/menu", createMenuItem);
router.post("/table", createTable);

export default router;
