const mongoose = require('mongoose');
var Schema = mongoose.Schema;

var FriendshipSchema = new Schema({
    send_user_id: {
        type: String,
    },
    target_user_id: {
        type: String,
    },
    status: {
        type: Date,
        required: true,
    },
});


module.exports = mongoose.model("Friendship", FriendshipSchema);

