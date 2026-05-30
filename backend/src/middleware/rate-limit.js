const rateLimit = require('express-rate-limit');

function createRateLimit({ windowMs, maxRequests, message }) {
  return rateLimit({
    windowMs,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
  });
}

module.exports = { createRateLimit };
