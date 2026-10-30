const express = require('express');
const router = express.Router();
const MiniAppUser = require('../models/miniAppUser');

/**
 * 获取小程序用户列表（带分页和筛选）
 * POST /miniapp/users
 */
router.post('/', async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, keyword = '', platform = '', status = '' } = req.body;
    
    const query = {};
    
    // 关键词搜索（昵称或 openId）
    if (keyword) {
      query.$or = [
        { nickName: { $regex: keyword, $options: 'i' } },
        { openId: { $regex: keyword, $options: 'i' } }
      ];
    }
    
    // 平台筛选
    if (platform) {
      query.platform = platform;
    }
    
    // 状态筛选
    if (status !== '') {
      query.status = parseInt(status);
    }

    // 统计数据
    const totalUsers = await MiniAppUser.countDocuments({});
    const wechatUsers = await MiniAppUser.countDocuments({ platform: 'wechat' });
    const alipayUsers = await MiniAppUser.countDocuments({ platform: 'alipay' });

    // 分页查询
    const total = await MiniAppUser.countDocuments(query);
    const list = await MiniAppUser
      .find(query)
      .sort({ createAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize))
      .select('-sessionKey') // 不返回敏感字段
      .lean();

    res.json({
      success: true,
      data: {
        list,
        total,
        totalUsers,
        wechatUsers,
        alipayUsers,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 更新用户状态
 * PUT /miniapp/users/:id/status
 */
router.put('/:id/status', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (![0, 1].includes(status)) {
      return res.status(400).json({ success: false, message: '状态参数错误' });
    }

    const user = await MiniAppUser.findByIdAndUpdate(
      id,
      { status, updateAt: Date.now() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    res.json({
      success: true,
      message: status === 1 ? '启用成功' : '禁用成功',
      data: user
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 删除用户
 * DELETE /miniapp/users/:id
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await MiniAppUser.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取用户详情
 * GET /miniapp/users/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await MiniAppUser.findById(id).select('-sessionKey').lean();

    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
