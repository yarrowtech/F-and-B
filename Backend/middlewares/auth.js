// // middlewares/auth.js
// function auth(req, res, next) {
//   try {
//     // minimal pass-through for now; replace with JWT verify etc.
//     // if (!req.headers.authorization) return res.status(401).json({ ok: false, error: 'Unauthorized' });
//     next();
//   } catch (err) {
//     console.error('auth error:', err);
//     res.status(401).json({ ok: false, error: 'Unauthorized' });
//   }
// }

// module.exports = { auth };



 
// middlewares/auth.js
exports.auth = (req, res, next) => {
  console.log("Dummy auth ran ✅");
  next();
};
