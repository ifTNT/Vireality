<template>
    <div class="profilePicture">
        <div class="avatar"></div>
    </div>
</template>

<script>
import axios from 'axios';
/*前置條件
    需登入
    需輸入使用者ID
  輸入參數
    id: path segment parameter，使用者ID
  輸出結果說明
    輸出爲一個物件，物件裡面存放大頭照，物件屬性如下：
        avatar: 該使用者大頭照
    若前置條件不滿足或給定找不到該使用者，ok回傳false。

  輸入輸出結果範例
    輸入:
        GET /api/v1/user/test/avatar
    輸出:
        {
            "ok": "true",
            "avatar": "https://i.imgur.com/07XbOpL.png"
        }*/
var Avatar = document.getElementsByClassName('avatar');
var Id = 'a123';
export default {
    name:"profile_picture",
    data(){
        return{
        }
    },
    mounted ()  {
        axios
            .get(server.apiUrl('/user/'+ Id +'/avatar'))
            .then(response => {Avatar.style.backgroundImage ="url('" + response.avatar + "')" })
            .catch(error =>{ console.log(error)})
    }
}
</script>

<style scoped>
    .avatar{
        height: 500px;
        width: 500px;
        background-color:coral ;
        border-radius: 50%;
    }
</style>