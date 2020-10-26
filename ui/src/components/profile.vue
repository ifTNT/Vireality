<template>
    <div class="profile">
        <profilePicture :diameter="parentDiameter" :Id="Id"></profilePicture>
        <!-- <div class="profilePricture"></div> -->
        <div class="name">{{ nickName }}</div>
        <div class="hobbies">{{ interest }}</div>
        <div class="description">{{ intro }}</div>
        <!-- 0:交友申請 1:送出交友申請 2:收到交友申請,資料庫不存入 3:聊天室 4:編輯,資料庫不存入-->
        <button class="button" type="button" color="black" v-if="friendship_state===1">已送出申請</button>
        <button class="button" type="button" color="black" v-if="friendship_state===2">收到交友申請</button>
        <button class="button" type="button" color="black" v-if="friendship_state===3">聊天室</button>
        <button class="button" type="button" color="black" v-if="friendship_state===4">編輯</button>
        <button class="button" type="button" color="black" @click=sendFriendRequest v-if="friendship_state===0">申請交友</button>
    </div>
</template>
<script>
import axios from 'axios';
import ProPic from "./profile_picture.vue";
// GET /user/:id/info
// 給定使用者ID，取得該使用者的個人資料(名字、興趣、一句話)
// 輸入參數: id(使用者ID)
// 輸出:
//  nickName: 使用者暱稱
//  interest: 使用者興趣
//  intro: 使用者形容自己的一句話

// 輸入:

// GET /api/v1/user/test/info
// 輸出:

// {
//     "ok": "true",
//     "nickName": "王小明",
//     "interest": "打籃球",
//     "intro": "我就爛"
// }

export default {
    name: "friend_profile",
    props:{
        Id:{
            type: String,
            //預設為0px 避免父類別沒有傳入資料
            default: "b123"
        }
    },
    data(){
        return{
            nickName: "",
            interest: "",
            intro: "",
            parentDiameter: "10em",
            // isFriend:false,
            friendship_state:0 //0:交友申請 1:送出交友申請 2:收到交友申請,資料庫不存入 3:聊天室 4:編輯,資料庫不存入
        };
    },
    components: {
        profilePicture: ProPic
    },
    mounted(){
        axios
        .get(server.apiUrl("/user/"+this.Id+"/info"))
        .then(
            function(response){
                if(response.data.ok === "true"){
                    this.nickName = response.data.nickName;
                    this.interest = response.data.interest;
                    this.intro = response.data.intro;
                    // this.isFriend = response.data.isFriend
                    this.friendship_state = response.data.friendship_state
                }
                else{
                    console.log("not ok");
                }
            }.bind(this)
        )
        .catch(error => {
            console.log(error);
        });
    },
    methods: {
        sendFriendRequest: function() {
            console.log("friend req")
            /* [TODO]:userid還沒 targetid要進入時收到*/
            // axios
            // .post(server.apiUrl("/chat/"+this.Id+"/friend_request"),{uid:"a123",targetUid: this.Id})
            // .then(
            //     function(response){
            //         if(response.data.ok === "true"){
            //             console.log("ok")
            //         }
            //         else{
            //             console.log("not ok");
            //         }
            //     }.bind(this)
            // )
            // .catch(error => {
            //     console.log(error);
            // });
        },
    }
};
</script>

<style scoped lang="stylus">


.profile{
    width: 80vw;
    height: 80vh;
    background-color: rgba(0,0,0,0.5);
    border-radius:50px;
    position: fixed;
    top:8vh;
    left:10vw;
    text-align: center;
    padding-top: 30px;
    padding-bottom: 5px;

    profilePicture{
        dispaly: inline;
        width: 10em;
        height: 10em;
    }
}
.name{
    color:white;
    font-size: 7vw;
    font-family: Microsoft JhengHei;
    position: fixed;
    top:38vh;
    left: 40vw;
}
.hobbies{
    font-size: 5vw;
    font-family: Microsoft JhengHei;
    color: white;
    position: fixed;
    top: 48vh;
    left: 20vw;
}
.description{
    font-size: 5vw;
    font-family: Microsoft JhengHei;
    color: white;
    position: fixed;
    top: 62vh;
    left: 20vw;
}
.button{
    background-color:#E8E8E8;
    border:none;
    color:black; 
    padding:2vh 5vw;
    text-align:center;
    font-size:3vh;
    position: fixed;
    top: 75vh;
    left: 37.5vw;
}
</style>