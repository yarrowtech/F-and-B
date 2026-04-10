import { Navigate } from "react-router-dom";
import { getUser, isAuthenticated } from "../services/auth.service";

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
  super_admin: "/superadmin-login",
  suchef: "/login",
  sucheif: "/login",
};

const ProtectedRoute = ({ children, allowedRoles }) => {
  const isAuth = isAuthenticated();
  const user = getUser();
  const allowed = allowedRoles?.map((role) => role.toLowerCase());
  const fallbackLogin =
    allowed?.includes("super_admin") || allowed?.includes("superadmin")
      ? "/superadmin-login"
      : "/login";

  if (!isAuth || !user) {
    return <Navigate to={fallbackLogin} replace />;
  }

  const userRole = user.role?.toLowerCase();

  if (allowed && !allowed.includes(userRole)) {
    return <Navigate to={roleLoginMap[userRole] || fallbackLogin} replace />;
  }

  return children;
};

export default ProtectedRoute;
