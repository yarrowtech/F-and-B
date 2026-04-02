import React, { useMemo, useState } from "react";

/* ---------- Seed Data ---------- */
const initialInventoryData = [
  { category: "Meat",        itemName: "Chicken",  totalItem: 10000, itemUses: 3500, requirement: 3000, requestStatus: "Pending"  },
  { category: "Meat",        itemName: "Mutton",   totalItem: 5000,  itemUses: 2000, requirement: 1500, requestStatus: "Approved" },
  { category: "Vegetables",  itemName: "Tomato",   totalItem: 20000, itemUses: 7100, requirement: 5000, requestStatus: "Pending"  },
  { category: "Vegetables",  itemName: "Onion",    totalItem: 5000,  itemUses: 2000, requirement: 3000, requestStatus: "Rejected" },
  { category: "Vegetables",  itemName: "Capsicum", totalItem: 5000,  itemUses: 3000, requirement: 2000, requestStatus: "Approved" },
];

/* ---------- Helpers ---------- */
const useKgFormatter = () =>
  useMemo(() => new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), []);

const toPct = (num) => Math.max(0, Math.min(100, num));

/* ---------- Component ---------- */
const CheifInventory = () => {
  const [inventoryData, setInventoryData] = useState(initialInventoryData);
  const fmt = useKgFormatter();

  const formatKg = (grams) => `${fmt.format(grams / 1000)} kg`;

  const updateStatus = (itemName, newStatus) => {
    setInventoryData((prev) =>
      prev.map((it) => (it.itemName === itemName ? { ...it, requestStatus: newStatus } : it))
    );
  };

  // Only show Pending, Requested, and Approved (hide Rejected)
  const visibleInventory = inventoryData.filter((it) =>
    ["Pending", "Requested", "Approved"].includes(it.requestStatus)
  );

  return (
    <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen overflow-x-hidden">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-gray-800 dark:text-gray-200">
        Cheif Inventory
      </h1>

      {/* Responsive, auto-fit grid; min-w-0 avoids horizontal overflow on cards */}
      <div className="grid gap-4 sm:gap-6 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
        {visibleInventory.map((item) => {
          const inStock = Math.max(0, item.totalItem - item.itemUses);
          const inStockPct = toPct((inStock / (item.totalItem || 1)) * 100);
          const needsRequest = inStock < item.requirement;

          const statusClasses =
            item.requestStatus === "Approved"
              ? "bg-green-200 text-green-800 dark:bg-green-700 dark:text-green-100"
              : item.requestStatus === "Requested"
              ? "bg-yellow-200 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100"
              : "bg-red-200 text-red-800 dark:bg-red-700 dark:text-red-100";

          return (
            <div
              key={item.itemName}
              className="min-w-0 bg-gradient-to-r from-yellow-50 via-white to-yellow-50 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800
                         border-l-4 border-yellow-400 dark:border-yellow-500 rounded-xl shadow-lg p-4 sm:p-6
                         transition-transform duration-300 hover:scale-[1.02]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100 truncate">
                    {item.itemName}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    Category: {item.category}
                  </p>
                </div>
                <span className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-semibold shadow shrink-0 ${statusClasses}`}>
                  {item.requestStatus}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <Row label="Total Items" value={formatKg(item.totalItem)} />
                <Row label="Item Uses" value={formatKg(item.itemUses)} />

                {/* Stock bar */}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">In Stock</span>
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      {formatKg(inStock)} / {formatKg(item.totalItem)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 sm:h-5 mt-2 overflow-hidden">
                    <div
                      className={`h-4 sm:h-5 rounded-full transition-all duration-500 ${
                        needsRequest ? "bg-red-500" : "bg-green-500"
                      }`}
                      style={{ width: `${inStockPct}%` }}
                      role="progressbar"
                      aria-label={`stock level for ${item.itemName}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(inStockPct)}
                    />
                  </div>
                </div>

                <Row label="Requirement" value={formatKg(item.requirement)} />
              </div>

              {/* Actions */}
              <div className="mt-4">
                {needsRequest && item.requestStatus === "Pending" && (
                  <button
                    onClick={() => updateStatus(item.itemName, "Requested")}
                    className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg text-sm sm:text-base"
                    aria-label={`Send request for ${item.itemName}`}
                  >
                    Send Request
                  </button>
                )}

                {item.requestStatus === "Requested" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(item.itemName, "Approved")}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-sm sm:text-base"
                      aria-label={`Approve ${item.itemName}`}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateStatus(item.itemName, "Rejected")}
                      className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm sm:text-base"
                      aria-label={`Reject ${item.itemName}`}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ---------- Tiny UI helper ---------- */
const Row = ({ label, value }) => (
  <div className="flex items-center justify-between">
    <span className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">{label}:</span>
    <span className="font-semibold text-sm sm:text-base">{value}</span>
  </div>
);

export default CheifInventory;
