const fs = require('fs');
const path = require('path');

const auditFile = path.resolve(__dirname, '..', 'logs', 'audit.log');
fs.mkdirSync(path.dirname(auditFile), { recursive: true });

module.exports = function audit(req, res, next) {
  const startedAt = Date.now();
  res.on('finish', () => {
    const entry = {
      time: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - startedAt,
      account: req.userId || null,
      ip: req.ip
    };
    fs.appendFile(auditFile, JSON.stringify(entry) + '\n', error => {
      if (error) console.error('[audit] write failed:', error.message);
    });
  });
  next();
};
