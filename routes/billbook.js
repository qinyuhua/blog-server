const express = require('express');
const router = express.Router();
const Billbook = require('../models/billbook');
const BillList = require('../models/billList');

// /*
// * 查询
// * */
// router.post("/findBillBooks", (req, res, next) => {
//   console.log('findBillBooks', Billbook);
//   Billbook.find({}, (err, doc) => {
//     // console.log(1, err, doc);
//     if(err) {
//       res.json({
//         success: false,
//         message: err.message,
//       });
//     } else {
//       BillList.find({}, (err1, doc1) => {
//
//         const obj = {};
//         let allAmount = 0;
//         doc.map(item => {
//           if (obj[item.billType] === undefined) {
//             obj[item.billType] = 0;
//           }
//         });
//         doc1.map(item => {
//           obj[item.billType] += item.amount;
//           allAmount += item.amount;
//         });
//         doc.map(item => {
//           console.log(0, item);
//           if (item.billType === 'ALL') {
//             item.payAmount = allAmount;
//           } else {
//             item.payAmount = obj[item.billType]; // 如果返回新增字段，也需要在models 里面新加字段
//           }
//         });
//
//         console.log(1, doc);
//
//         res.json({
//           success: true,
//           data: {
//             list: doc,
//           }
//         });
//
//       });
//
//     }
//   }).sort({ id: 1});
// });


/*
* 查询
* */
router.post("/findBillBooks", (req, res, next) => {
  console.log('findBillBooks', Billbook);
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
        allAmount += item.payAmount;
      });
      doc.map(item => {
        if (item.billType === 'ALL') {
          item.payAmount = allAmount;
        }
        return item;
      });

      console.log(1, doc);
      res.json({
        success: true,
        data: doc,
      });
    }

  }).sort({ id: 1});
});



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


module.exports = router;