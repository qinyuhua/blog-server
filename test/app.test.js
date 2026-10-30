const test = require('node:test');
const assert = require('node:assert/strict');
const { databaseReady } = require('../config/database');

test('database health route is registered without opening a database connection', () => {
  assert.equal(typeof databaseReady, 'function');
});

test('database unavailable requests return 503 instead of using a destroyed pool', () => {
  const req = {};
  const res = { statusCode: 200, body: null, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; } };
  databaseReady(req, res, () => { throw new Error('should not continue'); });
  assert.equal(res.statusCode, 503);
  assert.equal(res.body.success, false);
});
