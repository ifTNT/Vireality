var express = require("express");
var router = express.Router();
const User = require('../models/user_schema');

/* [TODO]:送交友申請到被申請人的聊天室 */
router.post("/:targetUid/friend_request", function(req, res, next) {
  // Pre condition
  if (req.params.targetUid === undefined || req.query.uid === undefined) {
    res.json({ ok: false });
    return;
  }
  res.json({
    ok: true
  });


  
});

/* 回覆文章至作者聊天室 */
router.post("/:targetUid/response", function(req, res, next) {
  // Pre condition
  if (
    req.params.targetUid === undefined ||
    req.query.uid === undefined ||
    req.query.articleId === undefined ||
    req.query.message === undefined
  ) {
    res.json({ ok: false });
    return;
  }
  res.json({
    ok: true
  });
});
module.exports = router;
