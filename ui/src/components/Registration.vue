<template>
    <div class="login">
        <div class="logo"></div>
        <b-form-group class="inputLogin">
            <label for="feedback-user">帳號</label>
            <b-form-input v-model="userId" :state="validation" id="feedback-user"></b-form-input>
            <b-form-invalid-feedback :state="validation">
                介於1~20個字元
            </b-form-invalid-feedback>
            <b-form-valid-feedback :state="validation">
                OK!
            </b-form-valid-feedback>
            
            <label for="text-password">密碼</label>
            <b-form-input type="password" id="text-password" aria-describedby="password-help-block"></b-form-input>
            <b-form-text id="password-help-block">
                介於4~20個字元
            </b-form-text>
        </b-form-group>
        <div class="statusButtons">
            <b-button variant="dark" @click="register">註冊</b-button>
            <b-button variant="success" @click="login">登入</b-button>
        </div>
    </div>
</template>
<script>
// import Vue from 'vue'
// import 'bootstrap/dist/css/bootstrap.css'
// import 'bootstrap-vue/dist/bootstrap-vue.css'
// import BootstrapVue from 'bootstrap-vue'

// Vue.use(BootstrapVue)

export default {
  name: "login",
  data() {
    return {
        userId: ''
    };
  },
  computed: {
      validation() {
        return this.userId.length > 0 && this.userId.length < 20
      }
   },
   methods:{
       
   }
};
</script>
<style scoped>
.logo{
    width: 45vw;
    height: 45vw;
    /* position: fixed;
    top: 5vw; */
    margin-top:15vw;
    /* margin-left: 23vw; */
    border-radius: 100%;
    background-color: brown;
    margin-bottom:5vw; 
}
.login{

    display: flex;
    flex-direction: column;
    align-items: center;
    font-family: "Microsoft JhengHei", Verdana;

}
.inputLogin{
    margin-bottom:5vw; 
    width: 80vw;
}

</style>