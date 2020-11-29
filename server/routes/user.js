var express = require("express");
var router = express.Router();
const User = require("../models/user_schema");
const Friendship = require("../models/friendship_schema");
const HashMethod = require("hash-anything").sha1;
const imgur = require("./token");
const request = require("request");

/* 前端也要會抓session userid。當交友完畢後 記得session user and target user 的friendlist要加上他*/
/* [TODO]:have some error for client */
/* 給定使用者ID，取得該使用者的個人資料(名字、興趣、一句話)。 */
router.get("/:id/info", async function (req, res, next) {
  try {
    if (req.params.id === undefined) {
      throw "No target user id.";
    }
    session_uid = req.session.user_id;
    if (session_uid === undefined) {
      throw "uid is undefined.";
    }

    uid = req.params.id;
    let err,
      info = await User.find({
        user_id: uid
      });
    if (err) {
      throw "Find User info has error.";
    }
    if (info.length === 0) {
      throw "No this user.";
    }
    /* 當登入的使用者與request的userid 一樣，則按鈕要顯示編輯(4) */
    if (session_uid === uid) {
      res.json({
        ok: "true",
        nickName: info[0].nickname,
        interest: info[0].interest,
        intro: info[0].intro,
        friendship_state: 4,
      });
      return;
    }
    /* 確定是不是已經是朋友,顯示聊天室(3) */

    info[0].friend_list.forEach((person) => {
      console.log("friend_list:", person);
      if (session_uid === person) {
        res.json({
          ok: "true",
          nickName: info[0].nickname,
          interest: info[0].interest,
          intro: info[0].intro,
          friendship_state: 3,
        });
      }
      return;
    });
    let friendship;
    //0:交友申請，都沒有就會是這個，不存DB 1:送出交友申請 2:收到交友申請,資料庫不存入 3:聊天室,用USER SCHEMA確認，不存DB 4:編輯,資料庫不存入
    /* 有人發送交友給session id 或是 session id有發送 */
    err,
    (friendship = await Friendship.find({
      $or: [{
        send_user_id: session_uid
      }, {
        target_user_id: session_uid
      }],
    }));
    if (err) {
      throw "Find target user friendship has error.";
    }
    /* 當session id 不存在朋友關係的DB中 */
    if (friendship.length === 0) {
      res.json({
        ok: "true",
        nickName: info[0].nickname,
        interest: info[0].interest,
        intro: info[0].intro,
        friendship_state: 0,
      });
      return;
    }
    /* 當有的話 查看該session id 是發送端 還是 接受端 */
    console.log(friendship);
    let state = 0;
    friendship.forEach((person) => {
      if (
        person.send_user_id === session_uid &&
        person.target_user_id === uid
      ) {
        state = person.status; //已送出(1))
      } else if (
        person.send_user_id === uid &&
        person.target_user_id === _uid
      ) {
        state = person.status + 1; //已送出(1+1=2)
      }
    });
    console.log("Send!");
    res.json({
      ok: "true",
      nickName: info[0].nickname,
      interest: info[0].interest,
      intro: info[0].intro,
      friendship_state: state,
    });
  } catch (e) {
    console.log(e);
    res.json({
      ok: "false",
      result: []
    });
  }
});

/* 給定使用者ID，取得該使用者的大頭照。*/
router.get("/:id/avatar", function (req, res, next) {
  if (req.params.id === undefined) {
    res.json({
      ok: "false",
      result: []
    });
    return;
  }
  User.find({
    user_id: req.params.id
  }, function (err, pic) {
    if (err) {
      console.log(err);
      res.json({
        ok: "false",
        result: []
      });
      return;
    }
    // console.log("Result :\n", pic)
    if (pic.length !== 0) {
      console.log("Send!");
      // console.log(pic[0].avator)
      res.json({
        ok: "true",
        avatar: pic[0].avator,
      });
    } else {
      res.json({
        ok: "false",
        result: []
      });
    }
  });
});

/* 取得使用者好友位置 */
/* for each方式 =>先取得friend_list再針對每個人抓經緯度後計算距離後回傳 */
router.get("/friend_direction", async function (req, res, next) {
  try {
    if (req === undefined) {
      throw "requst is undefined.";
    }
    /*---- Find Session uid ----*/
    console.log(req.sessionID);
    console.log(req.session);
    uid = req.session.user_id;
    console.log(uid);
    if (uid === undefined) {
      throw "uid is undefined.";
    }

    /*---- Find user's friend list ----*/
    let err,
      user = await User.find({
        user_id: uid
      });
    if (err) {
      throw err;
    }
    if (user.length === 0) {
      throw "NO user";
    }
    console.log(user[0].friend_list);

    /*---- Find friend's info  ----*/
    let friend;
    err, (friend = await User.find({
      user_id: user[0].friend_list
    }));
    // console.log("friend",friend)
    if (err) {
      throw err;
    }
    /*---- Find friend's direction and response  ----*/
    result_dir = [];
    friend.forEach((target) => {
      console.log(target.location);
      var lon = target.location.longitude - user[0].location.longitude;
      var lat = target.location.latitude - user[0].location.latitude;

      // 麥卡托
      var earthRad = 6378137.0;
      x = ((lon * Math.PI) / 180) * earthRad;
      var a = (lat * Math.PI) / 180;
      y = (earthRad / 2) * Math.log((1.0 + Math.sin(a)) / (1.0 - Math.sin(a)));
      console.log("x", x, ",y", y);

      var direction = Math.atan2(y, x);

      result_dir.push({
        id: target.user_id,
        dir: direction
      });
    });
    console.log("result_dir", result_dir);
    res.json({
      ok: "true",
      result: result_dir,
    });
  } catch (e) {
    console.log(e);
    res.json({
      ok: "false",
      result: []
    });
  }
});

/* 使用者登入 */
router.post("/login", function (req, res, next) {
  if (req.body.uid === undefined || req.body.password === undefined) {
    res.json({
      ok: "false",
      result: []
    });
    return;
  }
  const hashPW = HashMethod(req.body.password);
  User.find({
    user_id: req.body.uid
  }, function (err, user) {
    if (err) {
      console.log(err);
      res.json({
        ok: "false",
        result: []
      });
      return;
    }
    console.log("Result :\n", user);
    // console.log(typeof(hashPW))
    // console.log(typeof(user[0].password))
    if (user.length === 0) {
      return res.json({
        ok: "false",
        result: "帳號錯誤"
      });
    }
    if (user.length !== 0 && hashPW === user[0].password) {
      req.session.user_id = req.body.uid;
      req.session.authenticated = true;
      return res.json({
        ok: "true",
      });
    } else {
      return res.json({
        ok: "false",
        result: "密碼錯誤"
      });
    }
  });
});

router.post("/findAccount", function (req, res, next) {
  if (req === undefined) {
    res.json({
      ok: "false"
    });
  }
  /*---- User's Account whether exist----*/
  console.log(req.body);
  User.find({
    user_id: req.body.uid
  }, function (err, person) {
    if (err) {
      res.json({
        ok: "false"
      });
    }
    console.log("Result :\n", person);
    if (person.length !== 0) {
      res.json({
        ok: "false"
      });
    } else {
      res.json({
        ok: "true",
      });
    }
  });
});

router.post("/createAccount", async function (req, res, next) {
  if (req === undefined) {
    res.json({
      ok: "false"
    });
  }
  /*---- User's Account whether exist----*/
  /*
    uid: this.userId,
    password:this.password,
    nickname:this.nickname,
    birthday:this.birthday,
    interest:this.interest,
    intro:this.intro,
    avator:this.img
  */
  /* Transfer password to hash */
  const hashPW = HashMethod(req.body.password);
  //[TODO]:faceID
  let insertObj = {
    user_id: req.body.uid,
    password: hashPW,
    birthday: req.body.birthday,
    join_time: Date.now(),
  };
  if (req.body.interest !== "") {
    insertObj["interest"] = req.body.interest;
  }
  if (req.body.intro !== "") {
    insertObj["intro"] = req.body.intro;
  }
  if (req.body.nickname !== "") {
    insertObj["nickname"] = req.body.nickname;
  }

  try {
    if (req.body.avator !== "https://i.imgur.com/WinIC3F.png") {
      options = {
        method: "POST",
        url: "https://api.imgur.com/3/image",
        headers: {
          Authorization: "Bearer " + imgur.token,
        },
        formData: {
          image: req.body.avator.split(",")[1],
        },
      };

      const imgurURL = await new Promise((resolve, reject) => {
        request(options, (error, response) => {
          if (error) {
            reject();
          }
          const imgurRes = response.body;
          const imgurURL = JSON.parse(imgurRes).data.link;
          resolve(imgurURL);
        });
      });
      insertObj["avator"] = imgurURL;
    }
    const userData = [insertObj];
    console.log(userData);
    User.insertMany(userData, (err, users) => {
      if (err) {
        return console.error(err);
      } else {
        req.session.user_id = req.body.uid;
        res.json({
          ok: "true",
        });
      }
    });
  } catch (err) {
    res.json({
      ok: "false"
    });
  }
});

router.get("/state", function (req, res, next) {
  let user_id = req.session.user_id;
  if (user_id !== undefined) {
    res.json({
      logined: true,
      user_id
    });
  } else {
    res.json({
      logined: false
    });
  }
});

// 更新帳號資料
router.post("/editAccount", async function (req, res, next) {
  if (req === undefined) {
    res.json({
      ok: "false"
    });
  }
  let insertObj = {
    interest: req.body.interest,
    intro: req.body.intro,
    nickname: req.body.nickname,
  };
  User.update({
    user_id: req.session.user_id
  }, insertObj, (err, users) => {
    if (err) {
      return console.error(err);
    } else {
      res.json({
        ok: "true",
      });
    }
  });
});

// 新增好友 req.body.target_user_id
router.post("/ddFriend", async function (req, res, next) {
  if (req === undefined) {
    res.json({
      ok: "false"
    });
  }
  User.update({
    user_id: req.session.user_id
  }, {
    $push: {
      friend_list: req.body.target_user_id
    }
  }, (err, users) => {
    if (err) {
      return console.error(err);
    } else {
      res.json({
        ok: "true",
      });
    }
  });
});

module.exports = router;