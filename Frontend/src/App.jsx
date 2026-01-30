import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Public Pages
import Home from "./Pages/Home";
import About from "./Pages/About";
import Services from "./Pages/Services";
import Contact from "./Pages/Contact";
import Subscription from "./Pages/Subscription";
import Department from "./Pages/Department";
import KitchenPage from "./Pages/Kitchen";
import FloorPage from "./Pages/Floor";

// Login Pages
import SuperAdminLogin from "./components/Login/SuperAdminLogin";
import AdminLogin from "./components/Login/AdminLogin";
import VendorLogin from "./components/Login/VendorLogin";
import ManagerLogin from "./components/Login/ManagerLogin";
import CheifLogin from "./components/Login/CheifLogin";
import SucheifLogin from "./components/Login/SuCheifLogin";
import InventoryManagerLogin from "./components/Login/InventoryManagerLogin";
import WaiterLogin from "./components/Login/WaiterLogin";
import CleanerLogin from "./components/Login/CleanerLogin";
import AccountantLogin from "./components/Login/AccountantLogin";

// Dashboards
import Superadmin from "./components/SuperAdminModule/Superadmin";
import Admin from "./components/AdminModule/Admin";
import Vendor from "./components/VendorModule/Vendor";
import Manager from "./components/ManagerModule/Manager";
import Cheif from "./components/CheifModule/Cheif";
import SuCheif from "./components/SuCheifModule/SuCheif";
import InventoryManager from "./components/InventoryManagerModule/InventoryManager";
import Accountant from "./components/AccountantModule/Accountant";
import Waiter from "./components/WaiterModule/Waiter";
import Cleaner from "./components/CleanerModule/Cleaner";

const App = () => {
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const isDark = savedTheme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const loginRoutes = [
    { path: "/superadmin-login", element: <SuperAdminLogin /> },
    { path: "/admin-login", element: <AdminLogin /> },
    { path: "/vendor-login", element: <VendorLogin /> },
    { path: "/manager-login", element: <ManagerLogin /> },
    { path: "/cheif-login", element: <CheifLogin /> },
    { path: "/su-cheif-login", element: <SucheifLogin /> },
    { path: "/inventory-manager-login", element: <InventoryManagerLogin /> },
    { path: "/waiter-login", element: <WaiterLogin /> },
    { path: "/cleaner-login", element: <CleanerLogin /> },
    { path: "/accountant-login", element: <AccountantLogin /> },
  ];

  const dashboardRoutes = [
    { path: "/superadmin", element: <Superadmin /> },
    { path: "/admin", element: <Admin /> },
    { path: "/vendor", element: <Vendor /> },
    { path: "/manager", element: <Manager /> },
    { path: "/cheif", element: <Cheif /> },
    { path: "/sucheif", element: <SuCheif /> },
    { path: "/inventorymanager", element: <InventoryManager /> },
    { path: "/accountant", element: <Accountant /> },
    { path: "/waiter", element: <Waiter /> },
    { path: "/cleaner", element: <Cleaner /> },
  ];

  return (
    <Router>
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/subscription" element={<Subscription />} />

        {/* Department Pages */}
        <Route path="/department" element={<Department />} />
        <Route path="/department/kitchen" element={<KitchenPage />} />
        <Route path="/department/floor" element={<FloorPage />} />

        {/* Login Pages */}
        {loginRoutes.map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}

        {/* Dashboards */}
        {dashboardRoutes.map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}
      </Routes>
    </Router>
  );
};

export default App;
