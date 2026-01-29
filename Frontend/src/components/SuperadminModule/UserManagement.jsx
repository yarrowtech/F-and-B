import React, { useState } from "react";
import { motion } from "framer-motion";

const dummyUsers = [
  { id: 1, name: "Rahul Sharma", email: "rahul@admin.com", role: "Admin", active: true },
  { id: 2, name: "Priya Mehta", email: "priya@admin.com", role: "Admin", active: true },
  { id: 3, name: "Karan Patel", email: "karan@admin.com", role: "Admin", active: false },
  { id: 4, name: "Meera Bansal", email: "meera@admin.com", role: "Admin", active: true },
  { id: 5, name: "Ritika Singh", email: "vendor1@fnb.com", role: "Vendor", active: true },
  { id: 6, name: "Amit Rao", email: "vendor2@fnb.com", role: "Vendor", active: false },
  { id: 7, name: "Neha Gupta", email: "vendor3@fnb.com", role: "Vendor", active: true },
  { id: 8, name: "Sahil Kumar", email: "vendor4@fnb.com", role: "Vendor", active: true },
  { id: 9, name: "Isha Verma", email: "vendor5@fnb.com", role: "Vendor", active: true },
  { id: 10, name: "Arjun Das", email: "vendor6@fnb.com", role: "Vendor", active: false },
];

const UserManagement = () => {
  const [tab, setTab] = useState("users");
  const [filter, setFilter] = useState("All");
  const [users, setUsers] = useState(dummyUsers);
  const [history, setHistory] = useState([]);

  const adminCount = users.filter((u) => u.role === "Admin").length;
  const vendorCount = users.filter((u) => u.role === "Vendor").length;

  const filteredUsers = users.filter((u) =>
    filter === "All" ? true : u.role === filter
  );

  const addHistory = (user, action) => {
    setHistory((prev) => [
      { id: Date.now(), name: user.name, action, time: new Date().toLocaleString() },
      ...prev,
    ]);
  };

  const toggleActive = (id) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, active: !u.active } : u))
    );
    const user = users.find((u) => u.id === id);
    addHistory(user, user.active ? "Deactivated" : "Activated");
  };

  const deleteUser = (id) => {
    const user = users.find((u) => u.id === id);
    setUsers((prev) => prev.filter((u) => u.id !== id));
    addHistory(user, "Deleted");
  };

  return (
    <div className="p-4 sm:p-6 md:p-10 bg-gray-100 dark:bg-zinc-900 min-h-screen space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
        User Management
      </h1>

      {/* Tabs */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => setTab("users")}
          className={`px-4 py-2 rounded-lg transition ${
            tab === "users"
              ? "bg-green-600 text-white"
              : "bg-white dark:bg-zinc-800 border border-gray-300 text-gray-700 dark:text-white"
          }`}
        >
          Users
        </button>
        <button
          onClick={() => setTab("history")}
          className={`px-4 py-2 rounded-lg transition ${
            tab === "history"
              ? "bg-green-600 text-white"
              : "bg-white dark:bg-zinc-800 border border-gray-300 text-gray-700 dark:text-white"
          }`}
        >
          History
        </button>
      </div>

      {tab === "users" && (
        <>
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            {[
              { label: "All", value: "All", count: users.length },
              { label: "Admin", value: "Admin", count: adminCount },
              { label: "Vendor", value: "Vendor", count: vendorCount },
            ].map(({ label, value, count }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition whitespace-nowrap ${
                  filter === value
                    ? "bg-green-600 text-white"
                    : "bg-white dark:bg-zinc-800 border border-gray-300 text-gray-700 dark:text-white"
                }`}
              >
                {label}
                <span className="bg-gray-200 dark:bg-zinc-700 text-xs rounded-full px-2 py-0.5">
                  {count}
                </span>
              </button>
            ))}
          </div>

          {/* User Table */}
          <div className="overflow-x-auto bg-white dark:bg-zinc-800 rounded-xl shadow">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700 text-sm table-auto">
              <thead className="bg-gray-50 dark:bg-zinc-700 text-left text-gray-700 dark:text-white">
                <tr>
                  <th className="px-6 py-3 font-semibold">Name</th>
                  <th className="px-6 py-3 font-semibold">Email</th>
                  <th className="px-6 py-3 font-semibold">Role</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-6 text-center text-gray-500 dark:text-zinc-400">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="hover:bg-gray-50 dark:hover:bg-zinc-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.role}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.active
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {user.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => toggleActive(user.id)}
                          className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded transition"
                        >
                          {user.active ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => deleteUser(user.id)}
                          className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded transition"
                        >
                          Delete
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "history" && (
        <div className="overflow-x-auto bg-white dark:bg-zinc-800 rounded-xl shadow">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700 text-sm table-auto">
            <thead className="bg-gray-50 dark:bg-zinc-700 text-left text-gray-700 dark:text-white">
              <tr>
                <th className="px-6 py-3 font-semibold">User</th>
                <th className="px-6 py-3 font-semibold">Action</th>
                <th className="px-6 py-3 font-semibold">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-700">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-6 text-center text-gray-500 dark:text-zinc-400">
                    No actions recorded yet.
                  </td>
                </tr>
              ) : (
                history.map((h) => (
                  <motion.tr
                    key={h.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">{h.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{h.action}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{h.time}</td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
