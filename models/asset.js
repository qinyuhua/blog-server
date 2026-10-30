const mongoose = require('mongoose');
const { Schema, model } = mongoose;

/**
 * 资产分组模型
 * 对应小程序「资产概览」页面的每一个资产卡片
 */
const assetSchema = new Schema({
  // 所属小程序用户 ID（miniAppUser._id）
  userId: { type: Schema.Types.ObjectId, ref: 'miniAppUser', required: true },

  // 资产名称，如"支付宝"、"招商银行"
  name: { type: String, required: true },

  // 资产类型：normal=普通资产，gold=黄金资产
  type: { type: String, default: 'normal', enum: ['normal', 'gold'] },

  // 直接金额（无明细时使用），可为负
  amount: { type: String, default: '0' },

  // 币种，如 CNY / USD / EUR / HKD / JPY / GBP / AUD / other
  currency: { type: String, default: 'CNY' },

  // 自定义汇率（相对人民币，空则使用默认汇率表）
  rate: { type: String, default: '' },

  // 是否计入总资产
  countIn: { type: Boolean, default: true },

  // 颜色标识（十六进制）
  color: { type: String, default: '#1677ff' },

  // 黄金当前价格（元/克），仅 type=gold 时有效
  goldPrice: { type: String, default: '' },

  // 排序权重（越小越靠前）
  sort: { type: Number, default: 0 },

  // 状态：1=正常，0=已删除
  status: { type: Number, default: 1 },

  createAt: { type: Number, default: Date.now },
  updateAt: { type: Number, default: Date.now }
});

assetSchema.index({ userId: 1, status: 1, sort: 1 });

module.exports = model('asset', assetSchema, 'asset');
