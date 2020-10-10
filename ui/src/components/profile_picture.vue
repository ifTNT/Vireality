<template>
  <!-- 新增style 其height,width為父類別傳入的直徑大小 -->
  <img class="avatar" :src="imgSrc" :style="{height : h, width : w}" />
</template>

<script>
import axios from "axios";
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
export default {
  name: "profile_picture",
  props: {
    diameter: {
      type: String,
      //預設為0px 避免父類別沒有傳入資料
      default: "0px"
    },
    Id: {
      type: String,
      //預設為0px 避免父類別沒有傳入資料
      default: "a123"
    }
  },
  data() {
    return {
      imgSrc: null,
      //傳入父類別指定大小
      h: this.diameter,
      w: this.diameter
    };
  },
  mounted() {
    axios
    /* [TODO]:還沒抓到user_id */
      .get(server.apiUrl("/user/" + this.Id + "/avatar"))
      .then(
        function(response) {
          // console.log("AVA:"+response.data)
          this.imgSrc = response.data.avatar;
        }.bind(this)
      )
      .catch(error => {
        console.log(error);
      });
  },
  methods: {}
};
</script>

<style scoped>
.avatar {
  border-radius: 50%;
}
</style>