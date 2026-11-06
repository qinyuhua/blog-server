const express = require('express');
const router = express.Router();
const ModuleConfig = require('../models/moduleConfig');
const { requireAuth, requireAdmin } = require('./auth');

/**
 * 获取所有模块配置（管理端）
 * GET /module-config
 */
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const list = await ModuleConfig.find().sort({ order: 1, createAt: 1 }).lean();
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 获取所有已启用的模块配置（小程序端公开接口）
 * GET /module-config/public
 */
router.get('/public', async (req, res) => {
  try {
    const list = await ModuleConfig.find({ enabled: true })
      .sort({ order: 1, createAt: 1 })
      .select('title subtitle description icon iconBg iconColor path order')
      .lean();
    res.json({ success: true, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 获取单个模块配置
 * GET /module-config/:id
 */
router.get('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const item = await ModuleConfig.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ success: false, message: '模块配置不存在' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 新增模块配置
 * POST /module-config
 */
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, subtitle, description, icon, iconBg, iconColor, path, order, enabled } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: '模块标题不能为空' });
    }
    const now = Date.now();
    const item = await ModuleConfig.create({
      title: title.trim().slice(0, 30),
      subtitle: (subtitle || '').trim().slice(0, 50),
      description: (description || '').trim().slice(0, 200),
      icon: (icon || '').trim(),
      iconBg: iconBg || '#edfaf7',
      iconColor: iconColor || '#0eaa91',
      path: (path || '').trim(),
      order: Number(order) || 0,
      enabled: enabled !== false,
      createAt: now,
      updateAt: now
    });
    res.json({ success: true, data: item, message: '创建成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 更新模块配置
 * PUT /module-config/:id
 */
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const item = await ModuleConfig.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: '模块配置不存在' });

    const { title, subtitle, description, icon, iconBg, iconColor, path, order, enabled } = req.body;
    const update = { updateAt: Date.now() };

    if (title !== undefined) {
      if (!title.trim()) return res.status(400).json({ success: false, message: '模块标题不能为空' });
      update.title = title.trim().slice(0, 30);
    }
    if (subtitle !== undefined) update.subtitle = subtitle.trim().slice(0, 50);
    if (description !== undefined) update.description = description.trim().slice(0, 200);
    if (icon !== undefined) update.icon = icon.trim();
    if (iconBg !== undefined) update.iconBg = iconBg;
    if (iconColor !== undefined) update.iconColor = iconColor;
    if (path !== undefined) update.path = path.trim();
    if (order !== undefined) update.order = Number(order) || 0;
    if (enabled !== undefined) update.enabled = Boolean(enabled);

    await ModuleConfig.findByIdAndUpdate(req.params.id, { $set: update });
    res.json({ success: true, message: '更新成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 删除模块配置
 * DELETE /module-config/:id
 */
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const item = await ModuleConfig.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: '模块配置不存在' });
    await ModuleConfig.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
