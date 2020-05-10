<template>
  <div class="toolbar">
    <!-- APP名稱 -->
    <div class="appName">{{ appName }}</div>
    <!-- 兩個link 到個人頁/到聊天室 -->
    <div class="links">
      <!-- 連結待修改 -->
      <a href="/#/">
        <img class="userProfileLink" src="/static/media/profile.png" />
      </a>
      <a href="/#/">
        <img class="userChatroomLink" src="/static/media/chatroom.png" />
      </a>
    </div>
  </div>
</template>

<script>
export default {
  name: "toolbar",
  data() {
    return {
      appName: "Vireality"
    };
  }
};
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Roboto+Slab:wght@500&display=swap"); /*For title font*/
.toolbar {
  height: 1.8em;
  font-size: 25px;
  background-color: rgba(255, 255, 255, 0.4);
  box-shadow: 0px 0px 10px 0px #555555;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.appName {
  margin-left: 1vw;
  font-family: "Roboto Slab", serif;
}
.userProfileLink,
.userChatroomLink {
  height: 1.2em;
}
/* .link沒設定高的話 在.components設定margin-right跑版 */
.links {
  width: 2.75em;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-right: 0.5em;
}
/* 以下為響應式的設定 
       主要調整APP名稱字體大小就好(px)*/
@media screen and (max-width: 583px) {
  /*.appName {
    font-size: 20px;
  }*/
}
</style>