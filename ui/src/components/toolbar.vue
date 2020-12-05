<template>
  <div class="toolbar">
    <!-- APP名稱 -->
    <div class="appName">{{ appName }}</div>
    <!-- 兩個link 到個人頁/到聊天室 -->
    <div class="links">
      <span>
        <font-awesome-icon
          icon="user"
          class="userProfileLink"
          size="1x"
          @click="linkToUserProfile"
        />
      </span>
      <!-- <span>
        <font-awesome-icon
          icon="comment-alt"
          class="userChatroomLink"
          size="1x"
        />
      </span> -->
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
  methods: {
    linkToUserProfile() {
      let user_id = this.$store.state.user_id;
      if (user_id === undefined) {
        this.$router.push("/login");
      } else {
        this.$router.push(`/main/profile/${user_id}`);
      }
    },
  },
};
</script>

<style scoped lang="stylus">
.toolbar {
  margin-top: 0.3em;
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
  font-family: 'Audiowide', cursive;
}

.userProfileLink, .userChatroomLink {
  height: 1.2em;
  color: white;
}

/* .link沒設定高的話 在.components設定margin-right跑版 */
.links {
  // width: 4em;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-right: 0.5em;

  span {
    height: 1.5em;
    width: 1.5em;
    border-radius: 50%;
    background: #76a5af;
    display: flex;
    justify-content: center;
    align-items: center;

    :active {
      color: #76a5af;
      background: #45818e;
    }
  }
}
</style>