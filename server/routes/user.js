var express = require("express");
var router = express.Router();
const User = require('../models/user_schema');

/* 給定使用者ID，取得該使用者的個人資料(名字、興趣、一句話)。 */
router.get("/:id/info", function(req, res, next) {
  if (req.params.id === undefined) {
    res.json({ ok: false });
    return;
  }
  /* [TODO]:抓session userid，Friendship Scheme */
  User.find({user_id: req.params.id}, function (err, info) {
    if (err) {
      console.log(err)
      return;
    } 
    // console.log("Result :\n", info)
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
    // console.log("Result :\n", pic)
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
/* for each方式 =>先取得friend_list再針對每個人抓經緯度後計算距離後回傳 */
router.get("/friend_direction", async function(req, res, next) {
  try{
    if (req === undefined) { throw "requst is undefined."}
    /*---- Find Session uid ----*/
    // req.session.user_id = "a123"
    // console.log(req.session)
    uid = req.session.user_id
    console.log(uid)
    if(uid === undefined){ throw "uid is undefined."}

    /*---- Find user's friend list ----*/
    let err,user = await User.find({user_id: uid})
    if (err) { throw err}
    if(user.length === 0 ) { throw "NO user" }
    console.log(user[0].friend_list)

    /*---- Find friend's info  ----*/
    let friend
    err,friend = await User.find({user_id: user[0].friend_list})
    // console.log("friend",friend)
    if (err) { throw err}

    /*---- Find friend's direction and response  ----*/
    result_dir = []
    friend.forEach(target =>{
      console.log(target.location)
      var lon = target.location.longitude - user[0].location.longitude
      var lat = target.location.latitude - user[0].location.latitude

      // 麥卡托
      var earthRad = 6378137.0;
      x = lon * Math.PI / 180 * earthRad;
      var a = lat * Math.PI / 180;
      y = earthRad / 2 * Math.log((1.0 + Math.sin(a)) / (1.0 - Math.sin(a)));
      console.log("x",x,",y",y)

      var direction = Math.atan2(y,x)

      result_dir.push({id:target.user_id , dir: direction })
    });
    console.log("result_dir",result_dir)
    res.json({
      ok: "true",
      result:result_dir
    });
  }
  catch(e){
    console.log(e)
    res.json({ ok: false ,result: []});
  }
});

module.exports = router;
