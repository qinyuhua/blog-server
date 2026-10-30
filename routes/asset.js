const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Asset = require('../models/asset');
const AssetItem = require('../models/assetItem');
const MiniAppUser = require('../models/miniAppUser');
const { requireAuth, requireAdmin } = require('./auth');

const MINIAPP_JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-miniapp';

// ─── 小程序端鉴权中间件 ────────────────────────────────────────────────────────
async function requireMiniAppAuth(req, res, next) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '未登录' });
  }
  try {
    const decoded = jwt.verify(header.slice(7), MINIAPP_JWT_SECRET);
    const user = await MiniAppUser.findById(decoded.userId);
    if (!user || user.status !== 1) {
      return res.status(401).json({ success: false, message: '登录已过期或账号已禁用' });
    }
    req.miniAppUser = user;
    req.miniAppUserId = user._id;
    next();
  } catch {
    return res.status(401).json({ success: false, message: '登录已过期' });
  }
}

// ─── 小程序端接口 ─────────────────────────────────────────────────────────────

/**
 * 获取当前用户的所有资产分组（含明细）
 * GET /asset/miniapp/list
 */
router.get('/miniapp/list', requireMiniAppAuth, async (req, res) => {
  try {
    const assets = await Asset.find({ userId: req.miniAppUserId, status: 1 })
      .sort({ sort: 1, createAt: 1 })
      .lean();

    const assetIds = assets.map(a => a._id);
    const items = await AssetItem.find({ assetId: { $in: assetIds }, status: 1 })
      .sort({ sort: 1, createAt: 1 })
      .lean();

    // 将明细挂到对应资产下
    const itemMap = {};
    items.forEach(it => {
      const key = String(it.assetId);
      if (!itemMap[key]) itemMap[key] = [];
      itemMap[key].push(it);
    });

    const result = assets.map(a => ({
      ...a,
      items: itemMap[String(a._id)] || []
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 新增资产分组
 * POST /asset/miniapp/add
 */
router.post('/miniapp/add', requireMiniAppAuth, async (req, res) => {
  try {
    const { name, type, amount, currency, rate, countIn, color, goldPrice, sort } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: '资产名称不能为空' });
    }
    const now = Date.now();
    const asset = await Asset.create({
      userId: req.miniAppUserId,
      name: name.trim().slice(0, 20),
      type: type || 'normal',
      amount: amount || '0',
      currency: currency || 'CNY',
      rate: rate || '',
      countIn: countIn !== false,
      color: color || '#1677ff',
      goldPrice: goldPrice || '',
      sort: sort || 0,
      status: 1,
      createAt: now,
      updateAt: now
    });
    res.json({ success: true, data: asset, message: '添加成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 更新资产分组
 * POST /asset/miniapp/update
 */
router.post('/miniapp/update', requireMiniAppAuth, async (req, res) => {
  try {
    const { _id, name, type, amount, currency, rate, countIn, color, goldPrice, sort } = req.body;
    if (!_id) return res.status(400).json({ success: false, message: '缺少资产ID' });

    const asset = await Asset.findOne({ _id, userId: req.miniAppUserId, status: 1 });
    if (!asset) return res.status(404).json({ success: false, message: '资产不存在' });

    const update = { updateAt: Date.now() };
    if (name !== undefined) update.name = name.trim().slice(0, 20);
    if (type !== undefined) update.type = type;
    if (amount !== undefined) update.amount = amount;
    if (currency !== undefined) update.currency = currency;
    if (rate !== undefined) update.rate = rate;
    if (countIn !== undefined) update.countIn = countIn;
    if (color !== undefined) update.color = color;
    if (goldPrice !== undefined) update.goldPrice = goldPrice;
    if (sort !== undefined) update.sort = sort;

    await Asset.findByIdAndUpdate(_id, { $set: update });
    res.json({ success: true, message: '更新成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 删除资产分组（同时软删除其下所有明细）
 * POST /asset/miniapp/delete
 */
router.post('/miniapp/delete', requireMiniAppAuth, async (req, res) => {
  try {
    const { _id } = req.body;
    if (!_id) return res.status(400).json({ success: false, message: '缺少资产ID' });

    const asset = await Asset.findOne({ _id, userId: req.miniAppUserId, status: 1 });
    if (!asset) return res.status(404).json({ success: false, message: '资产不存在' });

    const now = Date.now();
    await Asset.findByIdAndUpdate(_id, { $set: { status: 0, updateAt: now } });
    await AssetItem.updateMany({ assetId: _id }, { $set: { status: 0, updateAt: now } });

    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 新增资产明细
 * POST /asset/miniapp/item/add
 */
router.post('/miniapp/item/add', requireMiniAppAuth, async (req, res) => {
  try {
    const { assetId, name, amount, grams, cost, currency, rate, countIn, yieldType, yieldRate, sort } = req.body;
    if (!assetId) return res.status(400).json({ success: false, message: '缺少资产ID' });
    if (!name || !name.trim()) return res.status(400).json({ success: false, message: '明细名称不能为空' });

    // 确认资产属于当前用户
    const asset = await Asset.findOne({ _id: assetId, userId: req.miniAppUserId, status: 1 });
    if (!asset) return res.status(404).json({ success: false, message: '资产不存在' });

    const now = Date.now();
    const item = await AssetItem.create({
      assetId,
      userId: req.miniAppUserId,
      name: name.trim().slice(0, 20),
      amount: amount || '0',
      grams: grams || '',
      cost: cost || '',
      currency: currency || '',
      rate: rate || '',
      countIn: countIn !== false,
      yieldType: yieldType || '',
      yieldRate: yieldRate || '',
      sort: sort || 0,
      status: 1,
      createAt: now,
      updateAt: now
    });
    res.json({ success: true, data: item, message: '添加成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 更新资产明细
 * POST /asset/miniapp/item/update
 */
router.post('/miniapp/item/update', requireMiniAppAuth, async (req, res) => {
  try {
    const { _id, name, amount, grams, cost, currency, rate, countIn, yieldType, yieldRate, sort } = req.body;
    if (!_id) return res.status(400).json({ success: false, message: '缺少明细ID' });

    const item = await AssetItem.findOne({ _id, userId: req.miniAppUserId, status: 1 });
    if (!item) return res.status(404).json({ success: false, message: '明细不存在' });

    const update = { updateAt: Date.now() };
    if (name !== undefined) update.name = name.trim().slice(0, 20);
    if (amount !== undefined) update.amount = amount;
    if (grams !== undefined) update.grams = grams;
    if (cost !== undefined) update.cost = cost;
    if (currency !== undefined) update.currency = currency;
    if (rate !== undefined) update.rate = rate;
    if (countIn !== undefined) update.countIn = countIn;
    if (yieldType !== undefined) update.yieldType = yieldType;
    if (yieldRate !== undefined) update.yieldRate = yieldRate;
    if (sort !== undefined) update.sort = sort;

    await AssetItem.findByIdAndUpdate(_id, { $set: update });
    res.json({ success: true, message: '更新成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 删除资产明细
 * POST /asset/miniapp/item/delete
 */
router.post('/miniapp/item/delete', requireMiniAppAuth, async (req, res) => {
  try {
    const { _id } = req.body;
    if (!_id) return res.status(400).json({ success: false, message: '缺少明细ID' });

    const item = await AssetItem.findOne({ _id, userId: req.miniAppUserId, status: 1 });
    if (!item) return res.status(404).json({ success: false, message: '明细不存在' });

    await AssetItem.findByIdAndUpdate(_id, { $set: { status: 0, updateAt: Date.now() } });
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── 管理端接口（需要管理员权限）────────────────────────────────────────────────

/**
 * 管理端：资产分组列表（支持分页、按用户筛选）
 * POST /asset/admin/list
 */
router.post('/admin/list', requireAuth, requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.body.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.body.pageSize) || 20));
    const { userId, keyword } = req.body;

    const query = { status: 1 };
    if (userId) query.userId = userId;
    if (keyword) {
      const esc = keyword.trim().slice(0, 100).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.name = { $regex: esc, $options: 'i' };
    }

    const total = await Asset.countDocuments(query);
    const list = await Asset.find(query)
      .sort({ createAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

    // 查询对应用户信息
    const userIds = [...new Set(list.map(a => String(a.userId)))];
    const users = await MiniAppUser.find({ _id: { $in: userIds } })
      .select('_id nickName avatarUrl platform openId')
      .lean();
    const userMap = {};
    users.forEach(u => { userMap[String(u._id)] = u; });

    const result = list.map(a => ({
      ...a,
      userInfo: userMap[String(a.userId)] || null
    }));

    res.json({ success: true, data: { list: result, total, page, pageSize } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 管理端：资产明细列表（按资产分组查询）
 * POST /asset/admin/item/list
 */
router.post('/admin/item/list', requireAuth, requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.body.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.body.pageSize) || 20));
    const { assetId, userId } = req.body;

    const query = { status: 1 };
    if (assetId) query.assetId = assetId;
    if (userId) query.userId = userId;

    const total = await AssetItem.countDocuments(query);
    const list = await AssetItem.find(query)
      .sort({ sort: 1, createAt: 1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

    res.json({ success: true, data: { list, total, page, pageSize } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 管理端：更新资产分组状态（启用/禁用）
 * POST /asset/admin/status
 */
router.post('/admin/status', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { _id, status } = req.body;
    if (!_id || ![0, 1].includes(status)) {
      return res.status(400).json({ success: false, message: '参数错误' });
    }
    await Asset.findByIdAndUpdate(_id, { $set: { status, updateAt: Date.now() } });
    res.json({ success: true, message: status === 1 ? '启用成功' : '禁用成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 管理端：统计概览
 * GET /asset/admin/stats
 */
router.get('/admin/stats', requireAuth, requireAdmin, async (req, res) => {
  try {
    const totalAssets = await Asset.countDocuments({ status: 1 });
    const totalItems = await AssetItem.countDocuments({ status: 1 });
    const totalUsers = await Asset.distinct('userId', { status: 1 });
    res.json({
      success: true,
      data: {
        totalAssets,
        totalItems,
        totalActiveUsers: totalUsers.length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
