var express = require("express");
var router = express.Router();
const geohash = require("ngeohash");
const Article = require("../models/article_schema");
const User = require("../models/user_schema");

/* 給定使用者經緯度，取得使用者附近(半徑10公尺的圓)文章列表，列表內有文章縮圖(有白邊)、發文座標和發文作者id。
若有給定篩選時間則再根據給定時間篩選 */
router.get("/geolocation", async function (req, res, next) {
  /*----- GeoHash去find正則表達 還是要計算距離 -----*/
  try {
    if (req === undefined) {
      throw "requst is undefined.";
    }
    /*---- Find Session uid ----*/

    // [For debug purpose]
    req.session.user_id = "a123";
    // console.log(req.session)
    uid = req.session.user_id;
    console.log(uid);
    if (uid === undefined) {
      throw "uid is undefined.";
    }
    /*---- Get user's location(lon,lat) from parameter ----*/
    let user_location = {
      longitude: req.query["lon"] || 0,
      latitude: req.query["lat"] || 0,
    };
    let user_geohash = geohash.encode(
      user_location.latitude,
      user_location.longitude
    );
    User.update(
      { user_id: uid },
      {
        location: {
          longitude: user_location.longitude,
          latitude: user_location.latitude,
        },
        geohash: user_geohash,
      }
    );
    // let err,
    //   user = await User.find({ user_id: uid });
    // if (err) {
    //   throw err;
    // }
    // if (
    //   user.length === 0 ||
    //   user[0].location.longitude === undefined ||
    //   user[0].location.latitude === undefined
    // ) {
    //   throw "Not have this user or no lon or lat";
    // }
    console.log(
      `User location: ${JSON.stringify(
        user_location
      )}, Geohash: ${user_geohash}`
    );
    //省去末兩位
    var re = "^" + user_geohash.substr(0, 6);
    /*---- Find articles around the user ----*/
    let err,
      articles = await Article.find({
        geohash: { $regex: re, $options: "m" },
      }); //正則表達
    if (err) {
      throw err;
    }
    console.log(`Article found: ${articles.length}`);

    // console.log(articles)
    dis = [];
    articles.forEach((target) => {
      // google map 計算距離方式
      var lon1 = user_location.longitude;
      var lat1 = user_location.latitude;
      var lon2 = target.location.longitude;
      var lat2 = target.location.latitude;

      var radLat1 = (lat1 * Math.PI) / 180.0;
      var radLat2 = (lat2 * Math.PI) / 180.0;
      var a = radLat1 - radLat2;
      var b = (lon1 * Math.PI) / 180.0 - (lon2 * Math.PI) / 180.0;
      var s =
        2 *
        Math.asin(
          Math.sqrt(
            Math.pow(Math.sin(a / 2), 2) +
              Math.cos(radLat1) *
                Math.cos(radLat2) *
                Math.pow(Math.sin(b / 2), 2)
          )
        );
      s = s * 6378137.0; // 取WGS84標準參考橢球中的地球長半徑(單位:m)
      s = Math.round(s * 10000) / 10000; //單位為公尺
      console.log(`Article ${target.article_id}: Distance is ${s}m`);
      if (s < 20)
        /* [ALERT,TODO]:先丟一張照片出去 避免錯誤 */
        dis.push({
          id: target.article_id,
          thumbnail: target.thumbnail[0],
          lon: target.location.longitude,
          lat: target.location.latitude,
          author: target.author,
          post_time: target.post_time,
        });
    });
    res.json({
      ok: "true",
      result: dis,
    });
    // res.json({
    //     ok: "true",
    //     result: [
    //       {
    //         id: "0",
    //         thumbnail: "https://i.imgur.com/07XbOpL.png",
    //         lon: "122.339999",
    //         lat: "23.4999",
    //         author: "test"
    //       },
    //       {
    //         id: "1",
    //         thumbnail: "https://i.imgur.com/07XbOpL.png",
    //         lon: "122.339998",
    //         lat: "23.49989",
    //         author: "test"
    //       }
    //     ]
    //   });
  } catch (e) {
    console.log(e);
    res.json({ ok: "false", result: [] });
  }
});

/* 給定使用者ID，取得該使用者所發佈的文章列表，列表內有文章縮圖(有白邊)、發文座標、發文時間及是否爲公開。*/
router.get("/user/:id", function (req, res, next) {
  //Pre condition
  if (req.params.id === undefined) {
    res.json({
      ok: "false",
      result: [],
    });
    return;
  }

  Article.find({ author: req.params.id }, function (err, articles) {
    if (err) {
      console.log(err);
      return;
    }
    console.log("Result :\n", articles);
    if (articles.length !== 0) {
      console.log("Send!");
      /* [TODO]: 還沒測試 */
      res.json({
        ok: "true",
        result: articles,
      });
    } else {
      res.json({
        ok: "false",
        result: [],
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
