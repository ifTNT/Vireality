var express = require("express");
var router = express.Router();
const User = require('../models/user_schema');

/* [TODO]:送交友申請到被申請人的聊天室 */
/* 交友發送=>更改friendship 交友接受=>更改雙方user schema的friend_list*/
router.post("/:targetUid/friend_request", function(req, res, next) {
  // Pre condition
  var uid = req.session.user_id;
  if (req.params.targetUid === undefined || uid === undefined) {
    res.json({ ok: "false", result: []});
    return;
  }
  /*  uid 現有的friend_list內新增一筆資料 */ 
  User.update({
    user_id: uid
  }, {
    $push: {
      friend_list: req.params.targetUid
    }
  }, (err, users) => {
    if (err) {
      return console.error(err);
    } else {
      res.json({
        ok: "true",
        result:[]
      });
    }
  });
  // User.find({user_id: uid}, function (err, person) {
  //   if (err) {
  //     console.log(err);
  //     res.json({
  //       ok: "false",
  //       result: []
  //     });
  //     return;
  //   }
  //   console.log("Result :\n", person)
  //   if (person.length !== 0) {
  //     console.log("Send!");
  //     res.json({
  //       ok: "true",
  //     });
  //   } else {
  //     res.json({
  //       ok: "false",
  //       result: []
  //     });
  //   }
  // });
  // res.json({
  //   ok: "true", 
  //   result: []
  // }); 
});

/* 回覆文章至作者聊天室 */
// router.post("/:targetUid/response", function(req, res, next) {
//   // Pre condition
//   if (
//     req.params.targetUid === undefined ||
//     req.query.uid === undefined ||
//     req.query.articleId === undefined ||
//     req.query.message === undefined
//   ) {
//     res.json({ ok: false });
//     return;
//   }
//   res.json({
//     ok: true
//   });
// });
module.exports = router;
