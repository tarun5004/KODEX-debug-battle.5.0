const errorHandler = (err, req, res, next) => {
  // Dev note: jwt.sign jaise errors me status 200 reh jaata tha; 200 error ko frontend success maan leta tha, isliye 4xx/5xx hi use karo.
  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  res.status(statusCode);
  res.json({
    // Dev note: generic error se root cause hide ho raha tha; actual message bhejne se frontend/debugging clear hoti hai.
    message: err.message || "Request processing error. Check backend console.",
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { errorHandler };
