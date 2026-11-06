const express = require('express');
const router = express.Router();
const WoolActivity = require('../models/woolActivity');
const { requireAuth, requireAdmin } = require('./auth');

const STATUS_VALUES = ['valid', 'invalid'];
const MAX_NAME_LENGTH = 50;
const MAX_URL_LENGTH = 500;

function currentOperator(req) {
  return (req.user && (req.user.name || req.user.account)) || '';
}

function normalizeText(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function parseTimestamp(value) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function isValidUrl(value) {
  return !value || /^https?:\/\/\S+$/i.test(value);
}

/**
 * 获取羊毛活动列表（支持分页、关键字与状态筛选）
 * GET /wool-activity?page=1&pageSize=20&keyword=&status=
 */
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const keyword = normalizeText(req.query.keyword, 100);
    const status = req.query.status;

    const query = {};
    if (STATUS_VALUES.includes(status)) query.status = status;
    if (keyword) {
      const esc = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.activityName = { $regex: esc, $options: 'i' };
    }

    const total = await WoolActivity.countDocuments(query);
    const list = await WoolActivity.find(query)
      .sort({ createAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

    res.json({ success: true, data: { list, total, page, pageSize } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 获取单个羊毛活动
 * GET /wool-activity/:id
 */
router.get('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const item = await WoolActivity.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ success: false, message: '羊毛活动不存在' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 新增羊毛活动
 * POST /wool-activity
 */
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const { activityName, activityLogo, activityLink, startAt, endAt, status } = req.body || {};

    const name = normalizeText(activityName, MAX_NAME_LENGTH);
    if (!name) return res.status(400).json({ success: false, message: '活动名称不能为空' });

    const start = parseTimestamp(startAt);
    const end = parseTimestamp(endAt);
    if (!start || !end) return res.status(400).json({ success: false, message: '请选择活动期限' });
    if (start > end) return res.status(400).json({ success: false, message: '活动开始时间不能晚于结束时间' });

    const logo = normalizeText(activityLogo, MAX_URL_LENGTH);
    if (!isValidUrl(logo)) return res.status(400).json({ success: false, message: '活动 logo 地址格式不正确' });

    const link = normalizeText(activityLink, MAX_URL_LENGTH);
    if (!isValidUrl(link)) return res.status(400).json({ success: false, message: '活动链接格式不正确' });

    const finalStatus = STATUS_VALUES.includes(status) ? status : 'valid';
    const now = Date.now();
    const operator = currentOperator(req);

    const item = await WoolActivity.create({
      activityName: name,
      activityLogo: logo,
      activityLink: link,
      startAt: start,
      endAt: end,
      status: finalStatus,
      createAt: now,
      createBy: operator,
      updateAt: now,
      updateBy: operator
    });

    res.status(201).json({ success: true, data: item, message: '创建成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 更新羊毛活动
 * PUT /wool-activity/:id
 */
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const item = await WoolActivity.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: '羊毛活动不存在' });

    const { activityName, activityLogo, activityLink, startAt, endAt, status } = req.body || {};
    const update = { updateAt: Date.now(), updateBy: currentOperator(req) };

    if (activityName !== undefined) {
      const name = normalizeText(activityName, MAX_NAME_LENGTH);
      if (!name) return res.status(400).json({ success: false, message: '活动名称不能为空' });
      update.activityName = name;
    }

    if (activityLogo !== undefined) {
      const logo = normalizeText(activityLogo, MAX_URL_LENGTH);
      if (!isValidUrl(logo)) return res.status(400).json({ success: false, message: '活动 logo 地址格式不正确' });
      update.activityLogo = logo;
    }

    if (activityLink !== undefined) {
      const link = normalizeText(activityLink, MAX_URL_LENGTH);
      if (!isValidUrl(link)) return res.status(400).json({ success: false, message: '活动链接格式不正确' });
      update.activityLink = link;
    }

    const start = startAt !== undefined ? parseTimestamp(startAt) : item.startAt;
    const end = endAt !== undefined ? parseTimestamp(endAt) : item.endAt;
    if (startAt !== undefined || endAt !== undefined) {
      if (!start || !end) return res.status(400).json({ success: false, message: '请选择活动期限' });
      if (start > end) return res.status(400).json({ success: false, message: '活动开始时间不能晚于结束时间' });
      update.startAt = start;
      update.endAt = end;
    }

    if (status !== undefined) {
      if (!STATUS_VALUES.includes(status)) return res.status(400).json({ success: false, message: '活动状态不合法' });
      update.status = status;
    }

    await WoolActivity.findByIdAndUpdate(req.params.id, { $set: update });
    res.json({ success: true, message: '更新成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * 删除羊毛活动
 * DELETE /wool-activity/:id
 */
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const item = await WoolActivity.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: '羊毛活动不存在' });
    await WoolActivity.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
