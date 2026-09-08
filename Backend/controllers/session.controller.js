import { recordLogout } from "../utils/sessionUsage.js";
import { logAction } from "../utils/logger.js";

/* =========================================================
   SESSION · LOGOUT
   Best-effort endpoint the frontend calls right before it
   clears local storage, so the Super Admin "System Usage"
   screen can show an accurate last-logout time.
========================================================= */
export const logoutSession = async (req, res) => {
  try {
    const { id, role } = req.user || {};

    await recordLogout(role, id);
    await logAction({
      action: "LOGOUT",
      userId: id || null,
      role: role || null,
      message: "User logged out",
    });

    res.json({ success: true, message: "Logout recorded" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
