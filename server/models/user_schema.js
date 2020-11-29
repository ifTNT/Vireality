const mongoose = require("mongoose");
var Schema = mongoose.Schema;
var UserSchema = new Schema({
  user_id: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  nickname: {
    type: String,
    default: "匿名人士",
  },
  birthday: {
    type: String,
  },
  interest: {
    type: String,
    default: "他很懶什麼都沒寫",
  },
  intro: {
    type: String,
    default: "他很懶什麼都沒寫",
  },
  face_id: [Number],
  avator: {
    type: String,
    default: "https://i.imgur.com/oPYT6RD.png",
  },
  friend_list: [String], //放user_id
  join_time: {
    type: Date,
    required: true,
  },
  location: {
    longitude: {
      type: Number,
      default: 0,
    },
    latitude: {
      type: Number,
      default: 0,
    },
  },
  geohash: {
    type: String,
    default: "s00000000",
  },
});
module.exports = mongoose.model("User", UserSchema);
