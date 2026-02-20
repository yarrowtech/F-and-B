import React, { useEffect, useState } from "react";
import {
  FaHome,
  FaTachometerAlt,
  FaClipboardCheck,
  FaBoxes,
  FaUserTie,
  FaUserCircle,
  FaStickyNote,
  FaSignOutAlt,
  FaBars,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import {
  getUser,
  isAuthenticated,
  logout,
} from "../../services/auth.service";

const InventoryManagerSidebar = ({ activeSection, setActiveSection }) => {
  const navigate = useNavigate();

  /* ================= SAFE ONLINE STATE ================= */
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  /* ================= SIDEBAR STATE ================= */
  const [isOpen, setIsOpen] = useState(true);

  /* ================= USER STATE ================= */
  const [user, setUser] = useState(() => getUser());

  /* ================= ROLE PROTECTION ================= */
  useEffect(() => {
    const currentUser = getUser();

    if (
      !isAuthenticated() ||
      !currentUser ||
      currentUser.role !== "inventory_manager" // ✅ updated
    ) {
      logout();
      navigate("/inventory-manager-login", { replace: true });
    } else {
      setUser(currentUser);
    }
  }, [navigate]);

  /* ================= ONLINE / OFFLINE ================= */
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  /* ================= NAV ITEMS ================= */
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <FaTachometerAlt /> },
    { id: "management", label: "Management", icon: <FaUserTie /> },
    { id: "attendance", label: "Attendance", icon: <FaClipboardCheck /> },
    { id: "inventory", label: "Inventory", icon: <FaBoxes /> },
    { id: "profile", label: "Profile", icon: <FaUserCircle /> },
    { id: "notes", label: "Notes", icon: <FaStickyNote /> },
  ];

  /* ================= LOGOUT ================= */
  const handleLogout = () => {
    logout();
    navigate("/inventory-manager-login", { replace: true });
  };

  /* ================= HOME ================= */
  const handleHomeClick = () => {
    navigate("/inventory-manager"); // ✅ correct route
    if (window.innerWidth < 1024) setIsOpen(false);
  };

  if (!user) return null;

  return (
    <>
      {/* ================= MOBILE TOGGLE ================= */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-[1002] p-2 bg-green-600 dark:bg-gray-800 text-white rounded-full shadow-lg"
        >
          <FaBars />
        </button>
      )}

      {/* ================= MOBILE BACKDROP ================= */}
      {isOpen && window.innerWidth < 1024 && (
        <div
          className="fixed inset-0 bg-black/30 z-[1000] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside
        className={`fixed z-[1001] top-0 left-0 h-full w-72 bg-green-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 shadow-2xl p-6 border-r border-green-300 dark:border-gray-700 rounded-r-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">

          {/* ================= HEADER ================= */}
          <div className="mb-6 flex items-center justify-between">
            <button
              onClick={handleHomeClick}
              className="text-green-700 dark:text-green-400 hover:text-green-900 dark:hover:text-green-200 transition text-2xl"
            >
              <FaHome />
            </button>

            <h2 className="text-xl font-bold text-green-800 dark:text-green-300">
              Inventory Manager Panel
            </h2>
          </div>

          {/* ================= NAVIGATION ================= */}
          <ul className="flex-grow space-y-3 overflow-y-auto">
            {navItems.map(({ id, label, icon }) => (
              <li key={id}>
                <button
                  onClick={() => {
                    setActiveSection(id);
                    if (window.innerWidth < 1024) setIsOpen(false);
                  }}
                  className={`flex items-center gap-4 w-full px-5 py-3 rounded-xl transition-all shadow-sm ${
                    activeSection === id
                      ? "bg-green-600 text-white border-l-4 border-green-800"
                      : "bg-white dark:bg-gray-700 hover:bg-green-200 dark:hover:bg-gray-600 text-green-800 dark:text-green-100"
                  }`}
                >
                  <span className="text-lg">{icon}</span>
                  <span className="text-md font-medium">{label}</span>
                </button>
              </li>
            ))}
          </ul>

          {/* ================= FOOTER ================= */}
          <div className="pt-6 border-t border-green-300 dark:border-gray-700 text-sm">
            <div className="flex items-center gap-3 mb-3">
              <FaUserCircle className="text-3xl text-green-700 dark:text-green-400" />

              <div>
                <p className="font-semibold text-green-800 dark:text-green-300">
                  {user.name || "Inventory Manager"}
                </p>

                <p className="text-xs text-green-600 dark:text-green-400">
                  ID: {user.employeeId || user.id?.slice(-6) || "N/A"}
                </p>

                <p className="flex items-center gap-1 text-xs mt-1">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isOnline ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  {isOnline ? "Online" : "Offline"}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 transition"
            >
              <FaSignOutAlt />
              Logout
            </button>
          </div>

        </div>
      </aside>
    </>
  );
};

export default InventoryManagerSidebar;