var express = require("express");
var app = express();
var cookieParser = require("cookie-parser");

app.use(express.json(), cookieParser());

var monk = require("monk");
var db = monk("127.0.0.1:27017/assignment1");
var ObjectId = require("mongodb").ObjectId;

app.use(express.static("public"), function (req, res, next) {
  req.db = db;
  next();
});

app.get("/load", (req, res) => {
  if (req.cookies.user_id) {
    let db = req.db;
    let col = db.get("userList");

    col.find({ _id: req.cookies.user_id }).then((docs) => {
      let name = docs[0]["username"];
      let friends = docs[0]["friends"];

      let jsonStr = `{"username": "${name}", "friends": []}`;
      let obj = JSON.parse(jsonStr);

      for (let i = 0; i < friends.length; i++) {
        let friendObject = {};

        col.find({ username: friends[i] }).then((docs) => {
          friendObject.name = docs[0]["username"];
          friendObject.id = docs[0]["_id"];
          obj["friends"].push(friendObject);
          if (i == friends.length - 1) {
            res.json(obj);
          }
        });
      }
    });
  } else {
    res.send("");
  }
});

app.post("/login", express.urlencoded({ extended: true }), (req, res) => {
  let name = req.body.username;
  let pw = req.body.password;
  let db = req.db;
  let col = db.get("userList");

  col.find({ username: name }).then((docs) => {
    if (docs.length != 0 && docs[0]["password"] == pw) {
      res.cookie("user_id", docs[0]["_id"], { maxAge: 1800000 });
      let friends = docs[0]["friends"];
      let jsonStr = `{"username": "${name}", "friends": []}`;
      let obj = JSON.parse(jsonStr);

      for (let i = 0; i < friends.length; i++) {
        let friendObject = {};

        col.find({ username: friends[i] }).then((docs) => {
          friendObject.name = docs[0]["username"];
          friendObject.id = docs[0]["_id"];
          obj["friends"].push(friendObject);
          if (i == friends.length - 1) {
            res.json(obj);
          }
        });
      }
    } else {
      res.send("Login failure");
    }
  });
});

app.get("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.send("");
});

app.get("/getalbum", (req, res) => {
  let db = req.db;
  let col = db.get("mediaList");

  let id;
  let page = req.query.pagenum;

  if (req.query.userid == 0) {
    id = new ObjectId(req.cookies.user_id);
  } else {
    id = new ObjectId(req.query.userid);
  }

  col.find({ userid: id }).then((docs) => {
    let total = docs.length;
    let pageNum = Math.ceil(total / 4);

    let jsonStr = `{"pageNum": ${pageNum}, "data": []}`;
    let jsonObj = JSON.parse(jsonStr);

    for (let i = page * 4; i < total && i < page * 4 + 4; i++) {
      let mediaObj = {};
      mediaObj.id = docs[i]._id;
      mediaObj.url = docs[i].url;
      mediaObj.likedby = docs[i].likedby;

      jsonObj["data"].push(mediaObj);
    }

    jsonStr = JSON.stringify(jsonObj);
    res.send(jsonStr);
  });
});

app.post("/postlike", express.urlencoded({ extended: true }), (req, res) => {
  let db = req.db;
  let mediaList = db.get("mediaList");
  let userList = db.get("userList");
  let mediaId = req.body.photovideoid;

  mediaList.find({ _id: mediaId }).then((docs) => {
    let id = new ObjectId(req.cookies.user_id);
    userList.find({ _id: id }).then((user) => {
      let name = user[0]["username"];
      let query = { _id: mediaId };
      let likedBy = docs[0]["likedby"];
      let i = likedBy.indexOf(name);
      if (i !== -1) {
        likedBy.splice(i, 1);
      } else {
        likedBy.push(name);
      }

      let value = { $set: { likedby: likedBy } };
      mediaList.update(query, value, function (err, r) {
        if (err) throw err;
        res.send(likedBy);
      });
    });
  });
});

var server = app.listen(8081, () => {
  var host = server.address().address;
  var port = server.address().port;
  console.log("lab5 app listening at http://%s:%s", host, port);
});
