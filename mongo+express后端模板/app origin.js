const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const mineType = require("mime-types");
var multiparty = require("multiparty");
const { exec } = require("child_process");
const multer = require('multer');
var iconv = require("iconv-lite");
var encoding = "cp936";
var binaryEncoding = "binary";

users = require("./models/users");
projects = require("./models/projects");
suportrecords = require("./models/suportrecords");
buyRecords = require("./models/buyRecords");
receive = require("./models/receive");

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

function imgToBase64(url) {
  try {
    let imgurl = url;
    let imageData = fs.readFileSync(imgurl); //从根目录访问
    if (!imageData) return "";
    let bufferData = Buffer.from(imageData).toString("base64");
    let base64 = "data:" + mineType.lookup(imgurl) + ";base64," + bufferData;
    return base64;
  } catch (error) {
    return "";
  }
}

//TODO:怎么经常去更新这个元素在新arr里的位置？这里的bug因为上面的i就是固定的了，不会因为arr减少而减少
function TEST_getTitleAndLink(targetText) {
	console.log('%c targetText', 'color: red', targetText);
  //const targetText = '关于启动浙江财经大学第十八届大学生电子商务竞赛 ... https://jwc.zufe.edu.cn/sanji-content.jsp?urltype=news.NewsContentUrl&wbtreeid=1082&wbnewsid=8035';
  
  function getTL(arrTL){
	// console.log('%c arrTL', 'color: red', arrTL);
	let obj = {}
	try {
		if(arrTL.length == 3){
			obj = {
				title: arrTL.slice(0, 2).join(" "),
				link: arrTL[2]
			}; 
		} else {
			obj = {
				title: arrTL[0],
				link: arrTL[1]
			}
		}
	} catch (error) {
		console.log(error);
		console.log('%c arrTL', 'color: blue', arrTL);
	}
	
	
	return obj;
  }

  const arr = targetText.split(" ");
  const tempArr = [];
  let length = 0;
  let temp = [];
  const tempTitles = [];
  const tempLink = [];
  const gtx = /[\u4e00-\u9fff]+/

  console.log('%c arr', 'color: red', arr);
  for (let i = 0; i < arr.length; i++) {
	if(arr[i].indexOf("https") > -1){
		tempLink.push(arr[i]);
		// temp = arr.splice(0, i+1 - length);
		// length = length + temp.length;
		// tempArr.push(temp) // TODO:怎么经常去更新这个元素在新arr里的位置？这里的bug因为上面的i就是固定的了，不会因为arr减少而减少
		// console.log('%c length', 'color: yellow', length, i+1 - length);
		// console.log('%c tempArr', 'color: yellow', tempArr);
	} else if(gtx.test(arr[i]) || arr[i].indexOf("赛") > -1 || arr[i].indexOf("赛") > -1 ){
		tempTitles.push(arr[i]);
	}
	console.log('%c tempTitles', 'color: yellow', tempTitles);
	console.log('%c tempLink', 'color: yellow', tempLink);
  }
  
  
  const newArr = [];

  for (let i = 0; i < tempArr.length; i++) {
	newArr.push(getTL(tempArr[i]))
  }

  return newArr;
}

function getTitleAndLink(targetText) {
	console.log('%c targetText', 'color: red', targetText);
  //const targetText = '关于启动浙江财经大学第十八届大学生电子商务竞赛 ... https://jwc.zufe.edu.cn/sanji-content.jsp?urltype=news.NewsContentUrl&wbtreeid=1082&wbnewsid=8035';

  const arr = targetText.split(" ");
  const tempArr = [];
  let length = 0;
  let temp = [];
  const tempTitles = [];
  const tempLink = [];
  const gtx = /[\u4e00-\u9fff]+/

  console.log('%c arr', 'color: red', arr);
  for (let i = 0; i < arr.length; i++) {
	if(arr[i].indexOf("https") > -1){
		tempLink.push(arr[i]);
	} else if(gtx.test(arr[i]) || arr[i].indexOf("赛") > -1 || arr[i].indexOf("赛") > -1 ){
		tempTitles.push(arr[i]);
	}
  }

  return {titles: tempTitles, links: tempLink};
}

function getNotices() {
  // 在Node.js中执行Python脚本
  let res = "";
  // let cmd = 'pip install requests --user && pip install bs4 --user && python ./public/爬取通知.py '
  let cmd = "python ./public/爬取通知.py ";

  function myAsyncFunction() {
    return new Promise(function (resolve, reject) {
      exec(cmd, { encoding: binaryEncoding }, (error, stdout, stderr) => {
        if (error) {
          console.error(`执行Python脚本时出错： ${error}`);
          console.error(
            iconv.decode(Buffer.from(stderr, binaryEncoding), encoding)
          );
          reject(error);
        }
        // 打印输出
        const res = iconv.decode(Buffer.from(stdout, binaryEncoding), encoding);
        resolve(res);
      });
    });
  }
  return myAsyncFunction();
}

//===============链接到mongodb==================//

mongoose.connect('mongodb://localhost/competStore');
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
  
  getNotices()
    .then(function (result) {
      	res.send(result);
    })
    .catch(function (error) {
      console.error(error); // 处理错误
    });
});

//登录
app.post(`/login`, (req, res) => {
  var t = req.body;
  users.findOne({ name: t.userName, pass: t.passWord }, (err, user) => {
    if (err) {
      //console.log(err);
      throw err;
    }
    if (user) {
      res.send("登录成功");
    } else {
      res.send("登录失败");
    }
  });
});

//登录
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

//注册
app.post(`/register`, (req, res) => {
  var t = req.body;
  const params = {
    name: t.userName,
    pass: t.passWord,
    supproject: [],
    buyproject: [],
    iftruename: false,
  };
  users.create(params, (err, user) => {
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
});

//删除用户信息
app.delete("/userDelete/:_id", (req, res) => {
  var query = { _id: req.params._id };
  users.deleteOne(query, (err, user) => {
    if (err) {
      throw err;
    }
    res.json(user);
  });
});

// ===============通知爬虫==================//
app.get("/mainStd/notice", (req, res) => {
  // res.send('welconm');
  getNotices()
    .then(function (result) {
      	res.send(getTitleAndLink(result.substr(1)));
    })
    .catch(function (error) {
      console.error(error); // 处理错误
    });
});

// TODO:===============支持记录==================//

//查询支持记录
app.get("/projects/suportRecord/:projectName", (req, res, next) => {
  console.log("搜索项目的支持记录");
  suportrecords.find({ proName: req.params.projectName }, (err, projectRc) => {
    console.log(projectRc);
    if (err) {
      throw err;
    }
    if (projectRc) {
      //findone 和find 返回值有区别，当找不到时 find返回空数组，findone返回null
      console.log("proName不为null");
      res.json(projectRc);
    } else {
      console.log("proName为null");
      res.send("未找到相关信息");
    }
  });
});

//添加用户支持记录
app.post("/projects/suportRecord/add", (req, res, next) => {
  console.log("添加用户支持记录,即用户支持了事情");
  //req.body test {"proName":"hahaha","userName":"wu","suportTime":"","suportMoney":131}
  suportrecords.create(req.body, (err, userSuport) => {
    console.log(userSuport);
    if (err) {
      throw err;
    }
    if (userSuport) {
      //findone 和find 返回值有区别，当找不到时 find返回空数组，findone返回null
      console.log("用户支持");
      res.json("支持成功");
    } else {
      console.log("用户支持失败");
      res.send("支持失败");
    }
  });
});


// 配置 multer
const upload = multer({
  storage: multer.memoryStorage() // 把文件存储在内存中
});

// 处理文件上传请求
app.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file; // 获取上传的文件
  const fileData = file.buffer; // 获取上传文件的二进制数据
  // 将二进制数据写入到数据库中
  res.send({ message: 'File uploaded successfully' });
});




// TODO:===============订单记录==================//

// //查询订购记录
// app.get('/projects/buyRecord/:projectName', (req, res, next) => {
// 	console.log('搜索项目的支持记录')
// 	buyRecords.find({ "proName": req.params.projectName }, (err, projectRc) => {
// 		console.log(projectRc)
// 		if (err) {
// 			throw err;
// 		}
// 		if (projectRc) { //findone 和find 返回值有区别，当找不到时 find返回空数组，findone返回null
// 			console.log('proName不为null');
// 			res.json(projectRc);
// 		}
// 		else {
// 			console.log('proName为null');
// 			res.send("未找到相关信息")
// 		}
// 	});
// });

//查询用户的所有订购记录
app.get("/projects/buyRecord/:userName", (req, res, next) => {
  console.log("搜索项目的支持记录");
  buyRecords.find({ userName: req.params.userName }, (err, RcArr) => {
    console.log(RcArr);
    if (err) {
      throw err;
    }
    if (RcArr.length !== 0) {
      //findone 和find 返回值有区别，当找不到时 find返回空数组，findone返回null
      console.log("RcArr不为null", RcArr);
      res.json(RcArr);
    } else {
      console.log("RcArr为null");
      res.send("未找到相关信息");
    }
  });
});

//添加用户订购记录
app.post("/projects/buyRecord/add", (req, res, next) => {
  console.log("添加用户支持记录,即用户支持了事情");
  //req.body test {"proName":"hahaha","userName":"wu","suportTime":"","suportMoney":131}
  buyRecords.create(req.body, (err, userSuport) => {
    console.log(userSuport);
    if (err) {
      throw err;
    }
    if (userSuport) {
      //findone 和find 返回值有区别，当找不到时 find返回空数组，findone返回null
      console.log("用户支持");
      res.json("支持成功");
    } else {
      console.log("用户支持失败");
      res.send("支持失败");
    }
  });
});

//===============项目==================//

function readFiles(pathName, obj) {
  return new Promise((resolve) => {
    fs.readdir(pathName, (err, files) => {
      var dirs = files;
      obj.firstImg = dirs;
      console.log("promise中");
      resolve("done");
    });
  });
}

async function addImgUrl(list, res) {
  for (let j = 0; j < list.length; j++) {
    let pathName = "./public/test/" + list[j].name;
    console.log("promise前");
    await readFiles(pathName, list[j].name);
    console.log("promise后");
  }
  console.log("发送请求", list[0]);
  res.send(list);
}

//查询所有项目
app.get("/projects/search/all", (req, res, next) => {
  console.log("搜索所有项目");
  var resp = {};
  projects.find((err, project) => {
    if (err) {
      throw err;
    }
    // addImgUrl(project,res)
    res.send(project);
  });
});

//按项目名查询单个项目
app.post("/projects/search/name", (req, res, next) => {
  console.log("搜索单个项目");
  let t = req.body;
  projects.findOne({ name: t.proName }, (err, project) => {
    if (err) {
      throw err;
    }
    if (project) {
      //findone 和find 返回值有区别，当找不到时 find返回空数组，findone返回null
      console.log("proName不为null");
      res.json(project);
    } else {
      console.log("proName为null");
      res.send("未找到相关信息");
    }
  });
});

//按用户名查询项目
app.post("/projects/search/owner", (req, res, next) => {
  let t = req.body;
  projects.find({ owner: t.owner }, (err, project) => {
    if (err) {
      throw err;
    }
    if (project.length != 0) {
      //findone 和find 返回值有区别，当找不到时 find返回空数组，findone返回null
      res.json(project);
    } else {
      res.send("未找到相关信息");
    }
  });
});

//按名字给项目添加支持，post
app.post("/projects/suport", (req, res, next) => {
  console.log("搜索单个项目");
  let t = req.body;
  console.log(t);
  projects.findOne({ name: t.name }, (err, project) => {
    if (err) {
      throw err;
    }
    if (project != null) {
      //findone 和find 返回值有区别，当找不到时 find返回空数组，findone返回null
      let num = project.moneyHave + t.num;
      projects.updateOne({ name: t.name }, { moneyHave: num }, (err, docs) => {
        if (err) {
          res.json("支持失败");
        }
        /**更新数据成功，紧接着查询数据 */
        projects.findOne({ name: t.name }, (err, p) => {
          if (err) {
            res.json("支持失败");
          }
          res.json(p.moneyHave);
        });
      });
    } else {
      console.log("proName为null");
      res.send("未找到相关信息");
    }
  });
});

//按名字给项目添加支持
app.get("/projects/suport/:name", (req, res, next) => {
  console.log("用户添加支持");
  let t = req.params.name;
  projects.findOne({ name: t }, (err, project) => {
    if (err) {
      throw err;
    }
    if (project !== null) {
      //findone 和find 返回值有区别，当找不到时 find返回空数组，findone返回null
      console.log("proName不为null");
      let num = project.suportNum + 1;
      projects.updateOne({ name: t }, { suportNum: num }, (err, docs) => {
        if (err) {
          res.json("支持失败");
        }
        /**更新数据成功，紧接着查询数据 */
        projects.findOne({ name: t }, (err, p) => {
          if (err) {
            res.json("支持失败");
          }
          res.json(p.suportNum);
        });
      });
    } else {
      console.log("proName为null");
      res.send("支持失败");
    }
  });
});

//按名字给项目添加访问量
app.get("/projects/view/:name", (req, res, next) => {
  console.log("用户添加支持");
  let t = req.params.name;
  projects.findOne({ name: t }, (err, project) => {
    if (err) {
      throw err;
    }
    if (project !== null) {
      //findone 和find 返回值有区别，当找不到时 find返回空数组，findone返回null
      console.log("proName不为null");
      console.log("proName不为null");
      let num = project.viewNum + 1;
      projects.updateOne({ name: t }, { viewNum: num }, (err, docs) => {
        if (err) {
          res.json("访问失败");
        }
        /**更新数据成功，紧接着查询数据 */
        projects.findOne({ name: t }, (err, p) => {
          if (err) {
            res.json("访问失败");
          }
          res.json(p.viewNum);
        });
      });
    } else {
      console.log("proName为null");
      res.send("访问成功");
    }
  });
});

//添加用户项目
app.post("/projects/addproject", (req, res, next) => {
  console.log("添加用户支持记录,即用户支持了事情");
  //req.body test {"name":"hahaha","description":"真的好啊錒","owner":"wu","moneyHave":1386,"moneyTarget":389260,"timeStart":"","timeEnd":"","suportNum":131,"suportBaseNum":786,"viewNum":699}

  //生成multiparty对象，并配置上传目标路径
  var form = new multiparty.Form({ uploadDir: "./public/test" });
  form.parse(req, function (err, fields, files) {
    if (err) {
      res.send(err);
    } else {
      console.log(fields, "fields");
      console.log(files, "files");
      fs.mkdir("./public/test/" + fields.name[0], function (error) {
        if (error) {
          console.log(error);
          return false;
        }
        console.log("创建项目目录成功");
      });
      var j = 0;
      //重命名文件
      if (Object.keys(files).length != 0) {
        console.log("文件为", files);
        files.file.map((item) => {
          j++;
          //分割字符
          var path_arr = item.path.split("\\");
          var path_save =
            path_arr[0] +
            "\\" +
            path_arr[1] +
            "\\" +
            fields.name[0] +
            "\\" +
            "(" +
            j +
            ")" +
            item.originalFilename;
          //替换名字
          fs.renameSync(item.path, path_save);
        });
      }

      var obj = {};
      for (let key in fields) {
        console.log("key: " + key + "," + "value: " + obj[key]);
        console.log(fields[key][0]);
        obj[key] = fields[key][0];
      }
      obj.moneyHave = 0;
      obj.suportNum = 0;
      obj.viewNum = 0;

      console.log("obj", obj instanceof Object);

      projects.create(obj, (err, userSuport) => {
        console.log(userSuport);
        if (err) {
          throw err;
        }
        if (userSuport) {
          //findone 和find 返回值有区别，当找不到时 find返回空数组，findone返回null
          console.log("项目添加成功");
          res.json("添加成功");
        } else {
          console.log("项目添加失败");
          res.send("添加失败");
        }
      });
      // projects.create(fields, (err, userSuport) => {
      // 	console.log(userSuport)
      // 	if (err) {
      // 		throw err;
      // 	}
      // 	if (userSuport) { //findone 和find 返回值有区别，当找不到时 find返回空数组，findone返回null
      // 		console.log('项目添加成功');
      // 		res.json('添加成功');
      // 	}
      // 	else {
      // 		console.log('项目添加失败');
      // 		res.send("添加失败")
      // 	}
      // });
    }
    //...将文件路径和标题存入数据库
  });

  // //接收前台POST过来的base64
  // var imgData = req.body.imgData; //第一张图片为封面
  // var name = req.body.name;
  // //过滤data:URL
  // for (let i = 0; i < imgData.length; i++) {
  // 	var base64Data = imgData[i].replace(/^data:image\/\w+;base64,/, "");
  // 	var dataBuffer = Buffer.from(base64Data, 'base64');
  // 	fs.writeFile(`./image/${name}/image${i}.png`, dataBuffer, function (err) {
  // 		if (err) {
  // 			res.send(err);
  // 		} else {
  // 			console.log('保存成功！')
  // 			continue
  // 		}
  // 	});
  // }
});

//查看项目详情
app.get("/projects/detail/:name", (req, res) => {
  let pathName = "./public/test/" + req.params.name;
  console.log("pathName: ", pathName);
  var resp = {};
  var dirs = [];
  var img = [];
  fs.readdir(pathName, (err, files) => {
    dirs = files;
    if (dirs) {
      for (let i = 0; i < dirs.length; i++) {
        var base = imgToBase64(pathName + "/" + dirs[i]);
        img.push(base);
      }
    }

    projects.findOne({ name: req.params.name }, (err, project) => {
      if (err) {
        throw err;
      }
      if (project) {
        //findone 和find 返回值有区别，当找不到时 find返回空数组，findone返回null
        console.log("proName不为null");
        resp.img = img;
        resp.data = project;
        res.send(resp);
      } else {
        console.log("proName为null");
        res.send("未找到相关信息");
      }
    });
  });
});

//获取图片base64
app.get("/projects/imgurl/:name", (req, res) => {
  let pathName = "./public/test/" + req.params.name;
  console.log("pathName: ", pathName);
  var dirs = [];
  var img = [];
  fs.readdir(pathName, (err, files) => {
    dirs = files;
    for (let i = 0; i < dirs.length; i++) {
      var base = imgToBase64(pathName + "/" + dirs[i]);
      img.push(base);
    }
    res.send(img);
  });
});

//获取封面
app.get("/projects/firstimgurl/:name", (req, res) => {
  let pathName = "./public/test/" + req.params.name;
  console.log("pathName: ", pathName);
  var dirs = [];
  fs.readdir(pathName, (err, files) => {
    console.log("获取封面", files);
    if (files !== undefined) {
      dirs = files;
      var base = imgToBase64(pathName + "/" + dirs[0]);
      res.send(base);
    } else {
      res.send("未找到对应封面");
    }
    //前台就给封面设置一个state变量好了，然后监听这个state变量
  });
});

//删除用户项目
app.delete("/projects/:name", (req, res) => {
  var query = { name: req.params.name };
  projects.deleteOne(query, (err, project) => {
    if (err) {
      throw err;
    }
    res.json(project);
  });
});

// 编辑用户项目
app.post("/projects/edit", (req, res, next) => {
  console.log("编辑用户项目", req.body, req);
  let t = req.body._id;
  projects.findOne({ _id: t }, (err, project) => {
    if (err) {
      throw err;
    }
    if (project !== null) {
      //findone 和find 返回值有区别，当找不到时 find返回空数组，findone返回null
      console.log("proName不为null", req.body);
      console.log("proName不为null");
      projects.updateOne({ _id: t }, req.body, (err, docs) => {
        if (err) {
          res.json("访问失败");
        }
        /**更新数据成功，紧接着查询数据 */
        projects.findOne({ _id: t }, (err, p) => {
          if (err) {
            res.json("访问失败");
          }
          res.json("访问成功");
        });
      });
    } else {
      console.log("proName为null");
      res.send("访问失败");
    }
  });
});

// ----------------收货地址管理================//

// 用户名查询收货地址
app.post("/projects/receive/owner", (req, res, next) => {
  let t = req.body;
  receive.find({ owner: t.owner }, (err, project) => {
    if (err) {
      throw err;
    }
    if (project.length != 0) {
      //findone 和find 返回值有区别，当找不到时 find返回空数组，findone返回null
      res.json(project);
    } else {
      res.send("未找到相关信息");
    }
  });
});

//添加用户地址 TODO: 记得加上用户名
app.post("/projects/receive/add", (req, res, next) => {
  console.log("添加用户支持记录,即用户支持了事情");
  //req.body test {"proName":"hahaha","userName":"wu","suportTime":"","suportMoney":131}
  receive.create(req.body, (err, userSuport) => {
    console.log(userSuport);
    if (err) {
      throw err;
    }
    if (userSuport) {
      //findone 和find 返回值有区别，当找不到时 find返回空数组，findone返回null
      console.log("用户支持");
      res.json("支持成功");
    } else {
      console.log("用户支持失败");
      res.send("支持失败");
    }
  });
});

//删除用户地址
app.delete("/receive/:id", (req, res) => {
  var query = { _id: req.params._id };
  receive.deleteOne(query, (err, project) => {
    if (err) {
      throw err;
    }
    res.json(project);
  });
});

//编辑用户地址
app.post("/receive/edit", (req, res, next) => {
  console.log("编辑用户地址", req.body, req);
  let t = req.body._id;
  projects.findOne({ _id: t }, (err, project) => {
    if (err) {
      throw err;
    }
    if (project !== null) {
      //findone 和find 返回值有区别，当找不到时 find返回空数组，findone返回null
      console.log("proName不为null", req.body);
      console.log("proName不为null");
      projects.updateOne({ _id: t }, req.body, (err, docs) => {
        if (err) {
          res.json("访问失败");
        }
        /**更新数据成功，紧接着查询数据 */
        projects.findOne({ _id: t }, (err, p) => {
          if (err) {
            res.json("访问失败");
          }
          res.json("访问成功");
        });
      });
    } else {
      console.log("proName为null");
      res.send("访问失败");
    }
  });
});

app.listen(5000);
console.log("Running on port 5000...");
