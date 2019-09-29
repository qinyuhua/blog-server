const mongoose = require('mongoose');
const { Schema, model } = mongoose;

// Schema 一种以文件形式储存的数据库模型骨架，无法直接通往数据库端，不具备对数据库的操作能力
const user = new Schema({
  "userName": {type: String, required: true}, // 登录名
  "password": {type: String, required: true}, // 密码
  "name": {type: String}, // 真实姓名
  "page": {type: String}, // 页面权限
  "role": {type: String}, // 角色
  "operator": {type: String}, // 操作员
  "createAt": {type: Number}, // 创建时间
  "updateAt": {type: Number} // 更新时间
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
module.exports = model('user', user, 'user');
