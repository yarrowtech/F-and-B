import React from "react";
import {
  FaHome,
  FaTachometerAlt,
  FaUsers,
  FaShieldAlt,
  FaStickyNote,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Sidebar = ({ active, setActive }) => {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user")) || {};
  const superAdminName =
    user?.email?.split("@")[0]?.replace(/\./g, " ") || "Super Admin";

  const menuItems = [
    { name: "Dashboard",        icon: FaTachometerAlt, key: "dashboard" },
    { name: "User Management",  icon: FaUsers,         key: "user-management" },
    { name: "Admin Management", icon: FaShieldAlt,     key: "admin-management" },
    { name: "Notes",            icon: FaStickyNote,    key: "notepad" },
  ];

  return (
    <aside className="h-full w-72 bg-green-100 dark:bg-gray-900 shadow-2xl flex flex-col">
      {/* HEADER */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-green-200 dark:border-gray-700">
        <button
          onClick={() => navigate("/")}
          className="p-2 rounded-full bg-green-600 text-white shrink-0"
        >
          <FaHome size={18} />
        </button>
        <div className="overflow-hidden">
          <h2 className="text-base font-bold text-gray-800 dark:text-white truncate capitalize">
            {superAdminName}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Super Admin Panel
          </p>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {menuItems.map(({ name, icon: Icon, key }) => {
          const isActive = active === key;
          return (
            <button
              key={key}
              onClick={() => setActive(key)}
              className={`w-full flex items-center gap-4 px-4 py-3 mb-2 rounded-lg text-sm font-medium border-l-4 transition-all
                ${
                  isActive
                    ? "bg-green-500 text-white border-green-700"
                    : "bg-white dark:bg-gray-800 text-green-700 dark:text-gray-200 border-transparent hover:bg-green-200 dark:hover:bg-gray-700"
                }`}
            >
              {React.createElement(Icon, { className: "text-lg shrink-0" })}
              <span>{name}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
