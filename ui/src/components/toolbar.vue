<template>
    <div class="toolbar">
        <div class="components">
            <!-- APP名稱 -->
            <div class="appName">
                {{ appName }}
            </div>
            <!-- 兩個link 到個人頁/到聊天室 -->
            <div class="links">
                <!-- 連結待修改 -->
                <a href="/#/first_face_detection">
                    <img class="userProfileLink" src="/static/media/profile.png">
                </a>
                <a href="/#/first_face_detection">
                    <img class="userChatroomLink" src="/static/media/chatroom.png">
                </a>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name:"toolbar",
    data(){
        return{
            appName:"Vireality"
        };
    },
};
</script>

<style scoped>
    .toolbar,.components{
        height: 5vh;
        width: 100vw;
        font-family: Verdana;
        background-color: rgb(255, 158, 234);
    }
    .components{
        display: flex;
        Justify-content: space-between;
        align-items: center;
    }
    .appName{
        font-size: 35px;
        margin-left: 1vw;
    }
    .userProfileLink,.userChatroomLink{
        height: 4vh;
        width: auto;
        border:0;/* 有些網頁會顯示邊框 手機裝置不知道 所以還是先寫著 */
        margin-right: 1vh;
        background-color: red;
    }
    /* .link沒設定高的話 在.components設定margin-right跑版 */
    .links{
        height: 4vh;
        background-color: slateblue;
    }
    /* 以下為響應式的設定 
       主要調整APP名稱字體大小就好(px)*/
    @media screen and (max-width: 583px) {
        .appName {
            font-size: 20px;
        }
    }
</style>