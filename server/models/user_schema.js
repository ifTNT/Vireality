const mongoose = require('mongoose');
var Schema = mongoose.Schema;
var UserSchema = new Schema({
    user_id: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    nickname: {
        type: String,
    },
    birthday: {
        type: String,
        default: '1910/01/01',
    },
    interest: {
        type: String,
        default: '他很懶甚麼都沒寫',
    },
    intro: {
        type: String,
        default: '他很懶甚麼都沒寫',
    },
    face_id: [Number],
    avator: {
        type: String,
        default: 'https://i.imgur.com/07XbOpL.png',
    },
    friend_list: [String], //放user_id
    join_time: {
        type: Date,
        required: true,
    },
    location: {
        longitude: {
            type: Number,
        },
        latitude: {
            type: Number,
        },
    },
    geohash:{
        type:String
    }
});
module.exports = mongoose.model("User", UserSchema);
