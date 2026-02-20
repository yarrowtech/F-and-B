import React, { useEffect, useState } from "react";
import {
  getInventory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  addStock,
} from "../../services/inventory.service";

export default function InventoryManagement() {
  const user = JSON.parse(localStorage.getItem("user"));

  // 🔥 IMPORTANT: restaurant ID from logged in user
  const restaurantId = user?.restaurant;

  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    unit: "",
    quantity: "",
    minStockLevel: "",
  });

  const [editingId, setEditingId] = useState(null);

  /* ================= LOAD INVENTORY ================= */

  const loadInventory = async () => {
    try {
      if (!restaurantId) return;

      setLoading(true);
      const data = await getInventory(restaurantId);
      setInventory(Array.isArray(data) ? data : []);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, [restaurantId]);

  /* ================= CREATE / UPDATE ================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name || !form.unit)
      return alert("Name and Unit required");

    try {
      const payload = {
        name: form.name,
        unit: form.unit,
        quantity: Number(form.quantity || 0),
        lowStockThreshold: Number(form.minStockLevel || 0),
      };

      if (editingId) {
        await updateInventoryItem(
          restaurantId,
          editingId,
          payload
        );
      } else {
        await createInventoryItem(
          restaurantId,
          payload
        );
      }

      setForm({
        name: "",
        unit: "",
        quantity: "",
        minStockLevel: "",
      });

      setEditingId(null);
      loadInventory();
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };

  /* ================= DELETE ================= */

  const handleDelete = async (id) => {
    if (!window.confirm("Delete item?")) return;

    try {
      await deleteInventoryItem(restaurantId, id);
      loadInventory();
    } catch {
      alert("Delete failed");
    }
  };

  /* ================= ADD STOCK ================= */

  const handleAddStock = async (id) => {
    const qty = prompt("Enter quantity to add:");
    if (!qty) return;

    try {
      await addStock(
        restaurantId,
        id,
        Number(qty)
      );
      loadInventory();
    } catch {
      alert("Failed to add stock");
    }
  };

  /* ================= EDIT ================= */

  const handleEdit = (item) => {
    setEditingId(item._id);
    setForm({
      name: item.name,
      unit: item.unit,
      quantity: item.quantity,
      minStockLevel: item.lowStockThreshold,
    });
  };

  if (!restaurantId) {
    return (
      <div className="p-10 text-red-600">
        No restaurant assigned.
      </div>
    );
  }

  if (loading) {
    return <div className="p-10">Loading inventory...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">
        Inventory Management
      </h1>

      {/* TABLE */}
      <div className="bg-white p-6 rounded-xl shadow mb-8">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Item</th>
              <th className="p-2 text-left">Quantity</th>
              <th className="p-2 text-left">Unit</th>
              <th className="p-2 text-left">Min Level</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>

          <tbody>
            {inventory.map((item) => {
              const low =
                item.quantity <= item.lowStockThreshold;

              return (
                <tr key={item._id} className="border-b">
                  <td className="p-2">{item.name}</td>
                  <td className={`p-2 ${low ? "text-red-600 font-bold" : ""}`}>
                    {item.quantity}
                  </td>
                  <td className="p-2">{item.unit}</td>
                  <td className="p-2">{item.lowStockThreshold}</td>
                  <td className="p-2">
                    {low ? "Low Stock" : "OK"}
                  </td>
                  <td className="p-2 flex gap-2">
                    <button
                      onClick={() => handleAddStock(item._id)}
                      className="px-3 py-1 bg-green-600 text-white rounded"
                    >
                      Add
                    </button>

                    <button
                      onClick={() => handleEdit(item)}
                      className="px-3 py-1 bg-yellow-500 text-white rounded"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDelete(item._id)}
                      className="px-3 py-1 bg-red-600 text-white rounded"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* FORM */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h2 className="text-xl font-semibold mb-4">
          {editingId ? "Edit Inventory Item" : "Add New Item"}
        </h2>

        <form
          onSubmit={handleSubmit}
          className="grid md:grid-cols-2 gap-4"
        >
          <input
            placeholder="Item Name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
            className="border p-3 rounded"
            required
          />

          <input
            placeholder="Unit (kg, pcs, etc)"
            value={form.unit}
            onChange={(e) =>
              setForm({ ...form, unit: e.target.value })
            }
            className="border p-3 rounded"
            required
          />

          <input
            type="number"
            placeholder="Initial Quantity"
            value={form.quantity}
            onChange={(e) =>
              setForm({ ...form, quantity: e.target.value })
            }
            className="border p-3 rounded"
          />

          <input
            type="number"
            placeholder="Minimum Stock Level"
            value={form.minStockLevel}
            onChange={(e) =>
              setForm({ ...form, minStockLevel: e.target.value })
            }
            className="border p-3 rounded"
          />

          <button className="col-span-2 bg-green-600 text-white py-3 rounded">
            {editingId ? "Update Item" : "Add Item"}
          </button>
        </form>
      </div>
    </div>
  );
}
