const mongoose = require('mongoose');
const { Schema, model } = mongoose;

/**
 * 资产明细模型
 * 对应资产卡片展开后的每一条明细
 */
const assetItemSchema = new Schema({
  // 所属资产分组 ID
  assetId: { type: Schema.Types.ObjectId, ref: 'asset', required: true },

  // 所属用户 ID（冗余，方便按用户查询）
  userId: { type: Schema.Types.ObjectId, ref: 'miniAppUser', required: true },

  // 明细名称，如"余额宝"、"定期存款"
  name: { type: String, required: true },

  // 金额（普通明细），可为负
  amount: { type: String, default: '0' },

  // 克数（黄金明细专用）
  grams: { type: String, default: '' },

  // 黄金成本价（元/克，黄金明细专用）
  cost: { type: String, default: '' },

  // 明细币种（为空则跟随父资产币种）
  currency: { type: String, default: '' },

  // 明细自定义汇率
  rate: { type: String, default: '' },

  // 是否计入明细合计
  countIn: { type: Boolean, default: true },

  // 理财收益类型：'' = 无，year = 年化，month = 月化
  yieldType: { type: String, default: '' },

  // 收益率（百分比，如 3.5）
  yieldRate: { type: String, default: '' },

  // 排序权重
  sort: { type: Number, default: 0 },

  // 状态：1=正常，0=已删除
  status: { type: Number, default: 1 },

  createAt: { type: Number, default: Date.now },
  updateAt: { type: Number, default: Date.now }
});

assetItemSchema.index({ assetId: 1, status: 1, sort: 1 });
assetItemSchema.index({ userId: 1, status: 1 });

module.exports = model('assetItem', assetItemSchema, 'assetItem');
