const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode ? res.statusCode : 500;
  res.status(statusCode);
  res.json({
    // Dev note: generic error se root cause hide ho raha tha; actual message bhejne se frontend/debugging clear hoti hai.
    message: err.message || "Request processing error. Check backend console.",
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { errorHandler };
