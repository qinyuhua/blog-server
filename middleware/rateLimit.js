const buckets = new Map();

function createRateLimit({ windowMs = 15 * 60 * 1000, limit = 60 } = {}) {
  return (req, res, next) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const bucket = buckets.get(key);
    if (!bucket || now - bucket.startedAt >= windowMs) {
      buckets.set(key, { startedAt: now, count: 1 });
      return next();
    }
    bucket.count += 1;
    if (bucket.count > limit) return res.status(429).json({ success: false, message: '请求过于频繁，请稍后重试' });
    next();
  };
}

module.exports = { createRateLimit };
