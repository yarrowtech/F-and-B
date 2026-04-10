import React, { useState } from "react";
import {
  FaHome,
  FaTachometerAlt,
  FaUsers,
  FaStickyNote,
  FaUserCircle,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Sidebar = ({
  activeSection,
  setActiveSection,
  mobileOpen,
  onMobileClose,
  mobileOnly = false,
  showMobileHeader = true,
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const drawerOpen = mobileOpen ?? isOpen;
  const closeDrawer = () => {
    setIsOpen(false);
    onMobileClose?.();
  };

  const user = JSON.parse(localStorage.getItem("user")) || {};
  const superAdminName =
    user?.email?.split("@")[0]?.replace(/\./g, " ") || "Super Admin";

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: FaTachometerAlt },
    { id: "user-management", label: "User Management", icon: FaUsers },
    { id: "admin-management", label: "Admin Management", icon: FaUserCircle },
    { id: "notepad", label: "Notes", icon: FaStickyNote },
  ];

  return (
    <>
      {showMobileHeader && (
      <div className="lg:hidden bg-green-100 dark:bg-gray-800 text-green-800 dark:text-gray-200 flex items-center justify-between px-4 py-3 shadow-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              navigate("/");
              closeDrawer();
            }}
            className="p-2 rounded-full bg-green-600 text-white"
          >
            <FaHome size={20} />
          </button>
          <h2 className="text-lg font-bold">Super Admin</h2>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-full bg-green-500 text-white"
        >
          {drawerOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      </div>
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-72 max-w-[85vw] bg-green-100 dark:bg-gray-900 shadow-2xl flex flex-col z-50 transition-transform duration-300 ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        } ${mobileOnly ? "lg:hidden" : "lg:translate-x-0"}`}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b dark:border-gray-700">
          <button
            onClick={() => {
              navigate("/");
              closeDrawer();
            }}
            className="p-2 rounded-full bg-green-600 text-white shrink-0"
          >
            <FaHome size={18} />
          </button>
          <div className="overflow-hidden">
            <h2 className="text-base font-bold dark:text-white truncate capitalize">
              {superAdminName}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Super Admin Panel
            </p>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = activeSection === id;

            return (
              <button
                key={id}
                onClick={() => {
                  setActiveSection(id);
                  if (window.innerWidth < 1024) closeDrawer();
                }}
                className={`w-full flex items-center gap-4 px-4 py-3 mb-2 rounded-lg text-sm font-medium border-l-4 transition-all ${
                  isActive
                    ? "bg-green-500 text-white border-green-700"
                    : "bg-white dark:bg-gray-800 text-green-700 dark:text-gray-200 border-transparent hover:bg-green-200 dark:hover:bg-gray-700"
                }`}
              >
                <Icon className="text-lg" />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {drawerOpen && (
        <div
          onClick={closeDrawer}
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
        />
      )}
    </>
  );
};

export default Sidebar;
