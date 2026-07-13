import React from "react";
import { FaHome } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { VENDOR_NAV_ITEMS } from "./vendorNavItems";

const getVendorName = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return user?.name || "Vendor";
  } catch {
    return "Vendor";
  }
};

const VendorSidebar = ({ activeSection, setActiveSection, requestCount = 0 }) => {
  const navigate = useNavigate();
  const vendorName = getVendorName();

  return (
    <aside
      aria-label="Vendor sidebar"
      className="fixed top-0 left-0 z-50 hidden h-full w-72 flex-col bg-green-100 shadow-2xl dark:bg-gray-900 2xl:flex"
    >
      <div className="flex items-center gap-3 border-b border-green-200 px-5 py-4 dark:border-gray-700">
        <button
          onClick={() => navigate("/")}
          className="shrink-0 rounded-full bg-green-600 p-2 text-white"
        >
          <FaHome size={18} />
        </button>
        <div className="overflow-hidden">
          <h2 className="truncate text-base font-bold text-gray-800 dark:text-white">
            {vendorName}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Vendor Panel</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        {VENDOR_NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activeSection === id;
          const iconNode = React.createElement(Icon, { className: "text-lg" });
          return (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={`mb-2 flex w-full items-center gap-4 rounded-lg border-l-4 px-4 py-3 text-sm font-medium transition-all ${
                isActive
                  ? "border-green-700 bg-green-500 text-white"
                  : "border-transparent bg-white text-green-700 hover:bg-green-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {iconNode}
              <span className="min-w-0 flex-1 text-left">{label}</span>
              {id === "vendor-management" && requestCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-bold leading-none text-white shadow">
                  {requestCount > 99 ? "99+" : requestCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default VendorSidebar;
