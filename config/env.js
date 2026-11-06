const fs = require('fs');
const path = require('path');

function loadDotEnv() {
  const envFile = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envFile)) return;
  fs.readFileSync(envFile, 'utf8').split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/i);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  });
}

loadDotEnv();

const csv = (value, fallback) => (value || fallback || '').split(',').map(item => item.trim()).filter(Boolean);

module.exports = {
  port: Number(process.env.PORT || 3131),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/blog',
  jwtSecret: process.env.JWT_SECRET || 'change-this-jwt-secret',
  jwtExpires: process.env.JWT_EXPIRES || '7d',
  corsOrigins: csv(process.env.CORS_ORIGINS, 'http://localhost:8080,http://127.0.0.1:8080'),
  adminAccounts: csv(process.env.ADMIN_ACCOUNTS, 'admin@test.com,13800138000'),
  wechat: {
    appId: process.env.WECHAT_MINI_APPID || '',
    secret: process.env.WECHAT_MINI_SECRET || ''
  },
  alipay: {
    appId: process.env.ALIPAY_MINI_APPID || '',
    privateKey: process.env.ALIPAY_MINI_PRIVATE_KEY || ''
  }
};
