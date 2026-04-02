import { Navigate } from "react-router-dom";
import { getUser, isAuthenticated } from "../services/auth.service";

// Role → Login route mappingUsed when a logged-in user tries to accessa route they are NOT allowed to access



const roleLoginMap = {
  chef: "/login",
  cheif: "/login",
  admin: "/login",
  accountant: "/login",
  manager: "/login",
  waiter: "/login",
  cleaner: "/login",
  vendor: "/login",
  inventorymanager: "/login",
  inventory_manager: "/login",
  superadmin: "/superadmin-login",
  suchef: "/login",
  sucheif: "/login",
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
