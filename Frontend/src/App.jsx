// import React, { useEffect } from "react";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// // Public Pages
// import Home from "./Pages/Home";
// import About from "./Pages/About";
// import Services from "./Pages/Services";
// import Contact from "./Pages/Contact";
// import Subscription from "./Pages/Subscription";
// import Department from "./Pages/Department";
// import KitchenPage from "./Pages/Kitchen";
// import FloorPage from "./Pages/Floor";

// // Login Pages
// import SuperAdminLogin from "./components/Login/SuperAdminLogin";
// import AdminLogin from "./components/Login/AdminLogin";
// import VendorLogin from "./components/Login/VendorLogin";
// import ManagerLogin from "./components/Login/ManagerLogin";
// import CheifLogin from "./components/Login/CheifLogin";
// import SucheifLogin from "./components/Login/SuCheifLogin";
// import InventoryManagerLogin from "./components/Login/InventoryManagerLogin";
// import WaiterLogin from "./components/Login/WaiterLogin";
// import CleanerLogin from "./components/Login/CleanerLogin";
// import AccountantLogin from "./components/Login/AccountantLogin";

// // Dashboards
// import Superadmin from "./components/SuperAdminModule/Superadmin";
// import Admin from "./components/AdminModule/Admin";
// import Vendor from "./components/VendorModule/Vendor";
// import Manager from "./components/ManagerModule/Manager";
// import Cheif from "./components/CheifModule/Cheif";
// import SuCheif from "./components/SuCheifModule/SuCheif";
// import InventoryManager from "./components/InventoryManagerModule/InventoryManager";
// import Accountant from "./components/AccountantModule/Accountant";
// import Waiter from "./components/WaiterModule/Waiter";
// import Cleaner from "./components/CleanerModule/Cleaner";

// const App = () => {
//   useEffect(() => {
//     const savedTheme = localStorage.getItem("theme");
//     const isDark = savedTheme === "dark";
//     document.documentElement.classList.toggle("dark", isDark);
//   }, []);

//   const loginRoutes = [
//     { path: "/superadmin-login", element: <SuperAdminLogin /> },
//     { path: "/admin-login", element: <AdminLogin /> },
//     { path: "/vendor-login", element: <VendorLogin /> },
//     { path: "/manager-login", element: <ManagerLogin /> },
//     { path: "/cheif-login", element: <CheifLogin /> },
//     { path: "/su-cheif-login", element: <SucheifLogin /> },
//     { path: "/inventory-manager-login", element: <InventoryManagerLogin /> },
//     { path: "/waiter-login", element: <WaiterLogin /> },
//     { path: "/cleaner-login", element: <CleanerLogin /> },
//     { path: "/accountant-login", element: <AccountantLogin /> },
//   ];

//   const dashboardRoutes = [
//     { path: "/superadmin", element: <Superadmin /> },
//     { path: "/admin", element: <Admin /> },
//     { path: "/vendor", element: <Vendor /> },
//     { path: "/manager", element: <Manager /> },
//     { path: "/cheif", element: <Cheif /> },
//     { path: "/sucheif", element: <SuCheif /> },
//     { path: "/inventorymanager", element: <InventoryManager /> },
//     { path: "/accountant", element: <Accountant /> },
//     { path: "/waiter", element: <Waiter /> },
//     { path: "/cleaner", element: <Cleaner /> },
//   ];

//   return (
//     <Router>
//       <Routes>
//         {/* Public Pages */}
//         <Route path="/" element={<Home />} />
//         <Route path="/about" element={<About />} />
//         <Route path="/services" element={<Services />} />
//         <Route path="/contact" element={<Contact />} />
//         <Route path="/subscription" element={<Subscription />} />

//         {/* Department Pages */}
//         <Route path="/department" element={<Department />} />
//         <Route path="/department/kitchen" element={<KitchenPage />} />
//         <Route path="/department/floor" element={<FloorPage />} />

//         {/* Login Pages */}
//         {loginRoutes.map(({ path, element }) => (
//           <Route key={path} path={path} element={element} />
//         ))}

//         {/* Dashboards */}
//         {dashboardRoutes.map(({ path, element }) => (
//           <Route key={path} path={path} element={element} />
//         ))}
//       </Routes>
//     </Router>
//   );
// };

// export default App;









import { lazy, Suspense, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Home from "./Pages/Home";
import ProtectedRoute from "./routes/ProtectedRoute";
import { setupSessionActivityTracking } from "./services/session.service";

/* ================= PUBLIC PAGES ================= */
const About = lazy(() => import("./Pages/About"));
const Services = lazy(() => import("./Pages/Services"));
const Contact = lazy(() => import("./Pages/Contact"));
const Subscription = lazy(() => import("./Pages/Subscription"));
const Department = lazy(() => import("./Pages/Department"));
const KitchenPage = lazy(() => import("./Pages/Kitchen"));
const FloorPage = lazy(() => import("./Pages/Floor"));

/* ================= LOGIN PAGES ================= */
const SuperAdminLogin = lazy(() => import("./components/Login/SuperAdminLogin"));
const StaffLogin = lazy(() => import("./components/Login/StaffLogin"));

/* ================= DASHBOARDS ================= */
const Superadmin = lazy(() => import("./components/SuperadminModule/Superadmin"));
const Admin = lazy(() => import("./components/AdminModule/Admin"));
const Vendor = lazy(() => import("./components/VendorModule/Vendor"));
const Manager = lazy(() => import("./components/ManagerModule/Manager"));
const Chef = lazy(() => import("./components/ChefModule/Chef"));
const SuCheif = lazy(() => import("./components/SuCheifModule/SuCheif"));
const InventoryManager = lazy(() => import("./components/InventoryManagerModule/InventoryManager"));
const Accountant = lazy(() => import("./components/AccountantModule/Accountant"));
const Waiter = lazy(() => import("./components/WaiterModule/Waiter"));
const Cleaner = lazy(() => import("./components/CleanerModule/Cleaner"));

const RouteFallback = () => (
  <div className="flex min-h-screen items-center justify-center bg-white text-sm font-medium text-gray-500 dark:bg-neutral-900 dark:text-gray-300">
    Loading...
  </div>
);

const App = () => {
  useEffect(() => {
    const cleanupSessionTracking = setupSessionActivityTracking();
    const savedIsDark = localStorage.getItem("isDark");
    const savedTheme = localStorage.getItem("theme");
    const shouldUseDark =
      savedIsDark !== null ? savedIsDark === "true" : savedTheme === "dark";

    document.documentElement.classList.toggle("dark", shouldUseDark);

    return cleanupSessionTracking;
  }, []);

  return (
    <Router>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* ===== PUBLIC ===== */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/subscription" element={<Subscription />} />

        {/* ===== DEPARTMENTS ===== */}
        <Route path="/department" element={<Department />} />
        <Route path="/department/kitchen" element={<KitchenPage />} />
        <Route path="/department/floor" element={<FloorPage />} />

        {/* ===== LOGIN ===== */}
        <Route path="/superadmin-login" element={<SuperAdminLogin />} />
        <Route path="/login" element={<StaffLogin />} />

        {/* ===== DASHBOARDS (ROLE PROTECTED) ===== */}
        <Route
          path="/superadmin/*"
          element={
            <ProtectedRoute allowedRoles={["super_admin"]}>
              <Superadmin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Admin />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vendor/*"
          element={
            <ProtectedRoute allowedRoles={["vendor"]}>
              <Vendor />
            </ProtectedRoute>
          }
        />

        <Route
          path="/manager/*"
          element={
            <ProtectedRoute allowedRoles={["manager"]}>
              <Manager />
            </ProtectedRoute>
          }
        />

        {/* 🔥 CHEF (FIXED & STABLE) */}
        <Route
          path="/chef/*"
          element={
            <ProtectedRoute allowedRoles={["chef"]}>
              <Chef />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cheif/*"
          element={
            <ProtectedRoute allowedRoles={["chef"]}>
              <Chef />
            </ProtectedRoute>
          }
        />

        {/* 🔥 SU CHEF (PATH CONSISTENT) */}
        <Route
          path="/sucheif/*"
          element={
            <ProtectedRoute allowedRoles={["suchef"]}>
              <SuCheif />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventorymanager/*"
          element={
            <ProtectedRoute allowedRoles={["inventory_manager"]}
            >
              <InventoryManager />
            </ProtectedRoute>
          }
        />

        <Route
          path="/accountant/*"
          element={
            <ProtectedRoute allowedRoles={["accountant"]}>
              <Accountant />
            </ProtectedRoute>
          }
        />

        <Route
          path="/waiter/*"
          element={
            <ProtectedRoute allowedRoles={["waiter"]}>
              <Waiter />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cleaner/*"
          element={
            <ProtectedRoute allowedRoles={["cleaner"]}>
              <Cleaner />
            </ProtectedRoute>
          }
        />

        {/* ===== FALLBACK ===== */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
