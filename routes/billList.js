const express = require('express');
const router = express.Router();
const BillList = require('../models/billList');
const Billbook = require('../models/billbook');

/*
* 新增
* */
router.post("/insert", (req, res, next) => {
  console.log('insert', req.body);
  req.body.time = new Date().getTime();
  req.body.date = req.body.date ? new Date(req.body.date) : new Date();
  const data = new BillList(req.body);
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
});

/*
* 修改
* */
router.post("/update", (req, res, next) => {
  console.log('update', req.body);
  const { _id,  } = req.body;
  req.body.time = new Date().getTime();
  req.body.date = req.body.date ? new Date(req.body.date) : new Date();
  BillList.findOneAndUpdate({ _id }, { ...req.body }, (err, doc) => { // 修改
    if (err) {
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
* 查询 时间内的 总支出、总收入
* */
router.post("/queryAllAmount", (req, res, next) => {
  console.log('queryAllAmount', BillList);

  console.log(req.body);
  const { startDate, endDate } = req.body;

  BillList.aggregate([
    {
      $match: {
        date: { $gte: new Date(startDate),  $lte: new Date(endDate) }
      }
    },
    {
      $group: {
        _id: "$type",
        TotalAmount: { $sum: { $toInt: "$amount" }},
        TotalIncomeAmount: { $sum: { $toInt: "$__v" }},
      },
    },
  ], (err, doc) => {
    console.log(2, doc);
    if(err) {
      res.json({
        success: false,
        message: err.message,
      });
    } else {
      const totalPayAmount = (doc.find(item => item._id === 'pay') || {}).TotalAmount;
      const totalIncomeAmount = (doc.find(item => item._id === 'income') || {}).TotalIncomeAmount;
      res.json({
        success: true,
        data: {
          totalPayAmount,
          totalIncomeAmount
        },
      });
    }
  });
});


/*
* 查询 支出
* */
router.post("/queryPayAmount", (req, res, next) => {
  console.log('queryPayAmount', BillList);
  const { billType, startDate, endDate } = req.body;

  console.log(req.body);
  if (billType === 'ALL') {

    BillList.aggregate([
      {
        $lookup: {
          from: 'billList',
          localField: '_id',
          foreignField: "_id",
          as: 'billList',
        }
      },
      {
        $unwind: {
          path: "$billList",
          preserveNullAndEmptyArrays: true,
        }
      },
      { $sort: { "billList.date": -1 }},
      {
        $match: {
          "billList.date":  { $gte: new Date(startDate),  $lte: new Date(endDate) },
          "billList.type": 'pay',
        }
      },
      {
        $group: {
          _id: null,
          allAmount: { $sum: { $toInt: "$amount" }},
          // allIncomeAmount: { $sum: { $toInt: "$__v" }},
          lists: {
            $push: '$billList',
          },
          // bookName: { "$first": "$bookName" },
          // billType: { "$first": "$billType" },
          // monthBudgetAmount: { "$first": "$monthBudgetAmount" },
          // budgetAmount: { "$first": "$budgetAmount" },
        },
      },
    ], (err, doc) => {
      console.log(2, doc);
      if(err) {
        res.json({
          success: false,
          message: err.message,
        });
      } else {

        Billbook.find({ billType: 'ALL' }, (err1, doc1) => {
          console.log(1, doc1);
          if(err1) {
            res.json({
              success: false,
              message: err1.message,
            });
          } else {
            const obj = doc1?.[0];
            doc[0].bookName = obj.bookName;
            doc[0].billType = obj.billType;
            doc[0].monthBudgetAmount = obj.monthBudgetAmount;
            doc[0].budgetAmount = obj.budgetAmount;
            res.json({
              success: true,
              data: doc,
            });
          }
        })




      }
    });
  } else {

    Billbook.aggregate([
      {
        $match: {
          billType,
        }
      },
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
      { $sort: { "billList.date": -1 }},
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
          lists: {
            $push: '$billList',
          },
          allAmount: {
            "$sum": "$billList.amount"
          },
          bookName: { "$first": "$bookName" },
          billType: { "$first": "$billType" },
          monthBudgetAmount: { "$first": "$monthBudgetAmount" },
          budgetAmount: { "$first": "$budgetAmount" },
        },
      },

    ], (err, doc) => {
      console.log(1, err, doc);
      if(err) {
        res.json({
          success: false,
          message: err.message,
        });
      } else {
        if (doc.length !== 0) {
          res.json({
            success: true,
            data: doc,
          });
          return;
        }

        Billbook.find({ billType }, (err1, doc1) => {
          console.log(1, doc1);
          if(err1) {
            res.json({
              success: false,
              message: err1.message,
            });
          } else {
            doc1[0].billList = [];
            doc1[0].allAmount = 0;
            res.json({
              success: true,
              data: doc1,
            });
          }
        })
      }
    });
  }
});


/*
* 查询 年收入 和 年支出
* */
router.post("/queryIncomeAmount", (req, res, next) => {
  const { startDate, endDate } = req.body;
  BillList.aggregate([
    {
      $match: {
        date: { $gte: new Date(startDate),  $lte: new Date(endDate) }
      }
    },
    { $sort: { "date": -1 }},
    {
      $group: {
        _id: "$type",
        TotalAmount: { $sum: { $toInt: "$amount" }},
        TotalIncomeAmount: { $sum: { $toInt: "$__v" }},
        billList: {
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
        msg:'',
        data: doc,
      });
    }
  });

});

/*
* 分组查询 每天的支出和消费
* */
router.post("/queryListGroup", (req, res, next) => {
  console.log('queryListGroup', BillList);


  const { startDate, endDate } = req.body;
  BillList.aggregate([
    {
      $lookup: {
        from: 'billbook',
        localField: 'billType',
        foreignField: "billType",
        as: 'billTypeName',
      }
    },
    {$unwind: "$billTypeName"},
    {
      $match: {
        date: { $gte: new Date(startDate),  $lte: new Date(endDate) }
      }
    },

    {
      $project: {
        id: 1,
        date: "$date",
        billTitle: "$billTitle",
        time: "$time",
        billType: "$billType",
        type: "$type",
        amount: "$amount",
        income: "$__v",
        month: "$month",
        bookName: "$billTypeName.bookName",
        monthBudgetAmount: "$billTypeName.monthBudgetAmount",
        budgetAmount: "$billTypeName.budgetAmount",
      },
    },
    {
      $group: {
        _id: "$date",
        lists: {
          $push: '$$ROOT',
        },
        allPayAmount: {
          "$sum": "$amount"
        },
        allIncomeAmout: {
          "$sum": "$income"
        },

      },
    },
    {
      $project: {
        id: 1,
        date: "$_id",
        allPayAmount: "$allPayAmount",
        allIncomeAmout: "$allIncomeAmout",
        lists: 1,
      }
    }
  ], (err, doc) => {
    // console.log(1, err, doc);
    if(err) {
      res.json({
        success: false,
        message: err.message,
      });
    } else {
      res.json({
        success: true,
        msg:'',
        data: doc,
      });
    }
  }).sort({date: -1});
});


router.post("/queryAllList", (req, res, next) => {
  console.log('queryAllList', BillList);


  BillList.find({}, (err, doc) => {
    console.log(1, doc);
    if(err) {
      res.json({
        success: false,
        message: err.message,
      });
    } else {
      res.json({
        success: true,
        data: doc,
      });
    }
  }).sort({date: -1});
});


module.exports = router;
