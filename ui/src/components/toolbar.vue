<template>
  <div class="toolbar">
    <!-- APP名稱 -->
    <div class="appName">{{ appName }}</div>
    <!-- 兩個link 到個人頁/到聊天室 -->
    <div class="links">
      <!-- 連結待修改 -->
      <a href="/#/">
        <font-awesome-icon icon="user" class="userProfileLink" size="1x" />
      </a>
      <a href="/#/">
        <font-awesome-icon
          icon="comment-alt"
          class="userChatroomLink"
          size="1x"
        />
      </a>
    </div>
  </div>
</template>

<script>
export default {
  name: "toolbar",
  data() {
    return {
      appName: "Vireality",
    };
  },
};
</script>

<style scoped>
.toolbar {
  height: 1.8em;
  font-size: 25px;
  /* background-color: #d0e0e390; */
  color: #45818e;
  /* box-shadow: 0px 0px 10px 0px #555555; */
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.appName {
  margin-left: 1vw;
  text-shadow: 1px 1px #b4a7d6;
  font-family: "Audiowide", cursive;
}
.userProfileLink,
.userChatroomLink {
  height: 1.2em;
  color: #d0e0e3;
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