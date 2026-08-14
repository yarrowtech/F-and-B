import jwt from "jsonwebtoken";

const optionalAuth = (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      req.authUser = null;
      return next();
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.authUser = {
      id: decoded?.id ? String(decoded.id) : null,
      role: String(decoded?.role || "guest").toLowerCase(),
    };
  } catch {
    req.authUser = null;
  }

  next();
};

export default optionalAuth;
