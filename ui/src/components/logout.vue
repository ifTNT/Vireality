<template>
  <div class="logout">
    <span>
      <font-awesome-icon
        icon="sign-out-alt"
        class="signout"
        size="1x"
        @click="sendLogout"
      />
    </span>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "logout",
  data() {
    return {
      appName: "Vireality",
    };
  },
  methods: {
    sendLogout() {
      var logoutCheck = confirm("確定登出？");

      if (logoutCheck) {
        this.axios.get(server.apiUrl(`/user/logout`)).catch((error) => {
        console.log(error);
      });
      this.$router.push("/login");
      } else {
        return;
      }
      
    },
  },
};
</script>

<style scoped lang="stylus">
.logout {
  width: 4em;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-right: 0.5em;
  font-size: 25px;
  color: rgb(255, 255, 255);

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