/**
 * Production HTTPS enforcement and HSTS (supplements helmet).
 */
export const forceHttps = (req, res, next) => {
  if (process.env.NODE_ENV !== "production") {
    return next();
  }

  const proto = req.headers["x-forwarded-proto"];
  if (proto && proto !== "https") {
    return res.redirect(301, `https://${req.headers.host}${req.originalUrl}`);
  }

  return next();
};
