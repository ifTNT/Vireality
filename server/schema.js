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
    face_id: String,
    avator: {
        type: String,
        default: 'https://i.imgur.com/07XbOpL.png',
    },
    friend_list: [String], //放user_id
    join_time: {
        type: Date,
        required: true,
    },
    last_active_time: {
        type: Date,
        required: true,
    },
});
module.exports = mongoose.model("User", UserSchema);

var ArticleSchema = new Schema({
    article_id: {
        type: String,
        required: true,
        unique: true
    },
    post_time: {
        type: Date,
        required: true,
    },
    thumbnail: [String],
    text: String,
    isStory: Boolean, //true:限時動態 false:文章
    public: Boolean, //true:公開 false:朋友可見
    author: { //user_id
        type: String,
        required: true,
        unique: true
    },
    location: {
        longitude: {
            type: Number,
        },
        latitude: {
            type: Number,
        },
    },
    

});
module.exports = mongoose.model("Article", ArticleSchema);