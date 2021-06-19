const express = require('express');
const router = express.Router();
const BillWallet = require('../models/BillWallet');

/*
* 新增
* */
router.post("/insert", (req, res, next) => {
  console.log('insert', req.body);
  const { walletName } = req.body || {};
  BillWallet.findOne({ walletName }, function (err, doc) {
    if(err){
      res.json({
        success: false,
        errorMsg: err.message
      });
    } else {
      if (doc) {
        res.json({
          success: false,
          errorMsg: `${doc.bookName}已存在，不能重复添加`
        });
      } else {
        req.body.createAt = new Date().getTime();
        const data = new BillWallet(req.body);
        data.save((err2, doc2) => { //添加
          if (err2) {
            res.json({
              success: false,
              errorMsg: err2.message
            });
          } else {
            res.json({
              success: true,
              errorMsg: '添加成功',
            });
          }
        });
      }
    }
  });
});


/*
* 修改
* */
router.post("/update", (req, res, next) => {
  console.log('update', req.body);
  const { _id } = req.body || {};
  BillWallet.findOneAndUpdate({ _id }, {
    ...req.body,
  },  function (err, doc) {
    if(err){
      res.json({
        success: false,
        errorMsg: err.message
      });
    } else {
      res.json({
        success: true,
        errorMsg: '修改成功',
      });
    }
  });
});

/*
* 查询
* */
router.post("/findAllWallets", (req, res, next) => {
  console.log('findAllWallets', BillWallet);

  BillWallet.aggregate([
    { $sort: { "balance": -1 }},
    {
      $group: {
        _id: null,
        TotalAmount: { $sum: { $toInt: "$balance" }},
        lists: {
          $push: "$$ROOT",
        },
      },
    },
  ], (err, doc) => {
    if(err) {
      res.json({
        success: false,
        message: err.message,
      });
    } else {
      res.json({
        success: true,
        data: doc[0]
      });
    }
  });
});



module.exports = router;
