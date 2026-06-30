import React, { useState } from "react";
import {
  FaHome,
  FaTachometerAlt,
  FaUsers,
  FaUtensils,
  FaBox,
  FaHandshake,
  FaClipboardList,
  FaUserCircle,
  FaChartBar,
  FaStickyNote,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Sidebar = ({
  active,
  setActive,
  mobileOpen,
  onMobileClose,
  showMobileTopBar = true,
  inventoryPendingCount = 0,
}) => {
  const navigate = useNavigate();

  /* ================= STATE ================= */
  const [internalOpen, setInternalOpen] = useState(false);
  const isMobileControlled = typeof mobileOpen === "boolean";
  const isOpen = isMobileControlled ? mobileOpen : internalOpen;

  const toggleOpen = () => {
    if (isMobileControlled) {
      if (isOpen) {
        onMobileClose?.();
      }
      return;
    }
    setInternalOpen((prev) => !prev);
  };

  const closeMobile = () => {
    if (isMobileControlled) {
      onMobileClose?.();
      return;
    }
    setInternalOpen(false);
  };

  /* ================= GET ADMIN ================= */
  const user = JSON.parse(localStorage.getItem("user")) || {};
  const businessName = user?.businessName || "Admin";

  /* ================= MENU ITEMS ================= */
  const menuItems = [
    { name: "Dashboard",           icon: FaTachometerAlt, key: "dashboard" },
    { name: "Staff Management",    icon: FaUsers,         key: "staff" },
    { name: "Restaurant Management",icon: FaUtensils,     key: "restaurant" },
    { name: "Inventory",           icon: FaBox,           key: "inventory" },
    { name: "Menu Management",     icon: FaClipboardList, key: "menu" },
    { name: "Table Management",    icon: FaUtensils,      key: "table" },
    { name: "Account",             icon: FaUserCircle,    key: "account" },
    { name: "Analytical",          icon: FaChartBar,      key: "analytical" },
    { name: "Reports",             icon: FaChartBar,      key: "reports" },
    { name: "Notes",               icon: FaStickyNote,    key: "notes" },
  ];

  return (
    <>
      {/* MOBILE TOP BAR */}
      {showMobileTopBar && (
        <div className="lg:hidden bg-green-100 dark:bg-gray-800 text-green-800 dark:text-gray-200 flex items-center justify-between px-4 py-3 shadow-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                navigate("/");
                closeMobile();
              }}
              className="p-2 rounded-full bg-green-600 text-white"
            >
              <FaHome size={20} />
            </button>
            <h2 className="text-lg font-bold">Admin Panel</h2>
          </div>
          <button
            onClick={toggleOpen}
            className="p-2 rounded-full bg-green-500 text-white"
          >
            {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
        </div>
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-green-100 dark:bg-gray-900 shadow-2xl flex flex-col z-50 transition-transform duration-300 ${
          isMobileControlled ? "lg:hidden" : ""
        }
        ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* HEADER — shows business name dynamically */}
        <div className="hidden lg:flex items-center gap-3 px-5 py-4 border-b dark:border-gray-700">
          <button
            onClick={() => navigate("/")}
            className="p-2 rounded-full bg-green-600 text-white shrink-0"
          >
            <FaHome size={18} />
          </button>
          <div className="overflow-hidden">
            <h2 className="text-base font-bold dark:text-white truncate">
              {businessName}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Admin Panel
            </p>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {menuItems.map(({ name, icon: Icon, key }) => {
            const isActive = active === key;
            const badgeCount = key === "inventory" ? inventoryPendingCount : 0;
            const icon = React.createElement(Icon, { className: "text-lg" });
            return (
              <button
                key={key}
                onClick={() => {
                  setActive(key);
                  if (window.innerWidth < 1024) closeMobile();
                }}
                className={`w-full flex items-center gap-4 px-4 py-3 mb-2 rounded-lg text-sm font-medium border-l-4 transition-all
                  ${isActive
                    ? "bg-green-500 text-white border-green-700"
                    : "bg-white dark:bg-gray-800 text-green-700 dark:text-gray-200 border-transparent hover:bg-green-200 dark:hover:bg-gray-700"
                  }`}
              >
                {icon}
                <span className="min-w-0 flex-1 text-left">{name}</span>
                {badgeCount > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 text-[11px] font-bold leading-none text-white shadow">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* MOBILE OVERLAY */}
      {isOpen && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        />
      )}
    </>
  );
};

export default Sidebar;
