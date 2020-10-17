const mongoose = require('mongoose');
var Schema = mongoose.Schema;
/* [TODO]: 加GeoHash */
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
    // isStory: Boolean, //true:限時動態 false:文章
    public: Boolean, //true:公開 false:朋友可見
    author: { //user_id
        type: String,
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
    // geohash:{
    //     type: String
    // }
    

});
ArticleSchema.methods.getTime = function() {
    // 這裡的 this 指透過這個 function constructor 建立的物件
    console.log(`Time is ${this.post_time.getFullYear()}/${this.post_time.getMonth()}/${this.post_time.getDate()}, ${this.post_time.getHours()}:${this.post_time.getMinutes()}:${this.post_time.getSeconds()}`);
};


module.exports = mongoose.model("Article", ArticleSchema);
