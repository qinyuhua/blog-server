const mongoose = require('mongoose');
const { Schema, model } = mongoose;

/**
 * 首页模块配置模型
 * 用于管理小程序首页展示的功能模块卡片
 */
const moduleConfigSchema = new Schema({
  // 模块标题，如"资产总览"
  title: { type: String, required: true },

  // 模块副标题，如"查看您的所有资产"
  subtitle: { type: String, default: '' },

  // 模块详细描述
  description: { type: String, default: '' },

  // Element Plus 图标名称，如 TrendCharts / Gold
  icon: { type: String, default: '' },

  // 图标区域背景色（十六进制或 rgba）
  iconBg: { type: String, default: '#edfaf7' },

  // 图标颜色
  iconColor: { type: String, default: '#0eaa91' },

  // 小程序跳转路径，如 /pages/asset/index
  path: { type: String, default: '' },

  // 排序权重（越小越靠前）
  order: { type: Number, default: 0 },

  // 是否启用：true=在小程序首页显示
  enabled: { type: Boolean, default: true },

  // 创建时间（时间戳）
  createAt: { type: Number, default: () => Date.now() },

  // 最近更新时间（时间戳）
  updateAt: { type: Number, default: () => Date.now() }
});

module.exports = model('moduleConfig', moduleConfigSchema);
