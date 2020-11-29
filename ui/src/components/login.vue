<template>
  <div class="login">
    <logo class="logo" style="margin-left: 0"></logo>
    <!-- <img class="logo" src="/static/media/icons/android-chrome-192x192.webp.png" /> -->
    <form class="inputLogin">
      <div class="accountArea">
        <label for="account">帳號</label>
        <span v-if="state" class="noticeAccountErr">
          介於1~20個字元{{ errMassageAC }}
        </span>
        <span v-else class="noticeAccountOK"> OK! </span>
        <input v-model="userId" id="account" />
      </div>

      <div class="passwordArea">
        <label for="password">密碼</label>
        <span class="noticePassword" v-bind:style="{ color: errColor }">
          介於4~20個字元{{ errMassagePW }}
        </span>
        <input type="password" id="password" />
      </div>
    </form>
    <div class="statusButtons">
      <button class="registerBtn" @click="register">註冊</button>
      <button class="loginBtn" @click="login">登入</button>
    </div>
  </div>
</template>
<script>
// import Vue from 'vue'
// import 'bootstrap/dist/css/bootstrap.css'
// import 'bootstrap-vue/dist/bootstrap-vue.css'
// import BootstrapVue from 'bootstrap-vue'
import LOGO from "./loading.vue";
// Vue.use(BootstrapVue)

export default {
  name: "login",
  data() {
    return {
      userId: "",
      state: true,
      errMassagePW: "",
      errMassageAC: "",
      errColor: "#76a5af",
    };
  },
  components: {
    logo: LOGO,
  },
  watch: {
    // 如果 `userId`有改變就會運行
    userId: function () {
      this.state =
        this.userId.length >= 1 && this.userId.length <= 20 ? false : true;
    },
  },
  mounted() {},
  methods: {
    register() {
      console.log("註冊");
      this.$route.push("/registration");
    },
    login() {
      console.log("登入");
      this.errMassagePW = "";
      this.errMassageAC = "";
      const password = document.querySelector("#password").value;
      this.axios
        .post(server.apiUrl("/user/login"), {
          uid: this.userId,
          password: password,
        })
        .then(
          function (response) {
            console.log(response.data);
            if (response.data.ok === "true") {
              this.$router.push("/main");
            } else {
              if (response.data.result === "帳號錯誤") {
                this.state = true;
                this.errMassageAC = ",帳號錯誤";
              } else {
                this.errMassagePW = ",密碼錯誤";
              }
              //this.errColor = "red"
            }
          }.bind(this)
        )
        .catch((error) => {
          console.log(error);
        });
      
      //   else{
      //       this.errColor = "red"
      //   }
    },
  },
};
</script>
<style scoped>
.logo {
  width: 45vw;
  height: 45vw;
  /* position: fixed;
    top: 5vw; */
  margin-top: 10vw;
  /* margin-left: 23vw; */
  border-radius: 100%;
  /* background-color: brown; */
  /* margin-bottom:5vw;  */
}
.login {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: "Microsoft JhengHei", Verdana;
}
.inputLogin {
  /* margin-bottom:5vw;  */
  width: 80vw;
}
#account,
#password {
  width: 80vw;
  margin-top: 2vh;
}
.passwordArea {
  margin-top: 2vh;
}
span {
  font-size: 0.7em;
}
.noticeAccountOK {
  color: #b4a7d6;
}
label {
  color: #45818e;
}
.noticeAccountErr {
  color: #76a5af;
}
input {
  border: 1px solid #45818e;
  border-radius: 4px;
  outline: none;
}
button {
  border-radius: 4px;
  margin: 4vw;
  border: 1px solid #76a5af;
  background-color: white;
  outline: none;
}
/* .registerBtn{
    background-color:#d0e0e3;
    border: 1px solid #d0e0e3;

}
.loginBtn{
    background-color: #76a5af;
    border: 1px solid #76a5af;
} */
</style>