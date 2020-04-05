var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var miscRouter = require("./routes/misc");
var articleListRouter = require("./routes/article_list");
var articleRouter = require("./routes/article");
var chatRouter = require("./routes/chat");
var userRouter = require("./routes/user");

var app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", miscRouter);
app.use("/user", userRouter);
app.use("/articles", articleListRouter);
app.use("/article", articleRouter);
app.use("/chat", chatRouter);

//404 Router
app.use(function(req, res) {
  res.status(404).json({ ok: false, msg: "Endpoint not found" });
});

module.exports = app;
