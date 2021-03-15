const mongoose = require('mongoose');
const { Schema, model } = mongoose;

// Schema 一种以文件形式储存的数据库模型骨架，无法直接通往数据库端，不具备对数据库的操作能力
const billbooks = new Schema({
  "bookName": {type: String, required: false}, // 账单名称
  "billType": {type: String, required: false}, // 账单类型
  "payAmount": {type: Number, required: false}, // 支出
  "monthBudgetAmount": {type: Number, required: false}, // 月预算
  "budgetAmount": {type: Number, required: false}, // 年总预算
});

/*
* mongoose.model 创建一个Model对象， model 管理数据库属性、行为 的类
* mongoose 是通过 model 来创建 mongodb 中对应的集合 collection
* model('', schema)
* model() 三个参数,
*     第一个参数 模型的名称 对应的集合名字的 单数 形式，
*        Mongoose 会自动找到名字是model 名字 复数形式 的collection.
*     第二个参数 保存的文档对象
*     第三个参数
* */
module.exports = model('billbook', billbooks, 'billbook');
