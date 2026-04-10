import React, { useMemo } from "react";
import {
  FileText,
  Home,
  LayoutDashboard,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Sidebar = ({
  activeSection,
  setActiveSection,
  mobileOpen,
  onMobileClose,
  collapsed = false,
}) => {
  const navigate = useNavigate();
  const isMobileDrawer = typeof mobileOpen === "boolean";
  const isOpen = isMobileDrawer ? mobileOpen : true;

  const user = JSON.parse(localStorage.getItem("user")) || {};
  const superAdminName = useMemo(() => {
    return (
      user?.email?.split("@")[0]?.replace(/\./g, " ") || "Super Admin"
    );
  }, [user?.email]);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "user-management", label: "User Management", icon: Users },
    { id: "admin-management", label: "Admin Management", icon: ShieldCheck },
    { id: "notepad", label: "Notes", icon: FileText },
  ];

  const asideContent = (
    <div className="flex h-full flex-col">
      <div
        className={`border-b border-black/5 px-4 py-5 dark:border-white/10 ${
          collapsed ? "items-center" : ""
        } flex`}
      >
        <div className={`flex w-full items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
          <button
            onClick={() => {
              navigate("/");
              onMobileClose?.();
            }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white transition hover:from-emerald-600 hover:to-cyan-600"
            title="Go home"
          >
            <Home size={18} />
          </button>

          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold capitalize text-gray-900 dark:text-white">
                {superAdminName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Platform control
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-4 px-2">
          {!collapsed && (
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
              Navigation
            </p>
          )}
        </div>

        <nav className="space-y-1.5">
          {navItems.map(({ id, label, icon: Icon }) => {
            const isActive = activeSection === id;

            return (
              <button
                key={id}
                onClick={() => {
                  setActiveSection(id);
                  onMobileClose?.();
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
                  collapsed ? "justify-center" : ""
                } ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-500 via-sky-500 to-orange-400 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gradient-to-r hover:from-emerald-50 hover:to-sky-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
                }`}
                title={collapsed ? label : undefined}
              >
                <Icon size={18} />
                {!collapsed && <span>{label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {!collapsed && (
        <div className="border-t border-black/5 p-4 dark:border-white/10">
          <div className="rounded-xl bg-gradient-to-br from-emerald-50 via-sky-50 to-amber-50 p-4 dark:bg-gradient-to-br dark:from-white/5 dark:via-white/[0.04] dark:to-white/[0.03]">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
              Session
            </p>
            <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
              Super Admin
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Full platform visibility and account control.
            </p>
          </div>
        </div>
      )}
    </div>
  );

  if (isMobileDrawer) {
    return (
      <>
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[84vw] border-r border-white/30 bg-gradient-to-b from-white via-emerald-50 to-sky-50 shadow-2xl transition-transform duration-300 dark:border-white/10 dark:bg-gradient-to-b dark:from-[#141b24] dark:via-[#151d24] dark:to-[#1d1821] ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          } xl:hidden`}
        >
          <div className="flex items-center justify-between border-b border-black/5 px-4 py-4 dark:border-white/10">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Menu
            </p>
            <button
              onClick={() => onMobileClose?.()}
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:hover:bg-white/5 dark:hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
          {asideContent}
        </aside>

        {isOpen && (
          <button
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-black/40 xl:hidden"
            onClick={() => onMobileClose?.()}
          />
        )}
      </>
    );
  }

  return (
    <aside className="h-full bg-transparent">
      {asideContent}
    </aside>
  );
};

export default Sidebar;
