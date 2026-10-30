const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const { requireAuth, requireAdmin } = require('./auth');

router.use(requireAuth, requireAdmin);

function isPhone(v) {
  return /^1[3-9]\d{9}$/.test(v);
}
function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

router.post('/list', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.body.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.body.pageSize) || 10));
    const keyword = typeof req.body.keyword === 'string' ? req.body.keyword.trim().slice(0, 100) : '';
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const query = {};
    if (keyword) {
      query.$or = [
        { account: { $regex: escapedKeyword, $options: 'i' } },
        { name: { $regex: escapedKeyword, $options: 'i' } }
      ];
    }
    const total = await User.countDocuments(query);
    const list = await User.find(query)
      .select('-password')
      .sort({ createAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);
    res.json({ success: true, data: { list, total, page, pageSize } });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

router.post('/add', async (req, res) => {
  try {
    const { account, password, name, phone, email, roleIds, status } = req.body;
    if (!account || !password) {
      return res.status(400).json({ success: false, message: '账号和密码不能为空' });
    }
    if ((!isPhone(account) && !isEmail(account)) || typeof password !== 'string' || password.length < 6 || password.length > 128) {
      return res.status(400).json({ success: false, message: '账号格式或密码长度不正确' });
    }
    const existing = await User.findOne({ account });
    if (existing) {
      return res.json({ success: false, message: '该账号已存在' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const now = Date.now();
    const user = new User({
      account,
      password: hashedPassword,
      name: name || account,
      phone: phone || (isPhone(account) ? account : ''),
      email: email || (isEmail(account) ? account : ''),
      roleIds: roleIds || [],
      status: status !== undefined ? status : 1,
      createAt: now,
      updateAt: now
    });
    await user.save();
    res.json({ success: true, message: '添加成功' });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

router.post('/update', async (req, res) => {
  try {
    const { _id, name, phone, email, roleIds, status, password } = req.body;
    if (!_id) {
      return res.json({ success: false, message: '缺少用户ID' });
    }
    const updateData = { updateAt: Date.now() };
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (roleIds !== undefined) updateData.roleIds = roleIds;
    if (status !== undefined) updateData.status = status;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }
    await User.findByIdAndUpdate(_id, updateData);
    res.json({ success: true, message: '修改成功' });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

router.post('/delete', async (req, res) => {
  try {
    const { _id } = req.body;
    await User.findByIdAndDelete(_id);
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

module.exports = router;
