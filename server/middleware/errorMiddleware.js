const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode ? res.statusCode : 500;
  res.status(statusCode);
  res.json({
    // Bug fix: return the real error message so frontend/debuggers can identify failures.
    message: err.message || "Request processing error. Check backend console.",
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { errorHandler };
