
// controllers/orderController.js
const Order = require("../models/order");      // <-- match file casing
// const Table = require("../models/Table");   // not needed for numeric table, unless you want to validate
const Menu = require("../models/Menu");        // keep if your file is actually 'menu.js'
const mongoose = require("mongoose");

function toClientShape(doc) {
  // items.menuItem is populated below; if not populated, fall back safely
  const itemsDetail = (doc.items || []).map((li) => {
    const m = li.menuItem || {};
    return {
      name: m.name || "Item",
      price: Number(m.price || 0),
      quantity: Number(li.quantity || 1),
      category: m.category || "misc",
      customization: "",
    };
  });

  const totalPrice = itemsDetail.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return {
    id: doc._id,
    _id: doc._id,
    table: Number(doc.table) || 1,                 // <-- numeric table straight from doc
    status: doc.status,
    served: doc.status === "served",
    items: itemsDetail.map((i) => i.name),
    itemsDetail,
    category: [...new Set(itemsDetail.map((i) => i.category).filter(Boolean))],
    totalPrice,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

// GET all orders
exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      // DO NOT populate('table') because it's a Number in the schema now
      .populate("items.menuItem", "name price category")
      .sort({ createdAt: -1 });
    res.json(orders.map(toClientShape));
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

// CREATE new order
exports.createOrder = async (req, res) => {
  try {
    const { table, itemsDetail = [], status } = req.body;

    const tableNumber = Number(table);
    if (!Number.isFinite(tableNumber)) {
      return res.status(400).json({ message: "Invalid table" });
    }

    // If you want to validate the table exists:
    // const t = await Table.findOne({ number: tableNumber });
    // if (!t) return res.status(400).json({ message: "Invalid table" });

    const menuDocs = await Menu.find({
      name: { $in: itemsDetail.map((i) => i.name) },
    });

    const menuMap = new Map(menuDocs.map((m) => [m.name.toLowerCase(), m]));

    const lineItems = itemsDetail.map((i) => {
      const m = menuMap.get(i.name.toLowerCase());
      if (!m) throw new Error(`Menu item not found: ${i.name}`);
      return { menuItem: m._id, quantity: i.quantity || 1 };
    });

    const totalAmount = itemsDetail.reduce(
      (s, i) => s + Number(i.price || 0) * Number(i.quantity || 1),
      0
    );

    const newOrder = await Order.create({
      table: tableNumber,                         // <-- store the number
      items: lineItems,
      status: (status || "pending").toLowerCase(),
      totalAmount,
    });

    // Populate only items.menuItem (table is a Number, no populate)
    const populated = await Order.findById(newOrder._id)
      .populate("items.menuItem", "name price category");

    res.status(201).json(toClientShape(populated));
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

// UPDATE order
exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const patch = req.body;

    const existing = await Order.findById(id);
    if (!existing) return res.status(404).json({ message: "Order not found" });

    if (patch.table != null) {
      const tableNumber = Number(patch.table);
      if (!Number.isFinite(tableNumber)) {
        return res.status(400).json({ message: "Invalid table" });
      }
      existing.table = tableNumber;              // <-- number, not ObjectId
    }

    if (Array.isArray(patch.itemsDetail)) {
      const menuDocs = await Menu.find({
        name: { $in: patch.itemsDetail.map((i) => i.name) },
      });
      const menuMap = new Map(menuDocs.map((m) => [m.name.toLowerCase(), m]));

      existing.items = patch.itemsDetail.map((i) => {
        const m = menuMap.get(i.name.toLowerCase());
        if (!m) throw new Error(`Menu item not found: ${i.name}`);
        return { menuItem: m._id, quantity: i.quantity || 1 };
      });

      existing.totalAmount = patch.itemsDetail.reduce(
        (s, i) => s + Number(i.price || 0) * Number(i.quantity || 1),
        0
      );
    }

    if (patch.status) existing.status = patch.status.toLowerCase();
    if (patch.served === true) existing.status = "served";

    await existing.save();

    const populated = await Order.findById(existing._id)
      .populate("items.menuItem", "name price category");

    res.json(toClientShape(populated));
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};

// DELETE order
exports.deleteOrder = async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "Order deleted successfully" });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
};
