const http = require('http');
const express = require('express');
const cors = require('cors');
const { port, corsOrigins } = require('./config/env');
const { connectDatabase, closeDatabase, databaseReady } = require('./config/database');
const { createRateLimit } = require('./middleware/rateLimit');
const audit = require('./middleware/audit');

const index = require('./routes/index');
const auth = require('./routes/auth');
const account = require('./routes/account');
const menu = require('./routes/menu');
const role = require('./routes/role');
const billbook = require('./routes/billbook');
const billList = require('./routes/billList');
const billWallet = require('./routes/billWallet');
const miniAppAuth = require('./routes/miniAppAuth');
const miniAppUsers = require('./routes/miniAppUsers');
const asset = require('./routes/asset');
const moduleConfig = require('./routes/moduleConfig');
const woolActivity = require('./routes/woolActivity');

const app = express();
const allowedOrigins = new Set(corsOrigins);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed'));
  }
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(audit);

const authLimiter = createRateLimit({ windowMs: 15 * 60 * 1000, limit: 30 });
app.use('/api/auth', authLimiter);

app.get('/', (req, res) => res.json({ success: true, message: 'blog-server 运行中', port }));
app.use('/api', index);
app.use('/api/auth', databaseReady, auth);
app.use('/api/account', databaseReady, account);
app.use('/api/menu', databaseReady, menu);
app.use('/api/role', databaseReady, role);
app.use('/api/billbook', databaseReady, billbook);
app.use('/api/billList', databaseReady, billList);
app.use('/api/billWallet', databaseReady, billWallet);
app.use('/api/miniapp/auth', databaseReady, miniAppAuth);
app.use('/api/miniapp/users', databaseReady, miniAppUsers);
app.use('/api/asset', databaseReady, asset);
app.use('/api/module-config', databaseReady, moduleConfig);
app.use('/api/wool-activity', databaseReady, woolActivity);

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error('[http] error:', error.message);
  res.status(error.status || 500).json({ success: false, message: error.message || '服务器内部错误' });
});

async function start() {
  await connectDatabase();
  const server = http.createServer(app);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, resolve);
  });
  console.log(`[server] listening on port ${port}`);

  const shutdown = async (signal) => {
    console.log(`[server] shutting down (${signal})`);
    await new Promise(resolve => server.close(resolve));
    await closeDatabase();
    process.exit(0);
  };
  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
  return server;
}

if (require.main === module) {
  start().catch(error => {
    console.error('[server] startup failed:', error.message);
    process.exit(1);
  });
}

module.exports = { app, start };
