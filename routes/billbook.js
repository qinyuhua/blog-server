const express = require('express');
const router = express.Router();
const Billbook = require('../models/billbook');
const BillList = require('../models/billList');


/*
* 新增
* */
router.post("/insert", (req, res, next) => {
  console.log('insert', req.body);
  const { bookName } = req.body || {};
  Billbook.findOne({ bookName }, function (err, doc) {
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
        const data = new Billbook(req.body);
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
* 新增
* */
router.post("/update", (req, res, next) => {
  console.log('update', req.body);
  const { id } = req.body || {};
  Billbook.findOneAndUpdate({ id }, {
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

// /*
// * 查询
// * */
router.post("/findAllBooks", (req, res, next) => {
  console.log('findAllBooks', Billbook);
  Billbook.find({}, (err, doc) => {
    // console.log(1, err, doc);
    if(err) {
      res.json({
        success: false,
        message: err.message,
      });
    } else {
      res.json({
        success: true,
        data: doc
      });

    }
  }).sort({ id: 1});
});


/*
* 查询
* */
router.post("/findBillBooks", (req, res, next) => {
  console.log('findBillBooks', req.body);

  const { startDate, endDate } = req.body;

  Billbook.aggregate([
    {
      $lookup: {
        from: 'billList',
        localField: 'billType',
        foreignField: "billType",
        as: 'billList',
      }
    },
    {
      $unwind: {
        path: "$billList",
        preserveNullAndEmptyArrays: true,
      }
    },
    {
      $match: {
        $or: [
          { "billList.date":  { $gte: new Date(startDate),  $lte: new Date(endDate) }},
          { "billList":  { $eq: undefined } }
          ]
      }
    },
    {
      $group: {
        _id: '$billType',
        id:  { "$first": "$id" },
        billType: { "$first": "$billType" },
        bookName: { "$first": "$bookName" },
        monthBudgetAmount: { "$first": "$monthBudgetAmount" },
        budgetAmount: { "$first": "$budgetAmount" },
        payAmount: {
          "$sum": "$billList.amount"
        },
        incomeAmount: {
          "$sum": "$billList.__v"
        },
        count: {
          "$sum": 1,
        }
      },
    },
  ], (err, doc) => {
    if(err){
      res.json({
        success: false,
        errorMsg: err.message
      });
    } else {
      let allAmount = 0;
      doc.map(item => {
        if (item.billType !== 'ALL') {
          allAmount += item.payAmount;
        }
      });
      if (!doc.find(item => item.billType === 'ALL')) {
        doc.push({
          bookName: '总账单',
          billType: 'ALL',
          monthBudgetAmount: 650000,
          budgetAmount: 78000000,
          incomeAmount: 0,
        });
      }
      doc.map(item => {
        if (item.billType === 'ALL') {
          item.payAmount = allAmount;
        }
        return item;
      });

      // console.log(1, doc);
      res.json({
        success: true,
        data: doc,
      });
    }

  }).sort({ payAmount: -1});
});




module.exports = router;
