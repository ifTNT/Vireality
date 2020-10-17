const mongoose = require('mongoose');
var Schema = mongoose.Schema;

var FriendshipSchema = new Schema({
    send_user_id: {
        type: String,
    },
    target_user_id: {
        type: String,
    },
    status: {//0:交友申請 1:送出交友申請 2:收到交友申請 3:聊天室
        type: Date,
        required: true,
    },
});


module.exports = mongoose.model("Friendship", FriendshipSchema);

