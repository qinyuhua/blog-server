const express = require('express');
const router = express.Router();
const Role = require('../models/role');
const { requireAuth, requireAdmin } = require('./auth');

router.use(requireAuth, requireAdmin);

router.post('/list', async (req, res) => {
  try {
    const page = Math.max(1, Number(req.body.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.body.pageSize) || 10));
    const keyword = typeof req.body.keyword === 'string' ? req.body.keyword.trim().slice(0, 100) : '';
    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const query = {};
    if (keyword) {
      query.$or = [
        { roleName: { $regex: escapedKeyword, $options: 'i' } },
        { roleCode: { $regex: escapedKeyword, $options: 'i' } }
      ];
    }
    const total = await Role.countDocuments(query);
    const list = await Role.find(query)
      .sort({ createAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);
    res.json({ success: true, data: { list, total, page, pageSize } });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

router.post('/all', async (req, res) => {
  try {
    const list = await Role.find({ status: 1 }).sort({ createAt: -1 });
    res.json({ success: true, data: list });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

router.post('/add', async (req, res) => {
  try {
    const { roleName, roleCode, description, menuIds, status } = req.body;
    if (!roleName || typeof roleName !== 'string' || !roleCode || typeof roleCode !== 'string' || !/^[a-zA-Z0-9_-]{2,50}$/.test(roleCode)) {
      return res.status(400).json({ success: false, message: '角色名称和合法角色编码不能为空' });
    }
    const existing = await Role.findOne({ roleCode });
    if (existing) {
      return res.json({ success: false, message: '角色编码已存在' });
    }
    const now = Date.now();
    const role = new Role({
      roleName,
      roleCode,
      description: description || '',
      menuIds: menuIds || [],
      status: status !== undefined ? status : 1,
      createAt: now,
      updateAt: now
    });
    await role.save();
    res.json({ success: true, message: '添加成功' });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

router.post('/update', async (req, res) => {
  try {
    const { _id, roleName, roleCode, description, menuIds, status } = req.body;
    if (!_id) {
      return res.json({ success: false, message: '缺少角色ID' });
    }
    await Role.findByIdAndUpdate(_id, {
      roleName, roleCode, description,
      menuIds: menuIds || [],
      status,
      updateAt: Date.now()
    });
    res.json({ success: true, message: '修改成功' });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

router.post('/delete', async (req, res) => {
  try {
    const { _id } = req.body;
    await Role.findByIdAndDelete(_id);
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

module.exports = router;
