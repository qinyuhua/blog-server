const express = require('express');
const router = express.Router();
const Menu = require('../models/menu');
const { requireAuth, requireAdmin } = require('./auth');

router.use(requireAuth, requireAdmin);

router.post('/list', async (req, res) => {
  try {
    const list = await Menu.find({ status: 1 }).sort({ sort: 1, createAt: -1 });
    const tree = buildTree(list, null);
    res.json({ success: true, data: tree });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

router.post('/all', async (req, res) => {
  try {
    const list = await Menu.find({ status: 1 }).sort({ sort: 1 });
    res.json({ success: true, data: list });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

router.post('/add', async (req, res) => {
  try {
    const { menuName, menuType, path, component, icon, parentId, sort, status } = req.body;
    if (!menuName || typeof menuName !== 'string' || menuName.length > 100) {
      return res.status(400).json({ success: false, message: '菜单名称不能为空且不能超过 100 个字符' });
    }
    const now = Date.now();
    const menu = new Menu({
      menuName,
      menuType: menuType || 'menu',
      path: path || '',
      component: component || '',
      icon: icon || '',
      parentId: parentId || null,
      sort: sort || 0,
      status: status !== undefined ? status : 1,
      createAt: now,
      updateAt: now
    });
    await menu.save();
    res.json({ success: true, message: '添加成功' });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

router.post('/update', async (req, res) => {
  try {
    const { _id, menuName, menuType, path, component, icon, parentId, sort, status } = req.body;
    if (!_id) {
      return res.json({ success: false, message: '缺少菜单ID' });
    }
    await Menu.findByIdAndUpdate(_id, {
      menuName, menuType, path, component, icon,
      parentId: parentId || null,
      sort, status,
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
    const children = await Menu.find({ parentId: _id });
    if (children.length > 0) {
      return res.json({ success: false, message: '存在子菜单，不能删除' });
    }
    await Menu.findByIdAndDelete(_id);
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

function buildTree(list, parentId) {
  return list
    .filter(item => String(item.parentId) === String(parentId))
    .map(item => ({
      ...item.toObject(),
      children: buildTree(list, item._id)
    }));
}

module.exports = router;
