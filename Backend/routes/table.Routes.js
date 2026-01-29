// const express = require("express");
// const router = express.Router();
// const {
//   getTables,
//   createTable,
//   updateTable,
//   deleteTable,
// } = require("../controllers/table.Controller");

// // Routes
// router.get("/", getTables);
// router.post("/", createTable);
// router.put("/:id", updateTable);
// router.delete("/:id", deleteTable);

// module.exports = router;


// // routes/table.Routes.js
// const express = require('express');
// const router = express.Router();

// const {
//   getTables,
//   createTable,
//   updateTable,
//   deleteTable,
// } = require('../controllers/table.Controller');

// // Routes
// router.get('/', getTables);
// router.post('/', createTable);
// router.put('/:id', updateTable);
// router.delete('/:id', deleteTable);

// module.exports = router;



// routes/Table.Routes.js
import express from "express";
import tableController from "../controllers/table.controller.js";

const router = express.Router();

/* ===============================
   TABLE ROUTES
=============================== */

// create table (admin/manager)
router.post("/", tableController.createTable);

// get all tables
router.get("/", tableController.getTables);

// get single table
router.get("/:id", tableController.getTableById);

// update table status (occupied / free)
router.put("/:id/status", tableController.updateTableStatus);

// delete table
router.delete("/:id", tableController.deleteTable);

export default router;
