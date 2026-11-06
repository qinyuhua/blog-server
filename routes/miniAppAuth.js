const express = require('express');
const router = express.Router();
const MiniAppUser = require('../models/miniAppUser');
const jwt = require('jsonwebtoken');
const https = require('https');
const config = require('../config/env');

// JWT 密钥
const JWT_SECRET = config.jwtSecret;

/**
 * 微信小程序登录
 * POST /miniapp/auth/wechat/login
 * Body: { code: string, userInfo?: { nickName, avatarUrl, gender, country, province, city } }
 */
router.post('/wechat/login', async (req, res, next) => {
  try {
    const { code, userInfo } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: '缺少 code 参数' });
    }

    let openid, session_key, unionid;

    // 开发环境：支持模拟 code
    if (code.startsWith('mock_code_')) {
      console.log('[miniAppAuth] 使用模拟登录 code:', code);
      openid = 'mock_openid_' + Date.now();
      session_key = 'mock_session_key';
      unionid = undefined;
    } else {
      // 生产环境：调用微信接口
      const WECHAT_APPID = config.wechat.appId;
      const WECHAT_SECRET = config.wechat.secret;

      if (!WECHAT_APPID || !WECHAT_SECRET) {
        return res.status(500).json({ success: false, message: '服务器配置错误：缺少微信小程序配置' });
      }

      // 调用微信接口获取 openid 和 session_key
      const wxUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${WECHAT_APPID}&secret=${WECHAT_SECRET}&js_code=${code}&grant_type=authorization_code`;

      const wxResponse = await new Promise((resolve, reject) => {
        https.get(wxUrl, (response) => {
          let data = '';
          response.on('data', chunk => data += chunk);
          response.on('end', () => resolve(JSON.parse(data)));
          response.on('error', reject);
        }).on('error', reject);
      });

      if (wxResponse.errcode) {
        return res.status(400).json({ 
          success: false, 
          message: `微信登录失败: ${wxResponse.errmsg}`,
          errcode: wxResponse.errcode
        });
      }

      openid = wxResponse.openid;
      session_key = wxResponse.session_key;
      unionid = wxResponse.unionid;
    }

    // 查找或创建用户
    let user = await MiniAppUser.findOne({ platform: 'wechat', openId: openid });

    const now = Date.now();
    if (user) {
      // 更新用户信息
      user.sessionKey = session_key;
      if (unionid) user.unionId = unionid;
      if (userInfo) {
        user.nickName = userInfo.nickName || user.nickName;
        user.avatarUrl = userInfo.avatarUrl || user.avatarUrl;
        user.gender = userInfo.gender !== undefined ? userInfo.gender : user.gender;
        user.country = userInfo.country || user.country;
        user.province = userInfo.province || user.province;
        user.city = userInfo.city || user.city;
      }
      user.lastLoginAt = now;
      user.updateAt = now;
      await user.save();
    } else {
      // 创建新用户
      user = await MiniAppUser.create({
        platform: 'wechat',
        openId: openid,
        unionId: unionid,
        sessionKey: session_key,
        nickName: userInfo?.nickName || '',
        avatarUrl: userInfo?.avatarUrl || '',
        gender: userInfo?.gender || 0,
        country: userInfo?.country || '',
        province: userInfo?.province || '',
        city: userInfo?.city || '',
        lastLoginAt: now,
        createAt: now,
        updateAt: now
      });
    }

    // 生成 JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        platform: 'wechat', 
        openId: user.openId 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        userInfo: {
          _id: user._id,
          nickName: user.nickName,
          avatarUrl: user.avatarUrl,
          platform: user.platform
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 支付宝小程序登录
 * POST /miniapp/auth/alipay/login
 * Body: { authCode: string, userInfo?: { nickName, avatar } }
 */
router.post('/alipay/login', async (req, res, next) => {
  try {
    const { authCode, userInfo } = req.body;

    if (!authCode) {
      return res.status(400).json({ success: false, message: '缺少 authCode 参数' });
    }

    // 支付宝小程序配置
    const ALIPAY_APPID = config.alipay.appId;
    const ALIPAY_PRIVATE_KEY = config.alipay.privateKey;

    if (!ALIPAY_APPID || !ALIPAY_PRIVATE_KEY) {
      return res.status(500).json({ success: false, message: '服务器配置错误：缺少支付宝小程序配置' });
    }

    // 注意：这里需要使用支付宝 SDK 来获取用户信息
    // 简化示例，实际应使用 alipay-sdk 库
    // const alipayResponse = await alipay.exec('alipay.system.oauth.token', { grantType: 'authorization_code', code: authCode });
    
    // 临时方案：直接使用 authCode 作为 userId (实际项目中应该调用支付宝接口)
    const userId = authCode; // 实际应该从支付宝接口获取

    // 查找或创建用户
    let user = await MiniAppUser.findOne({ platform: 'alipay', openId: userId });

    const now = Date.now();
    if (user) {
      // 更新用户信息
      if (userInfo) {
        user.nickName = userInfo.nickName || user.nickName;
        user.avatarUrl = userInfo.avatar || user.avatarUrl;
      }
      user.lastLoginAt = now;
      user.updateAt = now;
      await user.save();
    } else {
      // 创建新用户
      user = await MiniAppUser.create({
        platform: 'alipay',
        openId: userId,
        nickName: userInfo?.nickName || '',
        avatarUrl: userInfo?.avatar || '',
        lastLoginAt: now,
        createAt: now,
        updateAt: now
      });
    }

    // 生成 JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        platform: 'alipay', 
        openId: user.openId 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: '登录成功',
      data: {
        token,
        userInfo: {
          _id: user._id,
          nickName: user.nickName,
          avatarUrl: user.avatarUrl,
          platform: user.platform
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取当前登录用户信息
 * GET /miniapp/auth/userinfo
 * Header: Authorization: Bearer <token>
 */
router.get('/userinfo', async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: '未提供 token' });
    }

    // 验证 token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 获取用户信息
    const user = await MiniAppUser.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, message: '用户不存在' });
    }

    if (user.status !== 1) {
      return res.status(403).json({ success: false, message: '用户已被禁用' });
    }

    res.json({
      success: true,
      data: {
        _id: user._id,
        platform: user.platform,
        nickName: user.nickName,
        avatarUrl: user.avatarUrl,
        gender: user.gender,
        country: user.country,
        province: user.province,
        city: user.city,
        status: user.status,
        createAt: user.createAt
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'token 无效' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'token 已过期' });
    }
    next(error);
  }
});

module.exports = router;
