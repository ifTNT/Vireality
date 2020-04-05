var express = require("express");
var router = express.Router();

/* 給定使用者經緯度，取得使用者附近(半徑10公尺的圓)文章列表，列表內有文章縮圖(有白邊)、發文座標和發文作者id。
若有給定篩選時間則再根據給定時間篩選 */
router.get("/geolocation", function(req, res, next) {
  //Precondition
  if (req.query.lon === undefined || req.query.lat === undefined) {
    res.json({
      ok: "false",
      result: []
    });
    return;
  }
  res.json({
    ok: "true",
    result: [
      {
        id: "0",
        thumbnail: "https://i.imgur.com/07XbOpL.png",
        lon: "122.339999",
        lat: "23.4999",
        author: "test"
      },
      {
        id: "1",
        thumbnail: "https://i.imgur.com/07XbOpL.png",
        lon: "122.339998",
        lat: "23.49989",
        author: "test"
      }
    ]
  });
});

/* 給定使用者ID，取得該使用者所發佈的文章列表，列表內有文章縮圖(有白邊)、發文座標、發文時間及是否爲限時動態。*/
router.get("/user/:id", function(req, res, next) {
  //Pre condition
  if (req.params.id === undefined) {
    res.json({
      ok: "false",
      result: []
    });
    return;
  }
  res.json({
    ok: "true",
    result: [
      {
        id: "0",
        thumbnail: "https://i.imgur.com/07XbOpL.png",
        lon: "122.339999",
        lat: "23.4999",
        time: "1585387510256",
        isStory: "false"
      },
      {
        id: "1",
        thumbnail: "https://i.imgur.com/07XbOpL.png",
        lon: "122.339998",
        lat: "23.49989",
        time: "1585387511256",
        isStory: "true"
      }
    ]
  });
});

module.exports = router;
