import crypto from "crypto";
import rateLimit from "express-rate-limit";

/* Recognises requests that come from the Yarrowtech website's backend.

   The Yarrowtech backend sends `x-api-key: <YARROWTECH_SERVER_KEY>` on every call it
   makes here. Our own EFNBMMS frontend calls some of the same public signup endpoints
   from the browser, so the key cannot simply be mandatory everywhere without breaking it.

   YARROWTECH_KEY_MODE
     monitor (default)  trusted calls pass freely; untrusted public callers are allowed
                        but strictly rate-limited (20 per hour per IP) on signup routes
     enforce            only calls carrying the key are accepted on those routes
                        (use once signup is served only through the Yarrowtech site) */

const safeEqual = (a, b) => {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));
  return left.length > 0 && left.length === right.length && crypto.timingSafeEqual(left, right);
};

export const trustYarrowtechServer = (req, res, next) => {
  const expected = process.env.YARROWTECH_SERVER_KEY;
  req.isYarrowtechServer = Boolean(expected) && safeEqual(req.headers["x-api-key"], expected);
  next();
};

const untrustedLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  skip: (req) => req.isYarrowtechServer === true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many signup attempts. Please try again later." },
});

export const guardPublicSignup = [
  trustYarrowtechServer,
  (req, res, next) => {
    const enforce = String(process.env.YARROWTECH_KEY_MODE || "monitor").toLowerCase() === "enforce";
    if (enforce && !req.isYarrowtechServer) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    next();
  },
  untrustedLimiter,
];
