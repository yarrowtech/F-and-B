import React, { useEffect, useState } from "react";
import {
  getMenu,
  getMenuOrdersByDate,
  getMenuAnalytics,
} from "../../services/menu.service";

const ManagerMenuManagement = () => {

  const user = JSON.parse(localStorage.getItem("user"));
  const restaurantId = user?.restaurant;

  const [menus, setMenus] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [date, setDate] = useState("");
  const [loading, setLoading] = useState(true);

  /* ================= FETCH MENU ================= */

  useEffect(() => {
    if (restaurantId) {
      fetchMenu();
      fetchRangeAnalytics("today"); // auto load today analytics
    }
  }, [restaurantId]);

  const fetchMenu = async () => {
    try {

      setLoading(true);

      const data = await getMenu(restaurantId);

      setMenus(data);

    } catch (err) {
      console.error("Menu fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= DATE ANALYTICS ================= */

  const fetchOrders = async () => {

    if (!date) {
      alert("Please select a date");
      return;
    }

    try {

      const data = await getMenuOrdersByDate(restaurantId, date);

      setAnalytics(data);

    } catch (err) {
      console.error("Analytics error:", err);
    }
  };

  /* ================= RANGE ANALYTICS ================= */

  const fetchRangeAnalytics = async (range) => {

    try {

      const data = await getMenuAnalytics(restaurantId, range);

      setAnalytics(data);

    } catch (err) {
      console.error("Range analytics error:", err);
    }
  };

  return (
    <div className="p-4 sm:p-6 overflow-x-hidden">

      {/* ================= PAGE HEADER ================= */}

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Menu Management</h1>
        <p className="text-gray-500">
          View restaurant menu and order analytics
        </p>
      </div>

      {/* ================= MENU LIST ================= */}

      <div className="bg-white rounded-xl shadow mb-8">

        <div className="p-4 border-b font-semibold text-lg">
          Restaurant Menu
        </div>

        <div className="overflow-x-auto">
        <table className="min-w-[640px] w-full">

          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Cuisine</th>
              <th className="p-3 text-left">Course</th>
              <th className="p-3 text-left">Price</th>
              <th className="p-3 text-left">Available</th>
            </tr>
          </thead>

          <tbody>

            {loading ? (

              <tr>
                <td colSpan="5" className="p-6 text-center">
                  Loading menu...
                </td>
              </tr>

            ) : menus.length > 0 ? (

              menus.map((item) => (
                <tr key={item._id} className="border-t hover:bg-gray-50">

                  <td className="p-3 font-medium">{item.name}</td>

                  <td className="p-3">{item.cuisine}</td>

                  <td className="p-3">
                    {item.courseType
                      .replace("_", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </td>

                  <td className="p-3">₹{item.price}</td>

                  <td className="p-3">
                    {item.isAvailable ? "Yes" : "No"}
                  </td>

                </tr>
              ))

            ) : (

              <tr>
                <td colSpan="5" className="p-6 text-center text-gray-500">
                  No menu items found
                </td>
              </tr>

            )}

          </tbody>

        </table>
        </div>

      </div>

      {/* ================= ANALYTICS ================= */}

      <div className="bg-white rounded-xl shadow">

        <div className="p-4 border-b font-semibold text-lg">
          Menu Orders Analytics
        </div>

        {/* QUICK FILTER BUTTONS */}

        <div className="p-4 flex gap-3 flex-wrap">

          <button
            onClick={() => fetchRangeAnalytics("today")}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Today
          </button>

          <button
            onClick={() => fetchRangeAnalytics("yesterday")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Yesterday
          </button>

          <button
            onClick={() => fetchRangeAnalytics("week")}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          >
            Last 7 Days
          </button>

        </div>

        {/* DATE PICKER */}

        <div className="px-4 pb-4 flex gap-4 flex-wrap">

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full sm:w-auto border rounded px-3 py-2"
          />

          <button
            onClick={fetchOrders}
            className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
          >
            Check Date
          </button>

        </div>

        {/* ANALYTICS TABLE */}

        <div className="overflow-x-auto">
        <table className="min-w-[560px] w-full">

          <thead className="bg-gray-100">

            <tr>
              <th className="p-3 text-left">Menu Item</th>
              <th className="p-3 text-left">Cuisine</th>
              <th className="p-3 text-left">Course</th>
              <th className="p-3 text-left">Orders</th>
            </tr>

          </thead>

          <tbody>

            {analytics.length > 0 ? (

              analytics.map((item, index) => (

                <tr key={index} className="border-t">

                  <td className="p-3">{item.name}</td>

                  <td className="p-3">{item.cuisine}</td>

                  <td className="p-3">
                    {item.courseType
                      .replace("_", " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </td>

                  <td className="p-3 font-bold">{item.totalOrders}</td>

                </tr>

              ))

            ) : (

              <tr>
                <td colSpan="4" className="p-6 text-center text-gray-500">
                  No analytics data found for selected filter
                </td>
              </tr>

            )}

          </tbody>

        </table>
        </div>

      </div>

    </div>
  );
};

export default ManagerMenuManagement;
