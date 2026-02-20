import React, { useEffect, useState } from "react";

/* ================= SERVICES ================= */
import {
  getRestaurants,
  createRestaurant,
} from "../../services/restaurant.service";

/* ================= COMPONENT ================= */
export default function AdminRestaurantManagement({
  onManageEmployees,
}) {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ===== ADD RESTAURANT STATE ===== */
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    gstNo: "",
  });

  /* ===== FILTER ===== */
  const [search, setSearch] = useState("");

  /* ================= FETCH ================= */
  const fetchRestaurants = async () => {
    try {
      const data = await getRestaurants();
      setRestaurants(data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to load restaurants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  /* ================= CREATE ================= */
  const handleCreateRestaurant = async (e) => {
    e.preventDefault();

    if (!form.name || !form.address || !form.phone) {
      alert("Name, Address & Phone are required");
      return;
    }

    try {
      await createRestaurant(form);
      setForm({ name: "", address: "", phone: "", gstNo: "" });
      setShowAddForm(false);
      fetchRestaurants();
    } catch (err) {
      console.error(err);
      alert("Failed to create restaurant");
    }
  };

  /* ================= FILTERED LIST ================= */
  const filteredRestaurants = restaurants.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  /* ================= UI ================= */
  if (loading) {
    return <p className="p-6">Loading restaurants...</p>;
  }

  return (
    <div className="p-6 space-y-6">
      {/* ===== BREADCRUMB ===== */}
      <div className="text-sm text-gray-500">
        Admin <span className="mx-1">/</span>
        <span className="text-gray-800 font-medium">
          Restaurant Management
        </span>
      </div>

      {/* ===== HEADER ===== */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">
          Restaurant Management
        </h2>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          + Add Restaurant
        </button>
      </div>

      {/* ===== SEARCH FILTER ===== */}
      <input
        type="text"
        placeholder="Search restaurant..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border p-2 rounded w-full md:w-1/3"
      />

      {/* ===== ADD FORM ===== */}
      {showAddForm && (
        <div className="bg-white border rounded p-4">
          <h3 className="text-lg font-semibold mb-3">
            Create Restaurant
          </h3>

          <form
            onSubmit={handleCreateRestaurant}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <input
              className="border p-2 rounded"
              placeholder="Restaurant Name"
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
            />

            <input
              className="border p-2 rounded"
              placeholder="Phone"
              value={form.phone}
              onChange={(e) =>
                setForm({ ...form, phone: e.target.value })
              }
            />

            <input
              className="border p-2 rounded md:col-span-2"
              placeholder="Address"
              value={form.address}
              onChange={(e) =>
                setForm({ ...form, address: e.target.value })
              }
            />

            <input
              className="border p-2 rounded md:col-span-2"
              placeholder="GST No (optional)"
              value={form.gstNo}
              onChange={(e) =>
                setForm({ ...form, gstNo: e.target.value })
              }
            />

            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                Save
              </button>

              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===== TABLE ===== */}
      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">Name</th>
              <th className="border p-2 text-left">Address</th>
              <th className="border p-2 text-left">Phone</th>
              <th className="border p-2 text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredRestaurants.length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  className="text-center p-4 text-gray-500"
                >
                  No restaurants found
                </td>
              </tr>
            ) : (
              filteredRestaurants.map((r) => (
                <tr key={r._id}>
                  <td className="border p-2">{r.name}</td>
                  <td className="border p-2">{r.address}</td>
                  <td className="border p-2">{r.phone}</td>
                  <td className="border p-2 text-center">
                    <button
                      onClick={() => onManageEmployees(r._id)}
                      className="bg-green-600 text-white px-3 py-1 rounded"
                    >
                      Manage Employees
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
