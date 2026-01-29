import React, { useState } from "react";

const ManagerVendorManagement = () => {
  const [products] = useState([
    { id: 1, name: "Tea Powder", stock: 120 },
    { id: 2, name: "Coffee Beans", stock: 80 },
    { id: 3, name: "Milk Packets", stock: 40 },
  ]);

  const [orders] = useState([
    {
      id: "ORD101",
      product: "Tea Powder",
      quantity: 10,
      pricePerUnit: 20,
      status: "Processing",
      customer: "Rahul Sharma",
      date: "2025-08-02",
      deliveryType: "Express",
    },
    {
      id: "ORD102",
      product: "Coffee Beans",
      quantity: 5,
      pricePerUnit: 100,
      status: "Shipped",
      customer: "Aditi Verma",
      date: "2025-08-01",
      deliveryType: "Standard",
    },
    {
      id: "ORD103",
      product: "Milk Packets",
      quantity: 20,
      pricePerUnit: 25,
      status: "Delivered",
      customer: "Manoj Gupta",
      date: "2025-07-30",
      deliveryType: "Standard",
    },
  ]);

  const statusColors = {
    Processing: "bg-yellow-400",
    Shipped: "bg-blue-400",
    Delivered: "bg-green-500",
  };

  return (
    <div className="p-6 space-y-12 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
      {/* ✅ Header */}
      <h1 className="text-3xl font-bold text-black-600 dark:text-green-400">
        Vendor management
      </h1>

      {/* ✅ Product List */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">📦 Product Inventory</h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {products.map((p) => (
            <li
              key={p.id}
              className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow"
            >
              <div className="font-semibold text-lg">{p.name}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Stock: {p.stock}</div>
              <div
                className={`mt-2 inline-block px-3 py-1 text-xs font-bold rounded-full ${
                  p.stock < 30 ? "bg-red-500 text-white" : "bg-green-100 text-green-800"
                }`}
              >
                {p.stock < 30 ? "Low Stock" : "In Stock"}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ✅ Order Tracker with Details */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">🚚 Track Orders</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow border border-gray-200 dark:border-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100">
              <tr>
                <th className="py-3 px-4 text-left">Order ID</th>
                <th className="py-3 px-4 text-left">Customer</th>
                <th className="py-3 px-4 text-left">Date</th>
                <th className="py-3 px-4 text-left">Product</th>
                <th className="py-3 px-4 text-left">Qty</th>
                <th className="py-3 px-4 text-left">Total (₹)</th>
                <th className="py-3 px-4 text-left">Delivery</th>
                <th className="py-3 px-4 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-t border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="py-3 px-4">{order.id}</td>
                  <td className="py-3 px-4">{order.customer}</td>
                  <td className="py-3 px-4">{order.date}</td>
                  <td className="py-3 px-4">{order.product}</td>
                  <td className="py-3 px-4">{order.quantity}</td>
                  <td className="py-3 px-4">
                    {order.quantity * order.pricePerUnit}
                  </td>
                  <td className="py-3 px-4">{order.deliveryType}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-3 py-1 text-sm rounded-full font-semibold text-white ${statusColors[order.status]}`}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ManagerVendorManagement;
