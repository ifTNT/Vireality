<template>
    <div class="login">
        <img class="logo" src="/static/media/green_person.png" />
        <form class="inputLogin">
            <label for="feedback-user">帳號</label>
            <input v-model="userId"  id="feedback-user"/>
            <p v-if="state">
                介於1~20個字元
            </p>
            <p v-else>
                OK!
            </p>
            
            <label for="text-password">密碼</label>
            <input type="password" id="text-password" aria-describedby="password-help-block" />
            <p id="password-help-block">
                介於4~20個字元{{errMassage}}
            </p>
        </form>
        <div class="statusButtons">
            <button @click="register">註冊</button>
            <button @click="login">登入</button>
        </div>
    </div>
</template>
<script>
// import Vue from 'vue'
// import 'bootstrap/dist/css/bootstrap.css'
// import 'bootstrap-vue/dist/bootstrap-vue.css'
// import BootstrapVue from 'bootstrap-vue'
import axios from 'axios';

// Vue.use(BootstrapVue)

export default {
  name: "login",
  data() {
    return {
        userId: '',
        state:true,
        errMassage:"",

    };
  },
  watch:{
    // 如果 `userId`有改變就會運行
    "userId" : function() {
        this.state = (this.userId.length >=1  && this.userId.length <= 20)? false:true
    }

  },
   methods:{

       register(){
           console.log("註冊")
       },
       login(){
           console.log("登入")
           const password = document.querySelector("#text-password").value
           if(!this.state && (password.length > 3 && password.length < 21)){
            console.log("OKLOGIN")
             axios.post(server.apiUrl("/user/login"),
             {
                 uid: this.userId,
                 password: password
             })
             .then(
                 function(response) {
                     console.log(response.data);
                     if(response.data.ok==='true'){
                        document.location.href = "/#/main"
                     }
                     else{
                        this.errMassage = ",密碼錯誤"
                     }
                 }.bind(this)
             )
             .catch(error => {
                 console.log(error);
             });
           }
            
        }
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
    /* background-color: brown; */
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