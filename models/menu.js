const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const menu = new Schema({
  menuName: { type: String, required: true },
  menuType: { type: String, default: 'menu' },
  path: { type: String, default: '' },
  component: { type: String, default: '' },
  icon: { type: String, default: '' },
  parentId: { type: Schema.Types.ObjectId, ref: 'menu', default: null },
  sort: { type: Number, default: 0 },
  status: { type: Number, default: 1 },
  createAt: { type: Number },
  updateAt: { type: Number }
});

module.exports = model('menu', menu, 'menu');
