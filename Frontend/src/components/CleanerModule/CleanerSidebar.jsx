import { useState, useEffect } from "react";
import {
  FaHome,
  FaTachometerAlt,
  FaClipboardCheck,
  FaUserTie,
  FaUserCircle,
  FaStickyNote,
  FaSignOutAlt,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const CleanerSidebar = ({ activeSection, setActiveSection }) => {
  const [isOpen, setIsOpen] = useState(() => window.innerWidth >= 1024);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user")) || {};
  const name = user?.name || localStorage.getItem("CleanerLoginId") || "Cleaner";
  const employeeId = user?.employeeId || user?.id?.slice(-6) || "N/A";
  const initial = name.charAt(0).toUpperCase();

  const navItems = [
    { id: "dashboard",  label: "Dashboard",  icon: <FaTachometerAlt /> },
    { id: "management", label: "Management", icon: <FaUserTie /> },
    { id: "attendance", label: "Attendance", icon: <FaClipboardCheck /> },
    { id: "profile",    label: "Profile",    icon: <FaUserCircle /> },
    { id: "notes",      label: "Notes",      icon: <FaStickyNote /> },
  ];

  useEffect(() => {
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online",  on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/cleaner-login");
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-[1002] p-2 bg-green-600 text-white rounded-full shadow-lg"
        aria-label="Toggle Sidebar"
      >
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-[1000] lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      <aside
        className={`fixed z-[1001] top-0 left-0 h-full w-72 bg-green-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 shadow-2xl flex flex-col border-r border-green-200 dark:border-gray-700 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* HEADER */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-green-200 dark:border-gray-700">
          <button
            onClick={() => { navigate("/"); if (window.innerWidth < 1024) setIsOpen(false); }}
            className="p-2 rounded-full bg-green-600 text-white shrink-0"
          >
            <FaHome size={18} />
          </button>
          <div className="overflow-hidden">
            <h2 className="text-base font-bold text-gray-800 dark:text-white truncate">F&B Management</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Cleaner Panel</p>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 p-4 overflow-y-auto">
          {navItems.map(({ id, label, icon }) => {
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => { setActiveSection(id); if (window.innerWidth < 1024) setIsOpen(false); }}
                className={`w-full flex items-center gap-4 px-4 py-3 mb-2 rounded-lg text-sm font-medium border-l-4 transition-all ${
                  isActive
                    ? "bg-green-500 text-white border-green-700"
                    : "bg-white dark:bg-gray-800 text-green-700 dark:text-gray-200 border-transparent hover:bg-green-200 dark:hover:bg-gray-700"
                }`}
              >
                <span className="text-base">{icon}</span>
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* FOOTER AVATAR */}
        <div className="border-t border-green-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center text-lg font-bold shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">ID: {employeeId}</p>
              <p className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`} />
                {isOnline ? "Online" : "Offline"}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-700 dark:hover:text-red-400 transition"
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default CleanerSidebar;
