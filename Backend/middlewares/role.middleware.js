// const allowRoles = (...allowedRoles) => {
//   return (req, res, next) => {
//     if (!req.user?.role) {
//       return res.status(401).json({
//         success: false,
//         message: "Unauthorized",
//       });
//     }

//     const userRole = req.user.role.toLowerCase();
//     const allowed = allowedRoles.map((r) => r.toLowerCase());

//     if (!allowed.includes(userRole)) {
//       return res.status(403).json({
//         success: false,
//         message: "Access denied for this role",
//       });
//     }

//     next();
//   };
// };

// export default allowRoles;








const allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    /* =========================
       CHECK USER
    ========================= */
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No user role found",
      });
    }

    const userRole = String(req.user.role).toLowerCase();

    /* =========================
       NORMALIZE ROLES
    ========================= */
    const allowed = allowedRoles.map((r) =>
      String(r).toLowerCase()
    );

    /* =========================
       CHECK ACCESS
    ========================= */
    if (!allowed.includes(userRole)) {
      // Optional: debug log (helpful in dev)
      console.warn(
        `ACCESS DENIED: Role "${userRole}" tried to access [${allowed.join(
          ", "
        )}]`
      );

      return res.status(403).json({
        success: false,
        message: `Access denied for role: ${userRole}`,
      });
    }

    next();
  };
};

export default allowRoles;