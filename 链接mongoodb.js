const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');

users = require('./models/users');
projects = require('./models/projects');
suportrecords = require('./models/suportrecords');
buyRecords = require('./models/buyRecords');
receive = require('./models/receive');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
// 解析请求体
app.use(bodyParser.json());

//===============链接到mongodb==================//

mongoose.connect('mongodb://localhost/contestStore');
var db = mongoose.connection;

//监听事件
mongoose.connection.once("open", function () {
	console.log("数据库连接成功~~~");
});

mongoose.connection.once("close", function () {
	console.log("数据库连接已经断开~~~");
});
