// const MenuItem = require("../models/menuItem");

// // Get all menu items
// exports.getMenu = async (req, res) => {
//   const menu = await MenuItem.find();
//   res.json(menu);
// };

// // Add a menu item
// exports.addMenuItem = async (req, res) => {
//   const item = await MenuItem.create(req.body);
//   res.status(201).json(item);
// };

// // Update a menu item
// exports.updateMenuItem = async (req, res) => {
//   const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
//   if (!item) return res.status(404).json({ message: "Menu item not found" });
//   res.json(item);
// };

// // Delete a menu item
// exports.deleteMenuItem = async (req, res) => {
//   const item = await MenuItem.findByIdAndDelete(req.params.id);
//   if (!item) return res.status(404).json({ message: "Menu item not found" });
//   res.json({ message: "Menu item deleted" });
// };



// const Menu = require("../models/menu");

// exports.list = async (req, res) => {
//   const menu = await Menu.find();
//   res.json(menu);
// };

// exports.add = async (req, res) => {
//   const menu = new Menu(req.body);
//   await menu.save();
//   res.json(menu);
// };

// exports.update = async (req, res) => {
//   const menu = await Menu.findByIdAndUpdate(req.params.id, req.body, { new: true });
//   res.json(menu);
// };

// exports.remove = async (req, res) => {
//   await Menu.findByIdAndDelete(req.params.id);
//   res.json({ message: "Deleted" });
// };





// controllers/menu.Controller.js

// // Get all menu items
// exports.getMenu = (req, res) => {
//   res.json({ message: "Menu list fetched" });
// };

// // Create a menu item
// exports.createMenuItem = (req, res) => {
//   res.json({ message: "Menu item created" });
// };

// // Update a menu item
// exports.updateMenuItem = (req, res) => {
//   res.json({ message: `Menu item ${req.params.id} updated` });
// };

// // Delete a menu item
// exports.deleteMenuItem = (req, res) => {
//   res.json({ message: `Menu item ${req.params.id} deleted` });
// };

// controllers/menu.Controller.js

// let menus = [
//   { id: 1, name: "Paneer Butter Masala", price: 250, category: "Indian", bestSeller: false },
//   { id: 2, name: "Hakka Noodles", price: 180, category: "Chinese", bestSeller: false },
//   { id: 3, name: "Margherita Pizza", price: 300, category: "Italian", bestSeller: false },
//   { id: 4, name: "Pasta Alfredo", price: 280, category: "Italian", bestSeller: false },
//   { id: 5, name: "Mojito", price: 120, category: "Beverages", bestSeller: false },
//   { id: 6, name: "Fish Tacos", price: 140, category: "Continental", bestSeller: true },
//   { id: 7, name: "Iced Coffee", price: 60, category: "Beverages", bestSeller: false },
//   { id: 8, name: "Hot Chocolate", price: 70, category: "Beverages", bestSeller: true },
// ];

// // Get all menu items
// exports.getMenu = (req, res) => {
//   res.json(menus);
// };

// // Create a menu item
// exports.createMenuItem = (req, res) => {
//   const { name, price, category, bestSeller } = req.body;
//   const newItem = {
//     id: Date.now(),
//     name,
//     price,
//     category,
//     bestSeller: !!bestSeller,
//   };
//   menus.push(newItem);
//   res.json(menus); // return updated menu array
// };

// // Update a menu item
// exports.updateMenuItem = (req, res) => {
//   const { id } = req.params;
//   const { name, price, category, bestSeller } = req.body;

//   menus = menus.map((item) =>
//     item.id == id ? { ...item, name, price, category, bestSeller: !!bestSeller } : item
//   );

//   res.json(menus); // return updated menu array
// };

// // Delete a menu item
// exports.deleteMenuItem = (req, res) => {
//   const { id } = req.params;
//   menus = menus.filter((item) => item.id != id);
//   res.json(menus); // return updated menu array
// };



// exports.getMenu = (req, res) => {
//   res.json([{ _id: "1", name: "Pizza", price: 200, category: "Italian", bestSeller: true }]);
// };

// exports.createMenuItem = (req, res) => {
//   const { name, price, category, bestSeller } = req.body;
//   const newItem = { _id: Date.now().toString(), name, price, category, bestSeller };
//   res.json(newItem); // 👈 return created item (so frontend can append it)
// };

// exports.updateMenuItem = (req, res) => {
//   res.json({ message: `Menu item ${req.params.id} updated` });
// };

// exports.deleteMenuItem = (req, res) => {
//   res.json({ message: `Menu item ${req.params.id} deleted` });
// };




// const Menu = require("../models/menu");

// // 📌 Get all menu items
// exports.getMenu = async (req, res) => {
//   try {
//     const menus = await Menu.find();
//     res.json(menus);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // 📌 Create a new menu item
// exports.createMenuItem = async (req, res) => {
//   try {
//     const { name, price, category, bestSeller } = req.body;

//     const newMenu = new Menu({
//       name,
//       price,
//       category,
//       bestSeller: bestSeller || false,
//     });

//     const savedMenu = await newMenu.save();
//     res.status(201).json(savedMenu); // ✅ return saved item
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };

// // 📌 Delete menu item
// exports.deleteMenuItem = async (req, res) => {
//   try {
//     const deleted = await Menu.findByIdAndDelete(req.params.id);
//     if (!deleted) return res.status(404).json({ message: "Item not found" });
//     res.json({ message: "Menu item removed" });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };







// controllers/menuController.js
const Menu = require("../models/Menu");

/** Create a new menu item (Admin) */
const createMenuItem = async (req, res, next) => {
  try {
    const { name, price, category, description, available, bestSeller } = req.body;

    const newItem = await Menu.create({
      name,
      price,
      category,
      description,
      available,
      bestSeller,
    });

    res.status(201).json(newItem);
  } catch (err) {
    next(err);
  }
};

/** Get all menu items (optionally filter by category) */
const getMenuItems = async (req, res, next) => {
  try {
    const { category } = req.query;
    const filter = category ? { category } : {};
    const items = await Menu.find(filter).sort({ name: 1 });
    res.json(items);
  } catch (err) {
    next(err);
  }
};

/** Get single menu item by ID */
const getMenuItemById = async (req, res, next) => {
  try {
    const item = await Menu.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Menu item not found" });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

/** Update menu item */
const updateMenuItem = async (req, res, next) => {
  try {
    const updatedItem = await Menu.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updatedItem) return res.status(404).json({ message: "Menu item not found" });
    res.json(updatedItem);
  } catch (err) {
    next(err);
  }
};

/** Delete menu item */
const deleteMenuItem = async (req, res, next) => {
  try {
    const deleted = await Menu.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Menu item not found" });
    res.json({ message: "Menu item deleted successfully" });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createMenuItem,
  getMenuItems,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
};
