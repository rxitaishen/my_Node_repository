const express = require("express");

const mongoose = require("mongoose");
require("./components/login.js");
const path = require("path");

const bodyParser = require("body-parser");

// 报名表
projects = require("./models/projects");
users = require("./models/users");

const app = express();
const UPLOAD_DIR = path.resolve(__dirname, ".", "target");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 处理跨域
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  next();
});

// 解析请求体
app.use(bodyParser.json());


//===============链接到mongodb==================//

mongoose.connect("mongodb://localhost/competstore");
var db = mongoose.connection;

//监听事件
mongoose.connection.once("open", function () {
  console.log("数据库连接成功~~~");
});

mongoose.connection.once("close", function () {
  console.log("数据库连接已经断开~~~");
});

//===============用户相关==================//

app.get("/", (req, res) => {
  console.log('这里是后端')
});

//登录
app.post(`/login`, (req, res) => {
  var t = req.body;
  users.findOne(
    { userName: t.userName, passWord: t.passWord },
    (err, user) => {
      if (err) {
        //console.log(err);
        throw err;
      }
      if (user) {
        res.send("登录成功");
      } else {
        res.send("登录失败");
      }
    }
  );
});

//登出
app.post(`/logout`, (req, res) => {
  var t = req.body;
  users.findOne({ name: t.userName, pass: t.passWord }, (err, user) => {
    if (err) {
      //console.log(err);
      throw err;
    }
    if (user) {
      res.send("退出成功");
    } else {
      res.send("登录失败");
    }
  });
});

// 注册三个角色函数
const userRegister = (t, identy, res) => {
  // 用户角色
  const stdParams = {
    ...t,
    roleInTeam: "队长",
    teamId: Math.floor(Math.random() * 90000) + 10000,
    projectId: Math.floor(Math.random() * 900) + 100,
  };
  // 教师角色
  const teacherParams = {
    ...t,
    projectToAudit: [],
  };
  // 管理员角色
  const adminParams = {
    ...t,
  };
  const kuArr = [users, projects, admin];
  const paramsArr = [stdParams, teacherParams, adminParams];

  kuArr[identy].create(paramsArr[identy], (err, user) => {
    if (err) {
      //console.log(err);
      throw err;
    }
    if (user) {
      res.send("注册成功");
    } else {
      res.send("注册失败");
    }
  });
};

//注册
app.post(`/register`, (req, res) => {
  var t = req.body;
  userRegister(t, t.identy, res);
});

//删除用户信息
app.delete("/userDelete/:_id", (req, res) => {
  let query = { _id: req.params._id };
  users.deleteOne(query, (err, user) => {
    if (err) {
      throw err;
    }
    res.json(user);
  });
});


// 文件下载
app.post("/public/download", function (req, res) {
  console.log(req.params, req.body, req.data, req);
  try {
    const filename = `${req.body.proName}.docx`; // 获取要下载的文件名
    const file = path.join(__dirname, "/target/" + filename);
    res.download(file, filename, function (err) {
      if (err) {
        console.error("文件下载失败：", err);
        res.send("找不到文件");
      } else {
        console.log("文件下载成功");
      }
    });
  } catch (e) {
    console.error(e);
  }
});




// 查看详情
app.post(`/admin/projectsDetail`, (req, res) => {
  var t = req.body;
  projects.findOne({ _id: t._id }, (err, tm) => {
    if (err) {
      throw err;
    }
    if (tm !== null) {
      res.json(tm);
    } else {
      console.log("proName为null");
      res.send("0");
    }
  });
});

// 列举项目
app.post("/admin/list", (req, res, next) => {
  projects.find((err, tm) => {
    if (err) {
      throw err;
    }
    if (tm !== null) {
      res.json({
        total: tm.length,
        rows: tm,
      });
    } else {
      console.log("proName为null");
      res.send("0");
    }
  });
});

// 更新项目
app.post("/admin/update", (req, res, next) => {
  console.log("编辑成员", req.body, req);
  let t = req.body._id;
  // 先判断有没有，不然会报错
  projects.findOne({ _id: t }, (err, tm) => {
    if (err) {
      throw err;
    }
    if (tm !== null) {
      //findone 和find 返回值有区别，当找不到时 find返回空数组，findone返回null
      projects.updateOne({ _id: t }, req.body, (err, docs) => {
        if (err) {
          res.send("0");
        }
        /**更新数据成功，紧接着查询数据 */
        projects.findOne({ _id: t }, (err, t) => {
          if (err) {
            res.send("0");
          }
          res.json(t);
        });
      });
    } else {
      console.log("没找到目标项");
      res.send("0");
    }
  });
});

//删除项目
app.delete("/userDelete/:_id", (req, res) => {
  let query = { _id: req.params._id };
  projects.deleteOne(query, (err, user) => {
    if (err) {
      throw err;
    }
    res.json(user);
  });
});

// 添加项目
app.post("/project/add", (req, res) => {
  projects.create(req.params, (err, user) => {
    if (err) {
      //console.log(err);
      throw err;
    }
    if (user) {
      console.log("队长注册成功");
    } else {
      console.log("队长注册失败");
    }
  });
});





app.listen(5000);
console.log("Running on port 5000...");
