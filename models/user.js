const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const user = new Schema({
  userName: { type: String },
  account: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
  phone: { type: String },
  email: { type: String },
  avatar: { type: String, default: '' },
  roleIds: [{ type: Schema.Types.ObjectId, ref: 'role' }],
  status: { type: Number, default: 1 },
  createAt: { type: Number },
  updateAt: { type: Number }
});

module.exports = model('user', user, 'user');
