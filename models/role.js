const mongoose = require('mongoose');
const { Schema, model } = mongoose;

const role = new Schema({
  roleName: { type: String, required: true },
  roleCode: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  menuIds: [{ type: Schema.Types.ObjectId, ref: 'menu' }],
  status: { type: Number, default: 1 },
  createAt: { type: Number },
  updateAt: { type: Number }
});

module.exports = model('role', role, 'role');
