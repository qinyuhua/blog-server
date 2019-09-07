const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
// mongodb://user:password@127.0.0.1:27017/dbname
// dbname-必选项 user/password 是可选的
const url = 'mongodb://127.0.0.1:27017/admin'; // 本地数据库地址

/*
* connect(url, option)  参数，这些参数 会传入底层MongoDB 驱动
*
* */
mongoose.connect(url, { useNewUrlParser: true });

// connection readyState
const db = mongoose.connection;

db.on('connected', () => {
  console.log('MongoDB connected success '.green);
});

db.on('errror', () => {
  console.error('MongoDB connected fail');
});

db.on('disconnected', () => {
  console.log('MongoDB connected to disconnected');
});


module.exports = router;
