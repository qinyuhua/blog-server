const mongoose = require('mongoose');
const { Schema, model } = mongoose;

/**
 * 羊毛活动模型
 * 对应后台「羊毛设置」模块，记录活动名称、logo、期限、链接与状态
 */
const woolActivitySchema = new Schema({
  // 活动名称
  activityName: { type: String, required: true, trim: true },

  // 活动 logo 图片地址
  activityLogo: { type: String, default: '' },

  // 活动开始时间（时间戳，毫秒）
  startAt: { type: Number, required: true },

  // 活动结束时间（时间戳，毫秒）
  // 无限期使用哨兵值 253402300799999（即 9999-12-31 23:59:59）
  endAt: { type: Number, required: true },

  // 活动跳转链接
  activityLink: { type: String, default: '' },

  // 活动状态：valid=有效，invalid=无效
  status: { type: String, enum: ['valid', 'invalid'], default: 'valid' },

  // 创建时间（时间戳）
  createAt: { type: Number, default: () => Date.now() },

  // 创建人
  createBy: { type: String, default: '' },

  // 最近更新时间（时间戳）
  updateAt: { type: Number, default: () => Date.now() },

  // 最近更新人
  updateBy: { type: String, default: '' }
});

woolActivitySchema.index({ status: 1, createAt: -1 });

module.exports = model('woolActivity', woolActivitySchema, 'woolActivity');
