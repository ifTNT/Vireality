var express = require("express");
// const  db  = require("../models/article_schema.js");
var router = express.Router();
const Article = require('../models/article_schema');


/* 回傳詳細文章內容(作者資料、文章圖片、文章文字內容、發文時間) */
router.get("/:id", async function (req, res, next) {
  // console.log(req.session)
  // req.session.user_id = "a123"
  // console.log(req.session)

  if (req.params.id === undefined) {
    res.json({
      ok: "false"
    });
  }


  Article.find({article_id: req.params.id}, function (err, articles) {
    if (err) {
      console.log(err)
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
    
  });

 
});

/* 上傳文章 */
router.post("/", function (req, res, next) {
  /* [TODO]:前端(post_article.vue)尚未完成 */
  console.log(req.body)
  if (req.body.author === undefined ||req.query.lon === undefined ||req.query.lat === undefined ) {
    res.json({
      ok: false
    });
    return;
  }
  /* [TODO]:新增自DB還沒寫 圖片上傳還沒解決 !!!GeoHash + imgur API!!!*/
  /* [TODO]:生成article_id是unique */
  // const articleData = [
  //     {
  //       article_id: 'a1',
  //       post_time: Date.now(),
  //       author:'a123',
  //       thumbnail:["https://i.imgur.com/07XbOpL.png","https://i.imgur.com/Dv8Vk68.jpeg"],
  //       text:"hello",
  //       public:true,
  //       location: {
  //         longitude:120.278439,
  //         latitude:22.729114
  //       }
  //     },
  //   ];
    
    // Article.insertMany(articleData, (err, articles) => {
    //   if (err) {
    //     return console.error(err);
    //   }
    // });
    res.json({
      ok: true
    });
});
module.exports = router;