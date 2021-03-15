const http = require('http');
const express = require('express');
// 通过 websocket 模块 建立WebSocket 服务器
const webSocketServer = require('websocket').server;
const webSocketsServerPort = 3131;

// const websocketDemo = require('./routes/webSocketDemo');

const index = require('./routes/index');
const billbook = require('./routes/billbook');
const billList = require('./routes/billList');

const app = express();

// 这里定义一级路由
app.use(express.json());
app.use('/', index);
app.use('/billbook', billbook);
app.use('/billList', billList);


app.get('/', function(req, res, next) {
  res.send('启动成功1');
});

// 创建应用服务器
server = http.createServer(app);

// 启动Http服务
server.listen(webSocketsServerPort, function() {
  console.log('listending 3131, 启动成功');
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



// app.use('/websocket', websocketDemo);

// wss = new webSocketServer({
//   httpServer: server,
//   autoAcceptConnections: true // 默认：false
// });
// wss.on('connect', function(ws){
//   console.log('服务端： 客户端已经连接');
//   ws.on('message', function (message) {
//     console.log(message);
//     ws.send(`服务器接收消息成功。。。${ws}`)
//     // setInterval(function(){
//     //   ws.send(`服务器接收消息成功。。。${new Date().getTime()}`)
//     // }, 1000);
//   })
// })
// wss.on('close', function(ws){
//   console.log('服务端： 客户端发起关闭');
//   // ws.on('message', function (message) {
//   //   console.log(message);
//   // })
// })
// const clients = {};
// // This code generates unique userid for everyuser.
// const getUniqueID = () => {
//   const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
//   return s4() + s4() + '-' + s4();
// };
//
//
// wss.on('request', function(request) {
//   console.log('发送请求');
//   const userID = getUniqueID();
//   console.log((new Date()) + ' Recieved a new connection from origin ' + request.origin + '.');
//   const connection = request.accept(null, request.origin);
//   clients[userID] = connection;
//   console.log('connected: ' + userID + ' in ' + Object.getOwnPropertyNames(clients))
// });
//


module.exports = app;
