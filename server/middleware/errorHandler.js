import { logger } from "../lib/logger.js";

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  const correlationId = req.correlationId || "unknown";
  const status = err.status || err.statusCode || 500;
  const message = status >= 500 ? "Internal Server Error" : (err.message || "Error");

  logger.error({ err, correlationId, method: req.method, url: req.originalUrl }, message);

  res.status(status).json({
    error: message,
    correlationId,
    ...(process.env.NODE_ENV !== "production" && err.details ? { details: err.details } : {}),
  });
}
