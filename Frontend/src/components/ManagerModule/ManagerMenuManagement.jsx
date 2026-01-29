import React, { useState } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";

const MenuManagement = () => {
  const restaurantName = "Downtown Diner";

  const [menus, setMenus] = useState([
    { id: 1, name: "Grilled Cheese", price: 80, bestSeller: true },
    { id: 2, name: "Tomato Soup", price: 50, bestSeller: false },
  ]);

  const [form, setForm] = useState({ name: "", price: "", bestSeller: false });

  const handleAddMenu = (e) => {
    e.preventDefault();
    const newItem = {
      id: Date.now(),
      name: form.name,
      price: parseFloat(form.price),
      bestSeller: form.bestSeller,
    };

    setMenus((prev) => [...prev, newItem]);
    setForm({ name: "", price: "", bestSeller: false });
  };

  const handleRemove = (id) => {
    setMenus((prev) => prev.filter((item) => item.id !== id));
  };

  const bestSellers = menus.filter((item) => item.bestSeller);

  return (
    <div className="p-6 space-y-10 bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100 transition-colors">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Menu Management</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Managing menu of <span className="font-medium text-green-500">{restaurantName}</span>
          </p>
        </div>
      </div>

      {/* Show Menu */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">📋 Current Menu</h2>
        <ul className="grid md:grid-cols-2 gap-4">
          {menus.map((item) => (
            <li
              key={item.id}
              className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow flex justify-between items-center border border-gray-200 dark:border-gray-700"
            >
              <div>
                <div className="font-bold text-lg">{item.name}</div>
                <div className="text-gray-600 dark:text-gray-400">₹{item.price}</div>
                {item.bestSeller && (
                  <span className="text-sm text-green-600 dark:text-green-400 font-semibold">
                    ⭐ Best Seller
                  </span>
                )}
              </div>
              <button
                onClick={() => handleRemove(item.id)}
                className="text-red-500 hover:text-red-700 font-medium rounded-full px-4 py-1 transition-colors"
              >
                <FaTrash />
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Add Menu Item */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">➕ Add Menu Item</h2>
        <form onSubmit={handleAddMenu} className="grid gap-4 max-w-md bg-white dark:bg-gray-800 p-6 rounded-xl shadow border border-gray-200 dark:border-gray-700">
          <input
            type="text"
            placeholder="Dish Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border p-2 rounded-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          <input
            type="number"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="border p-2 rounded-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.bestSeller}
              onChange={(e) => setForm({ ...form, bestSeller: e.target.checked })}
              className="accent-green-600"
            />
            Mark as Best Seller
          </label>
          <button
            type="submit"
            className="bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition-transform transform hover:scale-105 font-semibold"
          >
            <FaPlus /> Add Item
          </button>
        </form>
      </section>

      {/* Best Sellers */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">🏆 Best Selling Items</h2>
        {bestSellers.length > 0 ? (
          <ul className="grid md:grid-cols-2 gap-4">
            {bestSellers.map((item) => (
              <li
                key={item.id}
                className="bg-green-100 dark:bg-green-900 p-4 rounded-xl shadow border border-green-300 dark:border-green-800"
              >
                <div className="font-bold text-lg">{item.name}</div>
                <div className="text-gray-700 dark:text-gray-300">₹{item.price}</div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            No best sellers marked for {restaurantName}.
          </p>
        )}
      </section>
    </div>
  );
};

export default MenuManagement;
