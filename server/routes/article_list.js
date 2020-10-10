var express = require("express");
var router = express.Router();
const Article = require('../models/article_schema');

/* 給定使用者經緯度，取得使用者附近(半徑10公尺的圓)文章列表，列表內有文章縮圖(有白邊)、發文座標和發文作者id。
若有給定篩選時間則再根據給定時間篩選 */
router.get("/geolocation", function(req, res, next) {
  //計算距離公式
  /*
    var lon1,lon2;
    var lan1,lan2;
    var r = 6371000;

    var dx = r*Math.sin((lan2-lan1)/2)*Math.sin(lon2-lon1);
    var dy = r*Math.sin(lan2-lan1)
    var distance = Math.sqrt(dx*dx+dy*dy)
  */

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

/* 給定使用者ID，取得該使用者所發佈的文章列表，列表內有文章縮圖(有白邊)、發文座標、發文時間及是否爲公開。*/
router.get("/user/:id", function(req, res, next) {
  //Pre condition
  if (req.params.id === undefined) {
    res.json({
      ok: "false",
      result: []
    });
    return;
  }

  Article.find({author: req.params.id}, function (err, articles) {
    if (err) {
      console.log(err)
      return;
    } 
    console.log("Result :\n", articles)
    if (articles.length !== 0) {
      console.log("Send!")
      /* [TODO]: 還沒測試 */
      res.json({
        ok: "true",
        result:articles
      });
    }
    
  });
  // res.json({
  //   ok: "true",
  //   result: [
  //     {
  //       id: "0",
  //       thumbnail: "https://i.imgur.com/07XbOpL.png",
  //       lon: "122.339999",
  //       lat: "23.4999",
  //       time: "1585387510256",
  //       isPublic: "false"
  //     },
  //     {
  //       id: "1",
  //       thumbnail: "https://i.imgur.com/07XbOpL.png",
  //       lon: "122.339998",
  //       lat: "23.49989",
  //       time: "1585387511256",
  //       isPublic: "true"
  //     }
  //   ]
  // });
});

module.exports = router;
