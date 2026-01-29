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



// controllers/table.controller.js
import Table from "../models/Table.model.js";

/* ===============================
   CREATE TABLE
=============================== */
const createTable = async (req, res) => {
  try {
    const table = await Table.create(req.body);
    res.status(201).json(table);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ===============================
   GET ALL TABLES
=============================== */
const getTables = async (_req, res) => {
  try {
    const tables = await Table.find({});
    res.json(tables);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ===============================
   GET TABLE BY ID
=============================== */
const getTableById = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table)
      return res.status(404).json({ message: "Table not found" });
    res.json(table);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ===============================
   UPDATE TABLE STATUS
=============================== */
const updateTableStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const table = await Table.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!table)
      return res.status(404).json({ message: "Table not found" });

    res.json(table);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ===============================
   DELETE TABLE
=============================== */
const deleteTable = async (req, res) => {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);
    if (!table)
      return res.status(404).json({ message: "Table not found" });
    res.json({ message: "Table deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* ===============================
   ✅ DEFAULT EXPORT (REQUIRED)
=============================== */
export default {
  createTable,
  getTables,
  getTableById,
  updateTableStatus,
  deleteTable,
};
