// controllers/menu.controller.js
import Menu from "../models/Menu.model.js";

const createMenuItem = async (req, res) => {
  try {
    const item = await Menu.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const getMenu = async (_req, res) => {
  try {
    const items = await Menu.find({});
    res.json(items);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const getMenuItemById = async (req, res) => {
  try {
    const item = await Menu.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateMenuItem = async (req, res) => {
  try {
    const item = await Menu.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!item) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    res.json(item);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteMenuItem = async (req, res) => {
  try {
    const item = await Menu.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    res.json({ message: "Menu item deleted" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/* 🔒 THIS LINE IS NON-NEGOTIABLE */
export default {
  createMenuItem,
  getMenu,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
};
