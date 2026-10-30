const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const miniAppUser = new Schema({
  // 小程序类型: 'wechat' 或 'alipay'
  platform: { type: String, required: true, enum: ['wechat', 'alipay'] },
  
  // 微信 openId 或支付宝 userId
  openId: { type: String, required: true },
  
  // 微信 unionId (可选，用于跨应用识别用户)
  unionId: { type: String },
  
  // 用户昵称
  nickName: { type: String, default: '' },
  
  // 头像
  avatarUrl: { type: String, default: '' },
  
  // 性别: 0-未知, 1-男, 2-女
  gender: { type: Number, default: 0 },
  
  // 国家
  country: { type: String, default: '' },
  
  // 省份
  province: { type: String, default: '' },
  
  // 城市
  city: { type: String, default: '' },
  
  // 会话密钥 (用于解密用户数据)
  sessionKey: { type: String },
  
  // 用户状态: 1-正常, 0-禁用
  status: { type: Number, default: 1 },
  
  // 最后登录时间
  lastLoginAt: { type: Number },
  
  // 创建时间
  createAt: { type: Number, default: Date.now },
  
  // 更新时间
  updateAt: { type: Number, default: Date.now }
});

// 创建复合索引，确保同一平台下 openId 唯一
miniAppUser.index({ platform: 1, openId: 1 }, { unique: true });

module.exports = model('miniAppUser', miniAppUser, 'miniAppUser');
