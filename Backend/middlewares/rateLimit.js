import rateLimit from "express-rate-limit";

/* =========================
   🔐 LOGIN LIMIT (STRICT)
   - Prevent brute force attacks
========================= */
export const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50, // only 5 attempts per IP
  message: {
    success: false,
    message: "Too many login attempts. Try again after 10 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/* =========================
   ⚡ GENERAL API LIMIT
   - Prevent API spam
========================= */
export const apiLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 1000, // 100 requests per IP
  message: {
    success: false,
    message: "Too many requests. Please slow down.",
  },
});

/* =========================
   🛡️ ADMIN ACTION LIMIT
   - Protect sensitive operations
========================= */
export const adminLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50, // stricter than normal APIs
  message: {
    success: false,
    message: "Too many admin actions. Try again later.",
  },
});