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
  const [errors, setErrors] = useState({});

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

    // Clear previous errors
    setErrors({});

    // Validate required fields
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Restaurant name is required";
    if (!form.address.trim()) newErrors.address = "Address is required";
    if (!form.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(form.phone)) newErrors.phone = "Phone number must be exactly 10 digits";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await createRestaurant(form);
      setForm({ name: "", address: "", phone: "", gstNo: "" });
      setShowAddForm(false);
      setErrors({});
      fetchRestaurants();
    } catch (err) {
      console.error(err);
      alert("Failed to create restaurant");
    }
  };

  /* ================= FORM HANDLERS ================= */
  const handleInputChange = (field, value) => {
    if (field === "phone") {
      // Only allow digits and cap phone length to 10 characters
      value = value.replace(/\D/g, "").slice(0, 10);
    }
    setForm({ ...form, [field]: value });
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
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
        <div className="bg-white border rounded p-6 shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Create Restaurant
          </h3>

          <form
            onSubmit={handleCreateRestaurant}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Restaurant Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className={`border p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                placeholder="Enter restaurant name"
                value={form.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                pattern="[0-9]{10}"
                className={`border p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-500 ${errors.phone ? "border-red-500" : "border-gray-300"
                  }`}
                placeholder="Enter 10-digit phone number"
                value={form.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                required
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address <span className="text-red-500">*</span>
              </label>
              <textarea
                className={`border p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-500 resize-none ${errors.address ? "border-red-500" : "border-gray-300"
                  }`}
                placeholder="Enter restaurant address"
                value={form.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                rows="3"
                required
              />
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">{errors.address}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GST Number (Optional)
              </label>
              <input
                type="text"
                className="border border-gray-300 p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter GST number"
                value={form.gstNo}
                onChange={(e) => handleInputChange("gstNo", e.target.value)}
              />
            </div>

            <div className="md:col-span-2 flex gap-3 mt-4">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-medium transition-colors"
              >
                Save Restaurant
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setErrors({});
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-6 py-2 rounded font-medium transition-colors"
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
