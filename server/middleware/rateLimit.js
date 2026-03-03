import rateLimit from "express-rate-limit";

export const bxLimiter = rateLimit({
  windowMs: 30 * 1000,
  max: 100,
  message: "Too many Buildxact requests. Try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

export const pcLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3600,
  message: "Too many Procore requests. Try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
