var express = require("express");
var router = express.Router();

/* 回傳詳細文章內容(作者資料、文章圖片、文章文字內容、發文時間) */
router.get("/:id", function(req, res, next) {
  if (req.params.id === undefined) {
    res.json({
      ok: "false"
    });
  }
  res.json({
    ok: "true",
    thumbnail: [
      "https://i.imgur.com/07XbOpL.png",
      "https://i.imgur.com/07XbOpL.png",
      "https://i.imgur.com/07XbOpL.png"
    ],
    text: "loren blablablablablabla",
    postTime: "1585388087376",
    isStory: "true",
    author: "test"
  });
});

/* 上傳文章 */
router.post("/post", function(req, res, next) {
  if (
    req.query.uid === undefined ||
    req.query.lon === undefined ||
    req.query.lat === undefined
  ) {
    res.json({ ok: false });
    return;
  }
  res.json({ ok: true });
});
module.exports = router;
