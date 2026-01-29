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



// routes/table.Routes.js
const express = require("express");
const {
  createTable,
  getTables,
  getTableById,
  updateTable,
  deleteTable,
} = require("../controllers/table.Controller");

const router = express.Router();

router.post("/", createTable);
router.get("/", getTables);
router.get("/:id", getTableById);
router.put("/:id", updateTable);
router.delete("/:id", deleteTable);

module.exports = router;
