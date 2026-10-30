const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { mongoUri } = require('../config/env');

router.get('/health', (req, res) => {
  res.json({ success: true, data: { database: mongoose.connection.readyState === 1 ? 'up' : 'down' } });
});

module.exports = router;
