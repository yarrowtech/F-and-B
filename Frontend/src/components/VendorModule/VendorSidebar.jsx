import React, { useState, useEffect } from 'react';
import {
  FaHome,
  FaTachometerAlt,
  FaBoxes,
  FaUsers,
  FaUserCircle,
  FaChartLine,
  FaStickyNote,
  FaSignOutAlt,
  FaBars,
  FaTimes,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const VendorSidebar = ({ activeSection, setActiveSection }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  const [vendorEmail, setVendorEmail] = useState(
    localStorage.getItem('vendorEmail') || 'vendor@gmail.com'
  );
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Generate name from email
  const generateName = (email) => {
    const namePart = email.split('@')[0].replace(/\./g, ' ');
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  };
  const vendorName = generateName(vendorEmail);

  // Detect online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update email automatically if it changes in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      setVendorEmail(localStorage.getItem('vendorEmail') || 'vendor@gmail.com');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FaTachometerAlt /> },
    { id: 'inventory', label: 'Inventory', icon: <FaBoxes /> },
    { id: 'vendor-management', label: 'Management', icon: <FaUsers /> },
    { id: 'account', label: 'Account', icon: <FaUserCircle /> },
    { id: 'analytics', label: 'Analytics', icon: <FaChartLine /> },
    { id: 'notes', label: 'Notes', icon: <FaStickyNote /> },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/vendor-login");
  };

  const handleHomeClick = () => {
    navigate("/");
    setActiveSection("");
    if (window.innerWidth < 1024) setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        aria-label="Toggle Sidebar"
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-[1002] text-white bg-green-600 dark:bg-gray-800 p-2 rounded-full shadow-lg"
      >
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Overlay when open on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-[1000] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <aside
        aria-label="Vendor sidebar"
        className={`fixed z-[1001] top-0 left-0 h-full w-72 bg-green-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 shadow-2xl p-6 border-r border-green-300 dark:border-gray-700 rounded-r-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Desktop Header */}
          <div className="mb-10 flex items-center justify-between">
            <button
              onClick={handleHomeClick}
              aria-label="Go to Home"
              className="text-green-700 dark:text-green-400 hover:text-green-900 dark:hover:text-green-200 transition"
            >
              <FaHome className="text-2xl" />
            </button>
            <h2 className="text-xl font-bold text-green-800 dark:text-green-300 w-full text-center">
              F & B Management
            </h2>
          </div>

          {/* Navigation Items */}
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
                      ? 'bg-green-500 text-white border-l-4 border-green-700'
                      : 'bg-white dark:bg-gray-700 hover:bg-green-200 dark:hover:bg-gray-600 text-green-800 dark:text-green-100'
                  }`}
                >
                  <span
                    className={`text-xl ${
                      activeSection === id
                        ? 'text-white'
                        : 'text-green-600 dark:text-green-300'
                    }`}
                  >
                    {icon}
                  </span>
                  <span className="text-md font-medium">{label}</span>
                </button>
              </li>
            ))}
          </ul>

          {/* Footer */}
          <div className="pt-6 border-t border-green-300 dark:border-gray-700 text-sm">
            <div className="flex items-center gap-3 mb-3">
              <FaUserCircle className="text-2xl text-green-700 dark:text-green-400" />
              <div>
                <p className="font-semibold text-green-800 dark:text-green-300 flex items-center gap-2">
                  {vendorName}
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isOnline ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  ></span>
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">{vendorEmail}</p>
                <p
                  className={`text-xs font-medium ${
                    isOnline ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100"
            >
              <FaSignOutAlt className="text-lg" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default VendorSidebar;
