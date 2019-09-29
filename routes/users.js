const express = require('express');
const router = express.Router();
const User = require('../models/user');

/*
* 新增
* */
router.post("/insert", (req, res, next) => {
  const { userName } = req.body;
  User.findOne({ userName }, (err, doc) => {
    if(err) {
      res.json({
        success: false,
        message: err.message,
      });
    } else {
      if (doc) {
        res.json({
          success: false,
          message: `${doc.userName}已存在，不能重复添加`,
        });
      } else {
        req.body.createAt = new Date().getTime();
        const data = new User(req.body);
        // save 文档新增
        data.save((err1, doc1) => {
          if (err1) {
            res.json({
              success: false,
              message: err1.message
            });
          } else {
            res.json({
              success: true,
              message: '添加成功'
            });
          }
        });
      }
    }
  });
});


module.exports = router;
