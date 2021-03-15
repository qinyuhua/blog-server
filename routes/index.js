const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');

// 这个地方如果没有对应数据库没有关系，在执行响应的mongoose操作数据库的命令的时候会自动创建数据库的
// mongodb://user:password@127.0.0.1:27017/dbname
// dbname-必选项 user/password 是可选的
const url = 'mongodb://127.0.0.1:27017/blog'; // 本地数据库地址

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


// router.get('/', function(req, res, next) {
//   res.send('Hello, world')
// });


module.exports = router;
