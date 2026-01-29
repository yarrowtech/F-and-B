// // controllers/table.Controller.js

// // Get all tables
// exports.getTables = (req, res) => {
//   res.json({ message: "All tables fetched" });
// };

// // Create a new table
// exports.createTable = (req, res) => {
//   res.json({ message: "New table created" });
// };

// // Update table by ID
// exports.updateTable = (req, res) => {
//   res.json({ message: `Table ${req.params.id} updated` });
// };

// // Delete table by ID
// exports.deleteTable = (req, res) => {
//   res.json({ message: `Table ${req.params.id} deleted` });
// };




// controllers/tableController.js
const Table = require("../models/Table");

/** Create table */
const createTable = async (req, res, next) => {
  try {
    const { number, seats, status, notes } = req.body;
    const existing = await Table.findOne({ number });
    if (existing) return res.status(400).json({ message: "Table number already exists" });

    const t = await Table.create({ number, seats, status, notes });
    res.status(201).json(t);
  } catch (err) {
    next(err);
  }
};

/** List tables */
const getTables = async (req, res, next) => {
  try {
    const tables = await Table.find({}).sort({ number: 1 });
    res.json(tables);
  } catch (err) {
    next(err);
  }
};

/** Get table by ID */
const getTableById = async (req, res, next) => {
  try {
    const t = await Table.findById(req.params.id);
    if (!t) return res.status(404).json({ message: "Table not found" });
    res.json(t);
  } catch (err) {
    next(err);
  }
};

/** Update table */
const updateTable = async (req, res, next) => {
  try {
    const updated = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ message: "Table not found" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

/** Delete table */
const deleteTable = async (req, res, next) => {
  try {
    await Table.findByIdAndDelete(req.params.id);
    res.json({ message: "Table deleted" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTable,
  getTables,
  getTableById,
  updateTable,
  deleteTable,
};
