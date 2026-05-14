import crypto from "crypto";
import protect from "./auth.middleware.js";

const safeEqual = (a, b) => {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));

  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

const serviceTokenOrProtect = (req, res, next) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";

  if (
    process.env.SUPER_ADMIN_PORTAL_SERVICE_TOKEN &&
    safeEqual(token, process.env.SUPER_ADMIN_PORTAL_SERVICE_TOKEN)
  ) {
    req.user = {
      id: "service:super-admin-portal",
      role: "super_admin",
      email: "service@super-admin-portal.local",
      service: true,
    };

    return next();
  }

  return protect(req, res, next);
};

export default serviceTokenOrProtect;
