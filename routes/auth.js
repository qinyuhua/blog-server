const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const Role = require('../models/role');
const Menu = require('../models/menu');
const { jwtSecret, jwtExpires, adminAccounts } = require('../config/env');

const router = express.Router();
const phonePattern = /^1[3-9]\d{9}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordPattern = /^.{6,128}$/;

function isPhone(value) { return phonePattern.test(value); }
function isEmail(value) { return emailPattern.test(value); }
function publicUser(user) {
  return { _id: user._id, account: user.account, name: user.name, phone: user.phone, email: user.email, avatar: user.avatar, roleIds: user.roleIds, status: user.status };
}
function signUser(user) {
  return jwt.sign({ userId: user._id, account: user.account }, jwtSecret, { expiresIn: jwtExpires });
}

async function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return res.status(401).json({ success: false, message: '未登录' });
  try {
    const decoded = jwt.verify(header.slice(7), jwtSecret);
    const user = await User.findById(decoded.userId);
    if (!user || user.status !== 1) return res.status(401).json({ success: false, message: '登录已过期' });
    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: '登录已过期' });
  }
}

async function requireAdmin(req, res, next) {
  try {
    if (adminAccounts.includes(req.user.account)) return next();
    const roles = await Role.find({ _id: { $in: req.user.roleIds || [] }, status: 1 }).select('roleCode');
    if (roles.some(role => role.roleCode === 'admin' || role.roleCode === 'super_admin')) return next();
    return res.status(403).json({ success: false, message: '无管理员权限' });
  } catch (error) {
    return next(error);
  }
}

router.post('/register', async (req, res) => {
  try {
    const { account, password, name } = req.body || {};
    if (typeof account !== 'string' || typeof password !== 'string' || !account || !password) return res.status(400).json({ success: false, message: '账号和密码不能为空' });
    if (!isPhone(account) && !isEmail(account)) return res.status(400).json({ success: false, message: '账号必须是手机号或邮箱' });
    if (!passwordPattern.test(password)) return res.status(400).json({ success: false, message: '密码长度必须为 6 到 128 位' });
    if (await User.findOne({ account })) return res.status(409).json({ success: false, message: '该账号已注册' });
    const user = await User.create({ account, password: await bcrypt.hash(password, 10), name: name || account, phone: isPhone(account) ? account : '', email: isEmail(account) ? account : '', createAt: Date.now(), updateAt: Date.now() });
    res.status(201).json({ success: true, message: '注册成功', data: { userInfo: publicUser(user) } });
  } catch (error) {
    res.status(500).json({ success: false, message: '注册失败' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { account, password } = req.body || {};
    if (typeof account !== 'string' || typeof password !== 'string' || !account || !password) return res.status(400).json({ success: false, message: '账号和密码不能为空' });
    const user = await User.findOne({ account });
    if (!user) return res.status(401).json({ success: false, message: '账号不存在' });
    if (user.status !== 1) return res.status(403).json({ success: false, message: '账号已被禁用' });
    if (!await bcrypt.compare(password, user.password)) return res.status(401).json({ success: false, message: '密码错误' });
    res.json({ success: true, message: '登录成功', data: { token: signUser(user), userInfo: publicUser(user) } });
  } catch (error) {
    res.status(500).json({ success: false, message: '登录失败' });
  }
});

router.get('/userinfo', requireAuth, (req, res) => res.json({ success: true, data: publicUser(req.user) }));
router.get('/profile', requireAuth, async (req, res, next) => {
  try {
    const roles = await Role.find({ _id: { $in: req.user.roleIds || [] }, status: 1 });
    const menuIds = roles.flatMap(role => role.menuIds || []);
    const menus = await Menu.find({ _id: { $in: menuIds }, status: 1 }).sort({ sort: 1 });
    res.json({ success: true, data: { userInfo: publicUser(req.user), roles, menus } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
module.exports.requireAuth = requireAuth;
module.exports.requireAdmin = requireAdmin;
