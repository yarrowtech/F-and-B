// import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
// import Sidebar from "./AdminSidebar";

// // Lazy load heavy sections for faster initial paint
// const Dashboard = lazy(() => import("./AdminDashboard"));
// const StaffManagement = lazy(() => import("./AdminStaffManagement"));
// const RestaurantManagement = lazy(() => import("./AdminRestaurantManagement"));
// const RestaurantSubscription = lazy(() => import("./AdminSubscription"));
// const AdminInventory = lazy(() => import("../AdminModule/AdminInventory"));
// const VendorManagement = lazy(() => import("./AdminVendorManagement"));
// const MenuManagement = lazy(() => import("./AdminMenuManagement"));
// const Account = lazy(() => import("./AdminAccount"));
// const Notes = lazy(() => import("./AdminNotes"));
// const Analytics = lazy(() => import("./AdminAnalytics"));
// const Settings = lazy(() => import("./AdminSettings"));
// const Message = lazy(() => import("./AdminMessage"));
// const Notification = lazy(() => import("./AdminNotification"));
// const TableManagement = lazy(() => import("./AdminTableManagement"));

// import { FaBars, FaEnvelope, FaBell, FaCogs, FaHome } from "react-icons/fa";
// import { Moon, Sun } from "lucide-react";

// const Admin = () => {
//   const [active, setActive] = useState("dashboard");
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [darkMode, setDarkMode] = useState(() => localStorage.getItem("isDark") === "true");

//   // Notification & Message Counters
//   const [unreadNotifications, setUnreadNotifications] = useState(3);
//   const [unreadMessages, setUnreadMessages] = useState(2);

//   const mainRef = useRef(null);

//   // Sync html.dark on first mount
//   useEffect(() => {
//     const root = document.documentElement;
//     if (darkMode) root.classList.add("dark");
//     else root.classList.remove("dark");
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   // Close drawer on ESC
//   useEffect(() => {
//     const onKey = (e) => e.key === "Escape" && setSidebarOpen(false);
//     window.addEventListener("keydown", onKey);
//     return () => window.removeEventListener("keydown", onKey);
//   }, []);

//   const handleModeChange = () => {
//     const newMode = !darkMode;
//     setDarkMode(newMode);
//     localStorage.setItem("isDark", String(newMode));
//     const root = document.documentElement;
//     if (newMode) root.classList.add("dark");
//     else root.classList.remove("dark");
//   };

//   // Scroll to top on section change
//   useEffect(() => {
//     if (mainRef.current) {
//       mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
//     }
//   }, [active]);

//   // Lock body scroll when drawer open
//   useEffect(() => {
//     const prev = document.body.style.overflow;
//     document.body.style.overflow = sidebarOpen ? "hidden" : "auto";
//     return () => {
//       document.body.style.overflow = prev;
//     };
//   }, [sidebarOpen]);

//   const handleSetActive = (section) => {
//     setActive(section);
//     setSidebarOpen(false);
//     if (section === "notification") setUnreadNotifications(0);
//     if (section === "message") setUnreadMessages(0);
//   };

//   const renderContent = () => {
//     switch (active) {
//       case "dashboard": return <Dashboard />;
//       case "staff": return <StaffManagement />;
//       case "restaurant": return <RestaurantManagement />;
//       case "subscription": return <RestaurantSubscription />;
//       case "inventory": return <AdminInventory />;
//       case "vendor": return <VendorManagement />;
//       case "menu": return <MenuManagement />;
//       case "account": return <Account />;
//       case "notes": return <Notes />;
//       case "analytics": return <Analytics />;
//       case "settings": return <Settings />;
//       case "message": return <Message />;
//       case "notification": return <Notification />;
//       case "table": return <TableManagement />;
//       default:
//         return (
//           <div className="p-4 text-green-800 dark:text-green-200">
//             <h2 className="text-xl font-bold capitalize">{active}</h2>
//             <p className="mt-2 text-sm">Content for {active} will go here.</p>
//           </div>
//         );
//     }
//   };

//   return (
//     <div className="h-screen w-full bg-green-50 dark:bg-neutral-900 text-gray-800 dark:text-gray-200">
//       {/* ===== Mobile Top Bar (visible on < lg) ===== */}
//       <div className="lg:hidden sticky top-0 z-40 bg-white dark:bg-neutral-800 border-b border-black/5 dark:border-white/10">
//         <div className="flex items-center justify-between px-4 py-3">
//           <button
//             onClick={() => setSidebarOpen(true)}
//             className="p-2 bg-white dark:bg-neutral-700 rounded-md shadow-sm"
//             aria-label="Open sidebar"
//           >
//             <FaBars size={18} />
//           </button>

//           <div className="text-center">
//             <h1 className="text-base font-semibold text-black dark:text-green-100">Admin Panel</h1>
//             <p className="text-xs capitalize text-gray-500 dark:text-gray-300">{active}</p>
//           </div>

//           <button
//             onClick={handleModeChange}
//             className="p-2 rounded-md bg-white dark:bg-neutral-700 shadow-sm"
//             title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
//             aria-label="Toggle theme"
//           >
//             {darkMode ? <Sun size={18} /> : <Moon size={18} />}
//           </button>
//         </div>
//       </div>

//       {/* ===== Layout Wrapper ===== */}
//       <div className="flex h-[calc(100vh-0px)] lg:h-screen gap-0 lg:gap-6 px-0 lg:px-4 py-0 lg:py-4 overflow-hidden">
//         {/* Sidebar (Desktop, persistent) */}
//         <aside className="hidden lg:block w-72 shrink-0" aria-hidden={sidebarOpen ? "true" : "false"}>
//           <div className="h-full bg-white dark:bg-neutral-800 shadow rounded-xl overflow-hidden">
//             <Sidebar active={active} setActive={handleSetActive} />
//           </div>
//         </aside>

//         {/* Sidebar (Mobile Drawer) */}
//         {sidebarOpen && (
//           <>
//             <div
//               className="fixed inset-0 bg-black/40 z-[1000]"
//               onClick={() => setSidebarOpen(false)}
//               aria-hidden="true"
//             />
//             <div
//               className="fixed top-0 left-0 h-full w-72 z-[1001] bg-white dark:bg-neutral-800 shadow-2xl rounded-r-xl overflow-y-auto"
//               role="dialog"
//               aria-modal="true"
//               aria-label="Navigation"
//             >
//               <Sidebar active={active} setActive={handleSetActive} />
//             </div>
//           </>
//         )}

//         {/* ===== Main Column ===== */}
//         <div
//           className="flex-1 min-w-0 flex flex-col gap-4 lg:gap-6"
//           aria-hidden={sidebarOpen ? "true" : "false"}
//         >
//           {/* Desktop Header */}
//           <header className="hidden lg:block sticky top-4 z-30 mx-4 lg:mx-0 bg-white dark:bg-neutral-800 shadow px-4 py-3 rounded-xl">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h1 className="text-xl font-bold text-black dark:text-green-100">Admin Panel</h1>
//                 <p className="text-sm capitalize text-gray-500 dark:text-gray-300">{active}</p>
//               </div>

//               <div className="flex gap-4 items-center text-gray-600 dark:text-gray-200">
//                 {/* Theme Toggle */}
//                 <button
//                   onClick={handleModeChange}
//                   className="p-2 transition-colors duration-200 hover:text-yellow-500 dark:hover:text-yellow-400"
//                   title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
//                 >
//                   {darkMode ? <Sun size={18} /> : <Moon size={18} />}
//                 </button>

//                 {/* Messages */}
//                 <div className="relative">
//                   <button
//                     title="Messages"
//                     onClick={() => handleSetActive("message")}
//                     className="p-2 hover:text-green-600"
//                   >
//                     <FaEnvelope />
//                   </button>
//                   {unreadMessages > 0 && (
//                     <span className="absolute -top-1 -right-2 text-[10px] bg-blue-600 text-white rounded-full px-1.5">
//                       {unreadMessages}
//                     </span>
//                   )}
//                 </div>

//                 {/* Notifications */}
//                 <div className="relative">
//                   <button
//                     title="Notifications"
//                     onClick={() => handleSetActive("notification")}
//                     className="p-2 hover:text-green-600"
//                   >
//                     <FaBell />
//                   </button>
//                   {unreadNotifications > 0 && (
//                     <span className="absolute -top-1 -right-2 text-[10px] bg-red-600 text-white rounded-full px-1.5">
//                       {unreadNotifications}
//                     </span>
//                   )}
//                 </div>

//                 {/* Settings */}
//                 <button
//                   title="Settings"
//                   onClick={() => handleSetActive("settings")}
//                   className="p-2 hover:text-green-600"
//                 >
//                   <FaCogs />
//                 </button>
//               </div>
//             </div>
//           </header>

//           {/* Page Content */}
//           <main
//             ref={mainRef}
//             className={`flex-1 min-h-0 overflow-y-auto bg-white dark:bg-neutral-800 rounded-none lg:rounded-xl shadow-none lg:shadow p-4 lg:p-6 ${sidebarOpen ? "pointer-events-none select-none" : ""}`}
//           >
//             <Suspense fallback={<div className="p-6">Loading…</div>}>
//               {renderContent()}
//             </Suspense>
//           </main>

//           {/* Mobile Bottom Tab Bar */}
//           <nav className="lg:hidden sticky bottom-0 z-40 bg-white/95 dark:bg-neutral-800/95 backdrop-blur border-t border-black/5 dark:border-white/10">
//             <div className="grid grid-cols-5">
//               <TabItem
//                 label="Home"
//                 icon={<FaHome size={16} />}
//                 active={active === "dashboard"}
//                 onClick={() => handleSetActive("dashboard")}
//               />
//               <TabItem
//                 label="Messages"
//                 icon={<FaEnvelope size={16} />}
//                 badge={unreadMessages}
//                 active={active === "message"}
//                 onClick={() => handleSetActive("message")}
//               />
//               <TabItem
//                 label="Notify"
//                 icon={<FaBell size={16} />}
//                 badge={unreadNotifications}
//                 active={active === "notification"}
//                 onClick={() => handleSetActive("notification")}
//               />
//               <TabItem
//                 label="Analytics"
//                 icon={<span className="font-bold text-xs">A</span>}
//                 active={active === "analytics"}
//                 onClick={() => handleSetActive("analytics")}
//               />
//               <TabItem
//                 label="Settings"
//                 icon={<FaCogs size={16} />}
//                 active={active === "settings"}
//                 onClick={() => handleSetActive("settings")}
//               />
//             </div>
//           </nav>
//         </div>
//       </div>
//     </div>
//   );
// };

// function TabItem({ label, icon, active, onClick, badge = 0 }) {
//   return (
//     <button
//       onClick={onClick}
//       className={`relative flex flex-col items-center justify-center py-2.5 text-xs ${
//         active
//           ? "text-green-700 dark:text-green-300 font-semibold"
//           : "text-gray-600 dark:text-gray-300"
//       }`}
//     >
//       <div className="relative">
//         {icon}
//         {badge > 0 && (
//           <span className="absolute -top-2 -right-2 text-[10px] bg-red-600 text-white rounded-full px-1.5">
//             {badge}
//           </span>
//         )}
//       </div>
//       <span className="mt-0.5">{label}</span>
//     </button>
//   );
// }

// export default Admin;


import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "./AdminSidebar";

/* ===== Lazy Pages ===== */
const Dashboard = lazy(() => import("./AdminDashboard"));
const StaffManagement = lazy(() => import("./AdminStaffManagement"));
const RestaurantManagement = lazy(() => import("./AdminRestaurantManagement"));
const RestaurantEmployees = lazy(() => import("./RestaurantEmployees"));
const RestaurantSubscription = lazy(() => import("./AdminSubscription"));
const AdminInventory = lazy(() => import("../AdminModule/AdminInventory"));
const VendorManagement = lazy(() => import("./AdminVendorManagement"));
const MenuManagement = lazy(() => import("./AdminMenuManagement"));
const Account = lazy(() => import("./AdminAccount"));
const Notes = lazy(() => import("./AdminNotes"));
const Analytics = lazy(() => import("./AdminAnalytics"));
const Settings = lazy(() => import("./AdminSettings"));
const Message = lazy(() => import("./AdminMessage"));
const Notification = lazy(() => import("./AdminNotification"));
const TableManagement = lazy(() => import("./AdminTableManagement"));

import { FaBars, FaSignOutAlt } from "react-icons/fa";
import { Moon, Sun } from "lucide-react";

/* ─── Avatar + Profile Popup ─── */
function AdminProfileButton() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const user = JSON.parse(localStorage.getItem("user")) || {};
  const businessName = user?.businessName || "Admin";
  const adminId      = user?.adminId      || "N/A";
  const email        = user?.email        || "";

  useEffect(() => {
    const on  = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online",  on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("theme");
    navigate("/admin-login");
  };

  return (
    <>
      {/* Avatar button — sits inside the top bar */}
      <button
        onClick={() => setOpen(true)}
        className="rounded-full bg-green-600 hover:bg-green-700 text-white shadow flex items-center justify-center text-lg font-bold transition-colors shrink-0"
        style={{ width: 42, height: 42 }}
        title={businessName}
      >
        {businessName.charAt(0).toUpperCase()}
      </button>

      {/* Profile popup */}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-80 mx-4 p-7 z-10">
            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-2xl leading-none"
            >
              ×
            </button>

            {/* Avatar */}
            <div className="flex flex-col items-center gap-3 mb-6">
              <div className="w-20 h-20 rounded-full bg-green-600 text-white flex items-center justify-center text-4xl font-bold">
                {businessName.charAt(0).toUpperCase()}
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-800 dark:text-white">{businessName}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Administrator</p>
              </div>
            </div>

            {/* Details */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Admin ID</span>
                <span className="font-semibold text-gray-800 dark:text-white">{adminId}</span>
              </div>
              {email && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">Email</span>
                  <span className="font-semibold text-gray-800 dark:text-white truncate max-w-[160px]">{email}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Status</span>
                <span className={`font-semibold ${isOnline ? "text-green-600" : "text-red-500"}`}>
                  {isOnline ? "● Online" : "● Offline"}
                </span>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-semibold text-base transition-colors"
            >
              <FaSignOutAlt />
              Logout
            </button>
          </div>
        </div>
      )}
    </>
  );
}

const Admin = () => {
  const [active, setActive] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("isDark") === "true"
  );

  /* ✅ RESTAURANT STATE */
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(null);

  const mainRef = useRef(null);

  /* ================= EFFECTS ================= */

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [active]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "auto";
    return () => (document.body.style.overflow = "auto");
  }, [sidebarOpen]);

  /* ================= HANDLERS ================= */

  const handleModeChange = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("isDark", String(next));
  };

  const handleSetActive = (section) => {
    setActive(section);
    setSidebarOpen(false);
  };

  /* ================= MAIN SWITCH ================= */

  const renderContent = () => {
    switch (active) {
      case "dashboard":
        return <Dashboard />;

      case "staff":
        return <StaffManagement />;

      /* ================= RESTAURANT LIST ================= */
      case "restaurant":
        return (
          <RestaurantManagement
            onManageEmployees={(restaurantId) => {
              setSelectedRestaurantId(restaurantId);
              setActive("restaurantEmployees");
            }}
          />
        );

      /* ================= RESTAURANT EMPLOYEES ================= */
      case "restaurantEmployees":
        return (
          <RestaurantEmployees
            restaurantId={selectedRestaurantId}
            goBack={() => setActive("restaurant")}
          />
        );

      case "menu":
        return <MenuManagement />;

      case "table":
        return <TableManagement />;

      case "inventory":
        return <AdminInventory />;

      case "vendor":
        return <VendorManagement />;

      case "subscription":
        return <RestaurantSubscription />;

      case "account":
        return <Account />;

      case "notes":
        return <Notes />;

      case "analytics":
        return <Analytics />;

      case "settings":
        return <Settings />;

      case "message":
        return <Message />;

      case "notification":
        return <Notification />;

      default:
        return <div className="p-4">Page not found</div>;
    }
  };

  return (
    <div className="h-screen w-full bg-green-50 dark:bg-neutral-900">
      {/* ===== Mobile Header ===== */}
      <div className="lg:hidden sticky top-0 z-40 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => setSidebarOpen(true)}>
            <FaBars />
          </button>
          <div className="flex items-center gap-3">
            <button onClick={handleModeChange}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <AdminProfileButton />
          </div>
        </div>
      </div>

      <div className="flex h-full">
        {/* ===== Sidebar ===== */}
        <aside className="hidden lg:block w-72 shrink-0">
          <Sidebar active={active} setActive={handleSetActive} />
        </aside>

        {/* ===== Right Column ===== */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

          {/* ── Top Bar (desktop) ── */}
          <div className="hidden lg:flex items-center justify-between px-6 py-3 bg-white dark:bg-neutral-800 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 capitalize">{active.replace(/([A-Z])/g, " $1")}</p>
            <AdminProfileButton />
          </div>

          {/* ===== Main Content ===== */}
          <main
            ref={mainRef}
            className="flex-1 overflow-y-auto bg-white dark:bg-neutral-800 p-6"
          >
            {selectedRestaurantId && active === "restaurantEmployees" && (
              <div className="mb-4 text-sm text-green-600 font-semibold">
                Managing Employees for Restaurant ID: {selectedRestaurantId}
              </div>
            )}

            <Suspense fallback={<div>Loading...</div>}>
              {renderContent()}
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Admin;
