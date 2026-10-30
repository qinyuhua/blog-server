const mongoose = require('mongoose');
const { mongoUri } = require('./env');

let connectPromise = null;
let reconnectTimer = null;
let shuttingDown = false;

function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return Promise.resolve(mongoose.connection);
  }
  if (connectPromise) return connectPromise;

  connectPromise = mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 20000
  }).then(() => {
    connectPromise = null;
    return mongoose.connection;
  }).catch((error) => {
    connectPromise = null;
    throw error;
  });

  return connectPromise;
}

function scheduleReconnect() {
  if (shuttingDown || reconnectTimer || mongoose.connection.readyState === 1) return;
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    try {
      await connectDatabase();
    } catch (error) {
      console.error('[database] reconnect failed:', error.message);
      scheduleReconnect();
    }
  }, 3000);
}

mongoose.connection.on('connected', () => {
  console.log('[database] MongoDB connected');
});

mongoose.connection.on('disconnected', () => {
  console.warn('[database] MongoDB disconnected');
  scheduleReconnect();
});

mongoose.connection.on('error', (error) => {
  console.error('[database] MongoDB error:', error.message);
});

async function closeDatabase() {
  shuttingDown = true;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = null;
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close(false);
  }
}

function databaseReady(req, res, next) {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ success: false, message: '数据库暂时不可用，请稍后重试' });
  }
  next();
}

module.exports = { connectDatabase, closeDatabase, databaseReady, scheduleReconnect };
