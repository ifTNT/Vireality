var express = require("express");
var path = require("path");
//var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");

var articleListRouter = require("./routes/article_list");
var articleRouter = require("./routes/article");
var chatRouter = require("./routes/chat");
var userRouter = require("./routes/user");
var session = require("express-session");
const MongoStore = require("connect-mongo")(session);

var app = express();

app.use(logger("dev"));

// [TODO] Change the origin in production mode
app.use(
  cors({
    origin: [
      "https://127.0.0.1:8080",
      "https://127.0.0.1:3000",
      "https://192.168.1.44:8080",
      "https://192.168.1.44:3000",
      "https://192.168.1.141:8080",
      "https://192.168.1.141:3000",
      "https://192.168.1.252:8080",
      "https://192.168.1.252:3000",
      "https://192.168.43.161:8080",
      "https://192.168.43.161:3000",
      "https://192.168.0.13:8080",
      "https://192.168.0.13:3000",
    ],
    credentials: true,
    exposedHeaders: ["set-cookie"],
  })
);

// Enlarge the upperbound of uploading data
app.use(express.json({
  limit: "50mb"
}));
app.use(express.urlencoded({
  extended: false
}));
//app.use(cookieParser());

//Session
app.use(
  session({
    name: "vireality_session",
    secret: "njsdmfk;sfvrverivrpogk93jmog e49,94fw09skpfp3Mdf,s;pok3po",
    store: new MongoStore({
      url: "mongodb://localhost:27017/sessionDB"
    }),
    cookie: {
      maxAge: 86400000 * 1000
    }, //一天到期
    saveUninitialized: false,
    resave: true,
    unset: "destroy",
  })
);

app.use(express.static(path.join(__dirname, "public")));

app.use("/user", userRouter);
app.use("/articles", articleListRouter);
app.use("/article", articleRouter);
app.use("/chat", chatRouter);

//404 Router
app.use(function (req, res) {
  res.status(404).json({
    ok: false,
    msg: "Endpoint not found"
  });
});

module.exports = app;

// Mongoose
const mongoose = require("mongoose");
mongoose.set("useCreateIndex", true);
/*
 * 與 mongoDB 建立連連
 * mongoose.connect('mongodb://[資料庫帳號]:[資料庫密碼]@[MongoDB位置]:[port]/[資料庫名稱]')
 * mongoDB 預設的 port 是 27017
 * testDB 是 database 的名稱，當 app 執行時，mongoose 會自動建立這個 database
 */

mongoose.connect("mongodb://localhost/testDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// 取得資料庫連線狀態
const db = mongoose.connection;
db.on("error", (err) => console.error("connection error", err)); // 連線異常
db.once("open", (db) =>
  console.log("It is Connected to MongoDB and use testDB")
); // 連線成功

/* ---------Test Start----------*/
// const Article = require('./models/article_schema');

/* ----- Test add data -----*/
// const article = new Article(
//   {
//     article_id: 'a1',
//     post_time: Date.now(),
//     author:'a123',
//     thumbnail:["https://i.imgur.com/07XbOpL.png","https://imgur.com/gallery/V1VXuYH"],
//     text:"hello",
//     public:true,
//     location: {
//       longitude:120.278439,
//       latitude:22.729114
//     }
//   }
//  );
// console.log(article.post_time);
// article.getTime();

/* ----- Test save data -----*/
// article.save((err, article) => {
//   if (err) {
//     return console.error(err);
//   }
//   console.log('document saved');
//   db.close(); // 結束與 database 的連線
// });

/* ----- Test get data -----*/
// Article.find({}, (err, articles) => {
//   if (err) {
//     return console.error(err);
//   }
//   console.log(articles);
// });

/* ----- Test insert many doc -----*/
// const articleData = [
//   {
//     article_id: 'a1',
//     post_time: Date.now(),
//     author:'a123',
//     thumbnail:["https://i.imgur.com/07XbOpL.png","https://i.imgur.com/Dv8Vk68.jpeg"],
//     text:"hello",
//     public:true,
//     location: {
//       longitude:120.278439,
//       latitude:22.729114
//     },
//     geohash:"wsj9318nd"
//   },
//   {
//     article_id: 'a2',
//     post_time: Date.now(),
//     author:'a456',
//     thumbnail:["https://i.imgur.com/wYTCtRu.jpg","https://i.imgur.com/2bvab7y.jpg"],
//     text:"none",
//     public:false,
//     location: {
//       longitude:120.277849,
//       latitude:22.729755
//     },
//     geohash:"wsj92czdm"
//   },
//   {
//     article_id: 'a3',
//     post_time: Date.now(),
//     author:'a789',
//     thumbnail:["https://i.imgur.com/APZOse6.jpg"],
//     text:"cccc",
//     public:true,
//     location: {
//       longitude:120.292276,
//       latitude:22.732196
//     },
//     geohash:"wsj93660t"
//   },
//   {
//     article_id: 'a4',
//     post_time: Date.now(),
//     author:'a123',
//     thumbnail:["https://i.imgur.com/uvFEcJN.jpeg","https://i.imgur.com/XC5djWQ.jpeg"],
//     text:"I'd like to thank little Crowley for modeling, and this months rent for set dressing.Update: poor little Crowley contracted an incurable disease, feline infectious peritonitis and passed away in November. She was only 6 months old. RIP in peace, my sweet money kitten.",
//     public:false,
//     location: {
//       longitude:120.290055,
//       latitude:22.732459
//     },
//     geohash:"wsj9362d1"
//   },
//   {
//     article_id: 'a5',
//     post_time: Date.now(),
//     author:'a456',
//     thumbnail:["https://i.imgur.com/Bkg5wek.jpg","https://i.imgur.com/IqE14jF.jpg"],
//     text:"Sorry boss, I can't come to work today...",
//     public:false,
//     location: {
//       longitude:120.289141,
//       latitude:22.732360
//     },
//     geohash:"wsj934rcs"
//   },
//   {
//     article_id: 'a6',
//     post_time: Date.now(),
//     author:'a789',
//     thumbnail:["https://i.imgur.com/pqggrK0.jpeg","https://i.imgur.com/0RDJVCH.jpeg","https://i.imgur.com/8tPiQDo.jpeg"],
//     text:"It gets worse. People are now asking if we are fostering them and want to adopt them. I had to tell people she shared a strangers cats. Ffs",
//     public:true,
//     location: {
//       longitude:120.287896,
//       latitude:22.732929
//     },
//     geohash:"wsj934quz"
//   },
// ];

// Article.insertMany(articleData, (err, articles) => {
//   if (err) {
//     return console.error(err);
//   }
// });
/* ---------Test End----------*/

/* ----- Test insert many doc -----*/
// const User = require('./models/user_schema');

// const userData = [
//   {
//       birthday: "1999/01/01",
//       interest: "打球阿",
//       intro: "他很懶甚麼都沒寫",
//       face_id: [],
//       friend_list: ["a789", "a456", "b123"],
//       user_id: "a123",
//       password: "b123",
//       nickname: "CINDY",
//       join_time: Date.now(),
//       location: {
//           longitude: 120.2769229,
//           latitude: 22.7316944
//       },
//       geohash:"wsj92fnvx"
//   },
//   {
//     birthday: "1999/01/01",
//     interest: "打球阿",
//     intro: "他很懶甚麼都沒寫",
//     face_id: [],
//     avator: "https://i.imgur.com/4pYPZvj.gif",
//     friend_list: ["a789"],
//     user_id: "a456",
//     password: "b456",
//     nickname: "BELLA",
//     join_time: Date.now(),
//     location: {
//         longitude: 120.29289452026859,
//         latitude: 22.73417243105847
//     },
//     geohash:"wsj936ds5"
//   },
//   {
//     birthday: "1999/01/01",
//     interest: "睡覺",
//     intro: "嗨嗨",
//     face_id: [],
//     avator: "https://i.imgur.com/F8ygZ6M.jpeg",
//     friend_list: ["a123", "a456"],
//     user_id: "a789",
//     password: "b789",
//     nickname: "LISA",
//     join_time: Date.now(),
//     location: {
//         longitude: 120.290768,
//         latitude: 22.729104
//     },
//     geohash:"wsj9339nd"
//   },
//   {
//     birthday: "1999/08/25",
//     interest: "SING",
//     intro: "A_A",
//     face_id: [],
//     avator: "https://i.imgur.com/3QS8FN2.jpeg",
//     friend_list: ["a789"],
//     user_id: "b123",
//     password: "c123",
//     nickname: "CHEN",
//     join_time: Date.now(),
//     location: {
//         longitude: 120.277094,
//         latitude: 22.733319
//     },
//     geohash:"wsj92frp5"
//   }
// ];

// User.insertMany(userData, (err, users) => {
//   if (err) {
//     return console.error(err);
//   }
// });

// const Friendship = require('./models/friendship_schema');

/* ----- Test add data -----*/
// const friendship = new Friendship(
//   {
//     send_user_id: "a123",
//     target_user_id: "b123",
//     status: 0//0:交友申請 1:送出交友申請 2:收到交友申請 3:聊天室 4:編輯
//   }
//  );

/* ----- Test save data -----*/
// friendship.save((err, friendships) => {
//   if (err) {
//     return console.error(err);
//   }
//   console.log('document saved');
//   db.close(); // 結束與 database 的連線
// });



/* ----- Test insert many CHATROOM doc -----*/
// const ChatRoom = require('./models/chatroom_schema');

// const userData = [{
//   room_id: "qlove124356",
//   room_name: "q/love124356",
//   lastMessage: {
//     content: "HIHIHIHIHI",
//     sender_id: "q",
//     username: "匿名人士",
//     timestamp: "10:20", //顯示在列表聊天室框右邊
//     date: "123242424", //可以讓套件幫你排序聊天室 類型不限 eg.string, datetime, timestamp
//   },
//   user: [
//     {
//       _id: "q",
//       username: "匿名人士",
//     },
//     {
//       _id: "love124356",
//       username: "匿名人士",
//     }
//   ],
//   message: [
//     {
//       _id: "q123242424",
//       content: "HIHIHIHIHI",
//       sender_id: "q",
//       username: "匿名人士",
//       timestamp:"10:20",
//       date: "13 November"
//     },
//     {
//       _id: "q123242400",
//       content: "1231231231313123312",
//       sender_id: "love124356",
//       username: "匿名人士",
//       timestamp:"10:19",
//       date: "13 November"
//     }
//   ]
// }];

// ChatRoom.insertMany(userData, (err, users) => {
//   if (err) {
//     return console.error(err);
//   }
// });