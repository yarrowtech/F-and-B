
import React, { useEffect, useState } from "react";
import {
  getInventory,
  getItemLogs,
} from "../../services/inventory.service";
import { getRestaurants } from "../../services/restaurant.service";

const AdminInventory = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState("");
  const [inventory, setInventory] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= LOAD RESTAURANTS ================= */

  const loadRestaurants = async () => {
    try {
      const data = await getRestaurants();

      setRestaurants(data || []);

      if (data.length > 0) {
        setSelectedRestaurant(data[0]._id);
      }
    } catch (error) {
      console.error("Restaurant load error:", error);
    }
  };

  /* ================= LOAD INVENTORY ================= */

  const loadInventory = async (restaurantId) => {
    try {
      setLoading(true);

      const data = await getInventory(restaurantId);

      setInventory(data || []);
      setLogs([]); // clear logs when restaurant changes
    } catch (error) {
      console.error("Inventory load error:", error);
    } finally {
      setLoading(false);
    }
  };

  /* ================= VIEW LOGS ================= */

const viewLogs = async (itemId) => {
  try {

    const data = await getItemLogs(itemId, selectedRestaurant);

    setLogs(data || []);

  } catch (error) {
    console.error("Log error:", error);
  }
};

  /* ================= INIT ================= */

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    if (selectedRestaurant) {
      loadInventory(selectedRestaurant);
    }
  }, [selectedRestaurant]);

  return (
    <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">
        Admin Inventory
      </h1>

      {/* ================= RESTAURANT SELECT ================= */}

      <div className="mb-6">
        <label className="block mb-2 font-semibold text-gray-700 dark:text-gray-200">
          Select Restaurant
        </label>

        <select
          value={selectedRestaurant}
          onChange={(e) => setSelectedRestaurant(e.target.value)}
          className="p-3 border rounded w-full md:w-96"
        >
          {restaurants.map((r) => (
            <option key={r._id} value={r._id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {/* ================= INVENTORY TABLE ================= */}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-200 dark:bg-gray-700">
            <tr>
              <th className="p-3">Item</th>
              <th className="p-3">Unit</th>
              <th className="p-3">Quantity</th>
              <th className="p-3">Low Stock</th>
              <th className="p-3">Status</th>
              <th className="p-3">Last Updated</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="p-4 text-center">
                  Loading inventory...
                </td>
              </tr>
            ) : inventory.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-4 text-center">
                  No inventory found
                </td>
              </tr>
            ) : (
              inventory.map((item) => (
                <tr key={item._id} className="border-t">
                  <td className="p-3 font-semibold">{item.name}</td>

                  <td className="p-3">{item.unit}</td>

                  <td
                    className={`p-3 ${
                      item.quantity <= item.lowStockThreshold
                        ? "text-red-600 font-bold"
                        : ""
                    }`}
                  >
                    {item.quantity}
                  </td>

                  <td className="p-3">{item.lowStockThreshold}</td>

                  <td className="p-3">
                    {item.quantity <= item.lowStockThreshold ? (
                      <span className="text-red-600 font-semibold">
                        ⚠ Low Stock
                      </span>
                    ) : (
                      <span className="text-green-600 font-semibold">
                        OK
                      </span>
                    )}
                  </td>

                  <td className="p-3">
                    {new Date(item.updatedAt).toLocaleString()}
                  </td>

                  <td className="p-3">
                    <button
                      onClick={() => viewLogs(item._id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                    >
                      View Logs
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ================= INVENTORY LOGS ================= */}

      {logs.length > 0 && (
        <div className="mt-6 bg-gray-100 dark:bg-gray-700 p-4 rounded">
          <h2 className="text-lg font-bold mb-3">Inventory Logs</h2>

          {logs.map((log) => (
            <div
              key={log._id}
              className="border-b py-2 text-sm flex justify-between"
            >
              <span>
                {log.action} {log.quantityAdded} {log.unit}
              </span>

              <span>
                {log.addedBy?.name || "Unknown"} •{" "}
                {new Date(log.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminInventory;