import { useState } from "react";
import {
  FaHome,
  FaTachometerAlt,
  FaUsers,
  FaBoxes,
  FaUtensils,
  FaUserCircle,
  FaWallet,
  FaStickyNote,
  FaBars,
  FaTimes,
  FaClipboardCheck,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const ManagerSidebar = ({ active, setActive }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user")) || {};
  const businessName = user?.name || "Manager";

  const menuItems = [
    { name: "Dashboard",        icon: FaTachometerAlt, key: "dashboard" },
    { name: "Attendance",       icon: FaClipboardCheck,key: "attendance" },
    { name: "Staff Management", icon: FaUsers,         key: "staff-management" },
    { name: "Inventory",        icon: FaBoxes,         key: "inventory" },
    { name: "Menu Management",  icon: FaUtensils,      key: "menu-management" },
    { name: "Account",          icon: FaWallet,        key: "account" },
    { name: "Profile",          icon: FaUserCircle,    key: "profile" },
    { name: "Notes",            icon: FaStickyNote,    key: "notes" },
  ];

  return (
    <>
      {/* MOBILE TOP BAR */}
      <div className="lg:hidden bg-green-100 dark:bg-gray-800 text-green-800 dark:text-gray-200 flex items-center justify-between px-4 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => { navigate("/manager"); setIsOpen(false); }}
            className="p-2 rounded-full bg-green-600 text-white"
          >
            <FaHome size={20} />
          </button>
          <h2 className="text-lg font-bold">Manager Panel</h2>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-full bg-green-500 text-white"
        >
          {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      </div>

      {/* SIDEBAR */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-green-100 dark:bg-gray-900 shadow-2xl flex flex-col z-50 transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* HEADER */}
        <div className="hidden lg:flex items-center gap-3 px-5 py-4 border-b border-green-200 dark:border-gray-700">
          <button
            onClick={() => navigate("/manager")}
            className="p-2 rounded-full bg-green-600 text-white shrink-0"
          >
            <FaHome size={18} />
          </button>
          <div className="overflow-hidden">
            <h2 className="text-base font-bold dark:text-white truncate">{businessName}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Manager Panel</p>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {menuItems.map(({ name, icon: Icon, key }) => {
            const isActive = active === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setActive(key);
                  if (window.innerWidth < 1024) setIsOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-3 mb-2 rounded-lg text-sm font-medium border-l-4 transition-all
                  ${isActive
                    ? "bg-green-500 text-white border-green-700"
                    : "bg-white dark:bg-gray-800 text-green-700 dark:text-gray-200 border-transparent hover:bg-green-200 dark:hover:bg-gray-700"
                  }`}
              >
                <Icon className="text-lg" />
                <span>{name}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* MOBILE OVERLAY */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        />
      )}
    </>
  );
};

export default ManagerSidebar;
