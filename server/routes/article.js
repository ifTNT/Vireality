var express = require("express");
// const  db  = require("../models/article_schema.js");
var router = express.Router();
const Article = require('../models/article_schema');
const geohash = require('ngeohash');
const imgur = require('./token');
const request = require('request')

/* 回傳詳細文章內容(作者資料、文章圖片、文章文字內容、發文時間) */
router.get("/:id", async function (req, res, next) {
  // console.log(req.session)
  // req.session.user_id = "a123"
  // console.log(req.session)

  if (req.params.id === undefined) {
    res.json({
      ok: "false",
      result: []
    });
  }


  Article.find({article_id: req.params.id}, function (err, articles) {
    if (err) {
      console.log(err)
      res.json({
        ok: "false",
        result: []
      });
      return;
    } 
    // console.log("Result :\n", articles)
    if (articles.length !== 0) {
      console.log("Send!")
      const dateTime = new Date(articles[0].post_time);
      // console.log(date2.getTime()); 
      res.json({
        ok: "true",
        article_id: req.params.id,
        thumbnail: articles[0].thumbnail,
        text: articles[0].text,
        postTime: dateTime.getTime(),
        isPublic: articles[0].public,
        author: articles[0].author
      });
    }
    else{
      res.json({ok: "false",result: []});
    }
    
  });

 
});

/* 上傳文章 */
router.post("/", async function (req, res, next) {
  try{
    console.log(req.body)
    // req.session.user_id = "a123"
    // console.log(req.session)
    uid = req.session.user_id
    console.log(uid)
  
    if (uid === undefined ||req.body.lat === undefined ||req.body.lon === undefined ) throw "Can't find lat,lon,uid"
    geoHash = geohash.encode(req.body.lat, req.body.lon)
    console.log(geoHash);
  
    options = {
      'method': 'POST',
      'url': 'https://api.imgur.com/3/image',
      'headers': {
          'Authorization': 'Bearer ' + imgur.token
      },
      formData: {
          'image': req.body.thumbnail.split(',')[1] }
    };
    await request(options, function (error, response) {
      if (error) throw err
      const imgurURL = response.body
      console.log(imgurURL)
      const imgurURLToJSON2 = JSON.parse(imgurURL).data.link
      console.log(imgurURLToJSON2)
    
      /* 生成article_id是unique userid+time*/
      const articleData = [
        {
          article_id: uid + req.body.post_time,
          post_time: req.body.post_time,
          author: uid,
          thumbnail:[imgurURLToJSON2],
          text:req.body.text,
          public:req.body.isPublic,
          location: {
            longitude:req.body.lon,
            latitude:req.body.lat
          },
          geohash:geoHash
        },
      ];
      
      Article.insertMany(articleData, (err, articles) => {
        if (err) throw err
      });

      res.json({ ok: "true" });
    });
  }
  catch(e){
    console.log(e)
    res.json({ok: "false",result: []});
  } 
});
module.exports = router;