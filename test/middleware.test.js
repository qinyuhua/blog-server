const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { createRateLimit } = require('../middleware/rateLimit');
const { requireAuth, requireAdmin } = require('../routes/auth');
const User = require('../models/user');
const Role = require('../models/role');
const { jwtSecret } = require('../config/env');

function response() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

test('rate limiter blocks requests after the configured limit', () => {
  const limiter = createRateLimit({ windowMs: 1000, limit: 1 });
  const req = { ip: 'rate-test' };
  let nextCalls = 0;
  limiter(req, response(), () => { nextCalls += 1; });
  const res = response();
  limiter(req, res, () => { nextCalls += 1; });
  assert.equal(nextCalls, 1);
  assert.equal(res.statusCode, 429);
});

test('authentication accepts a valid active user token', async () => {
  const original = User.findById;
  User.findById = async () => ({ _id: 'user-id', account: 'admin@test.com', status: 1 });
  const token = jwt.sign({ userId: 'user-id' }, jwtSecret);
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = response();
  let passed = false;
  await requireAuth(req, res, () => { passed = true; });
  User.findById = original;
  assert.equal(passed, true);
  assert.equal(String(req.userId), 'user-id');
});

test('admin authorization rejects users without an admin role', async () => {
  const original = Role.find;
  Role.find = () => ({ select: async () => [{ roleCode: 'editor' }] });
  const req = { user: { account: 'user@example.com', roleIds: ['role-id'] } };
  const res = response();
  let passed = false;
  await requireAdmin(req, res, () => { passed = true; });
  Role.find = original;
  assert.equal(passed, false);
  assert.equal(res.statusCode, 403);
});
