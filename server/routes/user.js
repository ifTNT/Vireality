var express = require("express");
var router = express.Router();
const User = require('../models/user_schema');

/* 給定使用者ID，取得該使用者的個人資料(名字、興趣、一句話)。 */
router.get("/:id/info", function(req, res, next) {
  if (req.params.id === undefined) {
    res.json({ ok: false });
    return;
  }
  User.find({user_id: req.params.id}, function (err, info) {
    if (err) {
      console.log(err)
      return;
    } 
    console.log("Result :\n", info)
    if (info.length !== 0) {
      let isFriend = false
      info[0].friend_list.forEach(person => {
        if(req.params.id === person)
            isFriend = true
      });
      console.log("Send!")
      res.json({
        ok: "true",
        nickName: info[0].nickname,
        interest: info[0].interest,
        intro: info[0].intro,
        isFriend: isFriend
      });
    }
    
  });
});


/* 給定使用者ID，取得該使用者的大頭照。*/
router.get("/:id/avatar", function(req, res, next) {
  if (req.params.id === undefined) {
    res.json({ ok: false });
    return;
  }
  User.find({user_id: req.params.id}, function (err, pic) {
    if (err) {
      console.log(err)
      return;
    } 
    console.log("Result :\n", pic)
    if (pic.length !== 0) {
      console.log("Send!")
      // console.log(pic[0].avator)
      res.json({
        ok: "true",
        avatar:pic[0].avator
      });
    }
  });

});

/* 取得使用者好友位置 */
/* [TODO]:還沒做 for each方式 =>先取得friend_list再針對每個人抓經緯度後計算距離後回傳 */
router.get("/friend_direction", function(req, res, next) {
  if (req === undefined) {
    res.json({ ok: false });
    return;
  }

  User.find({user_id: req.params.id}, function (err, pic) {
    if (err) {
      console.log(err)
      return;
    } 
    console.log("Result :\n", pic)
    if (pic.length !== 0) {
      console.log("Send!")
      // console.log(pic[0].avator)
      res.json({
        ok: "true",
        avatar:pic[0].avator
      });
    }
  });

  /* --- 計算方式 --- */
  /*
    var lon1,lon2;
    var lat1,lat2;
    // dir是輸出的弧度
    var dir = Math.atan2(
        lon2-lon1,
        Math.log(Math.tan(Math.PI/4+lan2/2))
        - Math.log(Math.tan(Math.PI/4+lan1/2))
  )*/
  res.json({
    ok: "true",
    result:[
      {
        id:"123",
        dir:0.3418
      },
      {
        id:"1234",
        dir:3.3218
      },
      {
        id:"12345",
        dir:1.3318
      },
      {
        id:"123456",
        dir:2.3518
      }
    ]
  });
});

module.exports = router;
