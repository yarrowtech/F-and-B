// const errorHandler = (err, req, res, next) => {
//   console.error(err.stack);

//   const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

//   res.status(statusCode).json({
//     success: false,
//     message: err.message || "Server Error",
//   });
// };

// export default errorHandler;








const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode && res.statusCode !== 200
    ? res.statusCode
    : 500;

  let message = err.message || "Server Error";

  /* =========================
     HANDLE COMMON ERRORS
  ========================= */

  // MongoDB invalid ObjectId
  if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource ID";
  }

  // Duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  /* =========================
     LOG ERROR
  ========================= */
  console.error("ERROR:", err);

  /* =========================
     RESPONSE
  ========================= */
  res.status(statusCode).json({
    success: false,
    message,

    // Only show stack in development
    stack:
      process.env.NODE_ENV === "development"
        ? err.stack
        : undefined,
  });
};

export default errorHandler;