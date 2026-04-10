import React, { useEffect, useState } from "react";
import { FaTrash, FaPlus, FaArrowLeft } from "react-icons/fa";

/* ================= SERVICES ================= */
import {
  getRestaurantById,
  getRestaurantEmployees,
  assignEmployeesToRestaurant,
} from "../../services/restaurant.service";

import {
  getAllEmployees,
  removeEmployeeFromRestaurant,
} from "../../services/employee.service";

export default function RestaurantEmployees({ restaurantId, onBack }) {
  const [restaurant, setRestaurant] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);
  const [assignedEmployees, setAssignedEmployees] = useState([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= FETCH ================= */

  const fetchRestaurant = async () => {
    const data = await getRestaurantById(restaurantId);
    setRestaurant(data);
  };

  const fetchAllEmployees = async () => {
    const data = await getAllEmployees();
    setAllEmployees(data || []);
  };

  const fetchAssignedEmployees = async () => {
    const data = await getRestaurantEmployees(restaurantId);
    setAssignedEmployees(data || []);
  };

  const refreshAll = async () => {
    await Promise.all([
      fetchRestaurant(),
      fetchAllEmployees(),
      fetchAssignedEmployees(),
    ]);
  };

  useEffect(() => {
    refreshAll();
  }, [restaurantId]);

  /* ================= DERIVED ================= */

  const availableEmployees = allEmployees.filter((e) => {
    if (!e.restaurant) return true;

    const assignedId =
      typeof e.restaurant === "object"
        ? e.restaurant._id
        : e.restaurant;

    return assignedId !== restaurantId;
  });

  /* ================= ASSIGN ================= */

  const assignEmployees = async () => {
    if (selectedEmployeeIds.length === 0) {
      alert("Select at least one employee");
      return;
    }

    setLoading(true);
    try {
      await assignEmployeesToRestaurant(
        restaurantId,
        selectedEmployeeIds
      );
      setSelectedEmployeeIds([]);
      refreshAll();
    } finally {
      setLoading(false);
    }
  };

  /* ================= REMOVE ================= */

  const removeEmployee = async (employeeId) => {
    if (!window.confirm("Remove employee from restaurant?")) return;
    await removeEmployeeFromRestaurant(employeeId);
    refreshAll();
  };

  /* ================= UI ================= */

  if (!restaurant) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-4 sm:p-6 space-y-6 overflow-x-hidden">
      {/* ===== BACK ===== */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-black"
      >
        <FaArrowLeft /> Back to Restaurants
      </button>

      {/* ===== RESTAURANT INFO ===== */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="text-2xl font-bold">{restaurant.name}</h2>
        <p className="text-gray-600">{restaurant.address}</p>
        <p className="text-gray-600">Phone: {restaurant.phone}</p>
        <p className="font-semibold">{restaurant.status}</p>
      </div>

      {/* ===== ADD EMPLOYEES ===== */}
      <div className="bg-white rounded shadow p-4">
        <h3 className="text-lg font-semibold mb-3">Add Employees</h3>

        {availableEmployees.length === 0 ? (
          <p className="text-gray-500">No available employees</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="min-w-[520px] w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th></th>
                <th>ID</th>
                <th>Name</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {availableEmployees.map((e) => (
                <tr key={e._id} className="border-t">
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedEmployeeIds.includes(e._id)}
                      onChange={(ev) =>
                        setSelectedEmployeeIds((prev) =>
                          ev.target.checked
                            ? [...prev, e._id]
                            : prev.filter((id) => id !== e._id)
                        )
                      }
                    />
                  </td>
                  <td>{e.employeeId}</td>
                  <td>{e.name}</td>
                  <td>{e.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}

        <button
          onClick={assignEmployees}
          disabled={loading}
          className="mt-3 flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded"
        >
          <FaPlus />
          {loading ? "Adding..." : "Add Selected Employees"}
        </button>
      </div>

      {/* ===== ASSIGNED EMPLOYEES ===== */}
      <div className="bg-white rounded shadow p-4">
        <h3 className="text-lg font-semibold mb-3">
          Assigned Employees
        </h3>

        {assignedEmployees.length === 0 ? (
          <p className="text-gray-500">No employees assigned</p>
        ) : (
          <div className="overflow-x-auto">
          <table className="min-w-[520px] w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Role</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {assignedEmployees.map((e) => (
                <tr key={e._id} className="border-t">
                  <td>{e.employeeId}</td>
                  <td>{e.name}</td>
                  <td>{e.role}</td>
                  <td>
                    <button
                      onClick={() => removeEmployee(e._id)}
                      className="text-red-600"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
