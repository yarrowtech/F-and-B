import React, { useEffect, useState } from "react";
import API from "../../services/api";

const CATEGORY_ORDER = [
  "MANAGER",
  "INVENTORY_MANAGER",
  "CHEF",
  "SUCHEF",
  "WAITER",
  "CLEANER",
  "ACCOUNTANT",
];

const formatCategory = (value) =>
  value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatAddress = (address) => {
  if (typeof address === "string") return address || "N/A";
  const parts = [
    address?.line1,
    address?.line2,
    address?.landmark,
    address?.city,
    address?.state,
    address?.pincode,
    address?.country,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "N/A";
};

const DetailModal = ({ admin, onClose }) => {
  if (!admin) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-4 sm:p-6 shadow-2xl dark:bg-neutral-800"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4 dark:border-neutral-700">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {admin.businessName}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Admin ID: {admin.adminId || "N/A"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-neutral-700 dark:text-gray-200 dark:hover:bg-neutral-600"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-gray-100 p-4 dark:border-neutral-700">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Admin Details
            </h3>
            <div className="mt-4 space-y-3 text-sm">
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Name:</span> {admin.businessName}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Email:</span> {admin.email}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Mobile:</span> {admin.mobile}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Address:</span> {formatAddress(admin.address)}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">PAN Number:</span> {admin.panNumber || "N/A"}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Status:</span>{" "}
                {admin.isActive ? "Active" : "Inactive"}
              </p>
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Created:</span>{" "}
                {admin.createdAt
                  ? new Date(admin.createdAt).toLocaleDateString("en-IN")
                  : "N/A"}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-900/20">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Restaurants
              </p>
              <p className="mt-2 text-2xl font-bold text-blue-700 dark:text-blue-400">
                {admin.totalRestaurants || 0}
              </p>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-900/20">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Staff
              </p>
              <p className="mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                {admin.totalStaff || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-xl border border-gray-100 p-4 dark:border-neutral-700">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Staff Categories
            </h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {CATEGORY_ORDER.map((category) => (
                <div
                  key={category}
                  className="rounded-lg bg-gray-50 p-3 dark:bg-neutral-700/50"
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatCategory(category)}
                  </p>
                  <p className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                    {admin.staffByCategory?.[category] || 0}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 p-4 dark:border-neutral-700">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Restaurants
            </h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {admin.restaurantNames?.length ? (
                admin.restaurantNames.map((name) => (
                  <span
                    key={name}
                    className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  >
                    {name}
                  </span>
                ))
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  No restaurants assigned.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminManagement = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        setLoading(true);
        const res = await API.get("/super_admin/admin-management");
        setAdmins(res.data?.data || []);
      } catch (error) {
        console.error("Failed to load admin management data", error);
        setAdmins([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmins();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-500 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-gray-400">
        Loading admin management...
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">
          Admin Management
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Admin list with details popup
        </p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-800">
        {admins.length === 0 ? (
          <div className="p-6 text-sm text-gray-500 dark:text-gray-400">
            No admins found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[560px] w-full">
              <thead className="bg-gray-50 dark:bg-neutral-900/60">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-300">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500 dark:text-gray-300">
                    Name
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-500 dark:text-gray-300">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {admins.map((admin) => (
                  <tr
                    key={admin.id}
                    className="border-t border-gray-100 dark:border-neutral-700"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-800 dark:text-white">
                      {admin.adminId || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-200">
                      {admin.businessName}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedAdmin(admin)}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                      >
                        Action
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DetailModal admin={selectedAdmin} onClose={() => setSelectedAdmin(null)} />
    </div>
  );
};

export default AdminManagement;
