const http = require('http');
const express = require('express');
const router = express.Router();
const webSocketDemo = require('../models/webSocketDemo');
const webSocketServer = require('websocket').server;
// const server = http.createServer();


console.log('websocketDemo。。。。', webSocketServer);

/*
* 新增
* */
express.post("/connect", (req, res, next) => {
  console.log(1);
  console.log(server);
  const app = express();


  wss = new webSocketServer({
    httpServer: server,
    autoAcceptConnections: true // 默认：false
  });
  wss.on('connect', function(ws){
    console.log('服务端： 客户端已经连接');
    ws.on('message', function (message) {
      console.log(message);
      ws.send(`服务器接收消息成功。。。${ws}`)
      // setInterval(function(){
      //   ws.send(`服务器接收消息成功。。。${new Date().getTime()}`)
      // }, 1000);
    })
  })
  wss.on('close', function(ws){
    console.log('服务端： 客户端发起关闭');
    // ws.on('message', function (message) {
    //   console.log(message);
    // })
  })
  const clients = {};
// This code generates unique userid for everyuser.
  const getUniqueID = () => {
    const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return s4() + s4() + '-' + s4();
  };


  wss.on('request', function(request) {
    console.log('发送请求');
    const userID = getUniqueID();
    console.log((new Date()) + ' Recieved a new connection from origin ' + request.origin + '.');
    const connection = request.accept(null, request.origin);
    clients[userID] = connection;
    console.log('connected: ' + userID + ' in ' + Object.getOwnPropertyNames(clients))
  });



});


module.exports = router;
