import React, { useState, useEffect } from 'react';
import {
  FaHome,
  FaTachometerAlt,
  FaUsers,
  FaClipboardList,
  FaChartLine,
  FaStickyNote,
  FaSignOutAlt,
  FaUserCircle,
  FaBars,
  FaTimes,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ activeSection, setActiveSection }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  // Dynamic email from localStorage
  const [superAdminEmail, setSuperAdminEmail] = useState(
    localStorage.getItem('superAdminEmail') || 'Superadmin@gmail.com'
  );

  // Generate name from email
  const [superAdminName, setSuperAdminName] = useState(() => {
    const email = localStorage.getItem('superAdminEmail') || 'Superadmin@gmail.com';
    const namePart = email.split('@')[0].replace(/\./g, ' ');
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  });

  useEffect(() => {
    const namePart = superAdminEmail.split('@')[0].replace(/\./g, ' ');
    setSuperAdminName(namePart.charAt(0).toUpperCase() + namePart.slice(1));
  }, [superAdminEmail]);

  // Online/offline status
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  // Update email dynamically if changed in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const updatedEmail = localStorage.getItem('superAdminEmail') || 'Superadmin@gmail.com';
      setSuperAdminEmail(updatedEmail);
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <FaTachometerAlt /> },
    { id: 'user-management', label: 'User Management', icon: <FaUsers /> },
    { id: 'subscription', label: 'Subscription', icon: <FaClipboardList /> },
    { id: 'analytics', label: 'Analytics', icon: <FaChartLine /> },
    { id: 'notepad', label: 'Notes', icon: <FaStickyNote /> },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate('/superadmin-login');
  };

  const handleHomeClick = () => {
    navigate('/');
    setActiveSection('');
    if (window.innerWidth < 640) setIsOpen(false);
  };

  return (
    <>
      {/* Global background */}
      <div className="fixed inset-0 -z-10 bg-green-50 dark:bg-gray-900 transition-colors duration-300" />

      {/* Mobile toggle */}
      <button
        aria-label="Toggle Sidebar"
        onClick={() => setIsOpen(!isOpen)}
        className="sm:hidden fixed top-4 left-4 z-50 text-white bg-green-600 dark:bg-gray-800 p-2 rounded-full shadow-lg"
      >
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* Sidebar */}
      <nav
        aria-label="Main sidebar"
        className={`fixed z-40 top-0 left-0 h-full w-72 bg-green-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100 shadow-2xl p-6 border-r border-green-300 dark:border-gray-700 rounded-r-3xl transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="mb-10 flex items-center justify-between">
            <button
              onClick={handleHomeClick}
              aria-label="Go to Home"
              className="text-green-700 dark:text-green-400 hover:text-green-900 dark:hover:text-green-200 transition"
            >
              <FaHome className="text-2xl" />
            </button>
            <h2 className="text-xl font-bold text-green-800 dark:text-green-300 text-right w-full">
              F&B Management
            </h2>
          </div>

          {/* Navigation */}
          <ul className="flex-grow space-y-3">
            {navItems.map(({ id, label, icon }) => (
              <li key={id}>
                <button
                  onClick={() => {
                    setActiveSection(id);
                    if (window.innerWidth < 640) setIsOpen(false);
                  }}
                  aria-current={activeSection === id ? 'page' : undefined}
                  className={`flex items-center gap-4 w-full px-5 py-3 rounded-xl transition-all shadow-sm ${
                    activeSection === id
                      ? 'bg-green-500 text-white border-l-4 border-green-700'
                      : 'bg-white dark:bg-gray-700 hover:bg-green-200 dark:hover:bg-gray-600 text-green-800 dark:text-green-100'
                  }`}
                >
                  <span
                    className={`text-xl ${
                      activeSection === id ? 'text-white' : 'text-green-600 dark:text-green-300'
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
                <p className="font-semibold text-green-800 dark:text-green-300">{superAdminName}</p>
                <p className="text-xs text-green-600 dark:text-green-400">{superAdminEmail}</p>

                {/* Online/Offline Dot */}
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`h-3 w-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'} inline-block`}
                  ></span>
                  <span className={`text-xs font-semibold ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
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
      </nav>
    </>
  );
};

export default Sidebar;




