import Log from "../models/Log.model.js";

/* =========================================================
   ✅ ACTION LOGGER
   Used for: login, order, payment, updates, etc.
========================================================= */
export const logAction = async ({
  action,
  userId = null,
  role = null,
  message = "",
  meta = {},
}) => {
  try {
    await Log.create({
      type: "ACTION",
      action,
      userId,
      role,
      message,
      meta,
    });
  } catch (err) {
    console.error("❌ LogAction Error:", err.message);
  }
};

/* =========================================================
   ❌ ERROR LOGGER
   Used for: try-catch errors
========================================================= */
export const logError = async (error, context = "") => {
  try {
    await Log.create({
      type: "ERROR",
      message: error.message || "Unknown error",
      stack: error.stack || "",
      context,
    });
  } catch (err) {
    console.error("❌ LogError Failed:", err.message);
  }
};

/* =========================================================
   🌐 REQUEST LOGGER (OPTIONAL)
   Used as middleware (API tracking)
========================================================= */
export const logRequest = async (req) => {
  try {
    await Log.create({
      type: "ACTION",
      action: "API_REQUEST",
      message: `${req.method} ${req.originalUrl}`,
      meta: {
        ip: req.ip,
        userAgent: req.headers["user-agent"],
      },
    });
  } catch (err) {
    console.error("❌ LogRequest Error:", err.message);
  }
};