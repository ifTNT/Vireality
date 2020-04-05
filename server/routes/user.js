var express = require("express");
var router = express.Router();

/* 給定使用者ID，取得該使用者的個人資料(名字、興趣、一句話)。 */
router.get("/:id/info", function(req, res, next) {
  if (req.params.id === undefined) {
    res.json({ ok: false });
    return;
  }
  res.json({
    ok: "true",
    nickName: "王小明",
    interest: "打籃球",
    intro: "我就爛"
  });
});


/* 給定使用者ID，取得該使用者的大頭照。*/
router.get("/:id/avatar", function(req, res, next) {
  if (req.params.id === undefined) {
    res.json({ ok: false });
    return;
  }
  res.json({
    ok: "true",
    avatar: "https://i.imgur.com/07XbOpL.png"
  });
});

module.exports = router;
