const mongoose = require('mongoose');
var Schema = mongoose.Schema;
var ChatroomSchema = new Schema({
    room_id: {
        type: String,
        unique: true
    },
    room_name: {
        type: String,
    },
    avatar: {
        type: String,
        default:"https://i.imgur.com/keUgCC5.png"
    },
    lastMessage: {
        content: {
            type: String,
        },
        sender_id: {
            type: String,
        },
        username: {
            type: String,
        },
        timestamp: {//顯示在列表聊天室框右邊
            type: String,
        }, 
        date: {//可以讓套件幫你排序聊天室 類型不限 eg.string, datetime, timestamp
            type: Number,
        } 
    },
    user:[{
        user_id: {
            type: String,
        },
        username: {
            type: String,
        },
        //avatar: "assets/imgs/snow.png",
    }],
    message:[{
        message_id: {
            type: String,
            unique: true
        },
        content: {
            type: String,
        },
        sender_id: {
            type: String,
        },
        username: {
            type: String,
        },
        timestamp: {//顯示在列表聊天室框右邊
            type: String,
        }, 
        date: {//可以讓套件幫你排序聊天室 類型不限 eg.string, datetime, timestamp
            type: Number,
        } 
    }]
    
});



module.exports = mongoose.model("Chatroom", ChatroomSchema);
