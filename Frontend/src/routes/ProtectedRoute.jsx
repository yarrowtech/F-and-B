import { Navigate } from "react-router-dom";
import { getUser, isAuthenticated } from "../services/auth.service";

/**
 * Role → Login route mapping
 * Used when a logged-in user tries to access
 * a route they are NOT allowed to access
 */
const roleLoginMap = {
  chef: "/chef-login",
  admin: "/admin-login",
  accountant: "/accountant-login",
  manager: "/manager-login",
  waiter: "/waiter-login",
  cleaner: "/cleaner-login",
  vendor: "/vendor-login",
  inventorymanager: "/inventory-manager-login",
  superadmin: "/superadmin-login",
  suchef: "/sucheif-login",
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const isAuth = isAuthenticated();
  const user = getUser();

  // 🔐 Not logged in at all
  if (!isAuth || !user) {
    return <Navigate to="/" replace />;
  }

  // Normalize role for safety
  const userRole = user.role?.toLowerCase();
  const allowed = allowedRoles?.map((r) => r.toLowerCase());

  // 🚫 Logged in but role not allowed
  if (allowed && !allowed.includes(userRole)) {
    return <Navigate to={roleLoginMap[userRole] || "/"} replace />;
  }

  // ✅ Authorized
  return children;
};

export default ProtectedRoute;
