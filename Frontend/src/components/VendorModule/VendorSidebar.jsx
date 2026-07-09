import { useEffect, useState } from "react";
import {
  FaHome,
  FaTachometerAlt,
  FaBoxes,
  FaUsers,
  FaUserCircle,
  FaChartLine,
  FaStickyNote,
  FaGlobe,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";

const getVendorId = () => {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    return user?.id || user?._id || "";
  } catch {
    return "";
  }
};

const VendorSidebar = ({ activeSection, setActiveSection }) => {
  const [isOpen, setIsOpen] = useState(() => window.innerWidth >= 1024);
  const [requestCount, setRequestCount] = useState(0);
  const navigate = useNavigate();
  const vendorId = getVendorId();

  const navItems = [
    { id: "dashboard",        label: "Dashboard",  icon: <FaTachometerAlt /> },
    { id: "my-products",      label: "My Products",icon: <FaBoxes /> },
    { id: "inventory",        label: "Inventory",  icon: <FaBoxes /> },
    { id: "vendor-management",label: "Management", icon: <FaUsers /> },
    { id: "account",          label: "Account",    icon: <FaUserCircle /> },
    { id: "analytics",        label: "Analytics",  icon: <FaChartLine /> },
    { id: "upgrade-request",  label: "Upgrade",    icon: <FaGlobe /> },
    { id: "notes",            label: "Notes",      icon: <FaStickyNote /> },
  ];

  useEffect(() => {
    if (!vendorId) return;

    let ignore = false;

    const loadRequestCount = async () => {
      try {
        const res = await API.get(`/vendor/${vendorId}/orders`);
        const orders = Array.isArray(res.data?.orders) ? res.data.orders : [];
        const count = orders.filter((order) => order.status === "processing").length;
        if (!ignore) setRequestCount(count);
      } catch {
        if (!ignore) setRequestCount(0);
      }
    };

    loadRequestCount();
    const intervalId = window.setInterval(loadRequestCount, 30000);

    return () => {
      ignore = true;
      window.clearInterval(intervalId);
    };
  }, [vendorId, activeSection]);

  return (
    <>
      <button
        aria-label="Toggle Sidebar"
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-[1002] p-2 bg-green-600 text-white rounded-full shadow-lg"
      >
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-[1000] lg:hidden" onClick={() => setIsOpen(false)} />
      )}

      <aside
        aria-label="Vendor sidebar"
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
            <p className="text-xs text-gray-500 dark:text-gray-400">Vendor Panel</p>
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
                className={`w-full flex items-center justify-between gap-4 px-4 py-3 mb-2 rounded-lg text-sm font-medium border-l-4 transition-all ${
                  isActive
                    ? "bg-green-500 text-white border-green-700"
                    : "bg-white dark:bg-gray-800 text-green-700 dark:text-gray-200 border-transparent hover:bg-green-200 dark:hover:bg-gray-700"
                }`}
              >
                <span className="flex items-center gap-4">
                  <span className="text-base">{icon}</span>
                  <span>{label}</span>
                </span>
                {id === "vendor-management" && requestCount > 0 && (
                  <span
                    className={`min-w-6 rounded-full px-2 py-0.5 text-center text-xs font-bold ${
                      isActive
                        ? "bg-red-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {requestCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default VendorSidebar;
