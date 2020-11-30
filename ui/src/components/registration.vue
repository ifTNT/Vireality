<template>
  <div class="registration">
    <div class="profile" v-if="pageState === 0">
      <div class="uploadPic">
        <img :src="img" class="pic" />

        <img class="uploadBtn" src="/static/media/camera_g.png" />
        <input
          type="file"
          accept="image/*"
          @change="changeImage"
          class="customPicInput"
        />
        <!-- <img class="uploadPicButton" for="customPicInput" src="/static/media/camera.png">
            <input
              type="file"
              accept="image/jpg, image/jpeg, image/png, image/gif"
              @change="changeImage"
              style="opacity: 0;background-image: '/static/media/camera.png';"
              id="customPicInput"
            />
          
          <img class="pic" :src="img" /> -->
      </div>
      <form class="inputProfile">
        <div class="accountArea">
          <label for="account">帳號</label>
          <span style="color: #76a5af">介於1~20個字元{{ errAccount }}</span>
          <div><input v-model="userId" id="account" /></div>
        </div>
        <div class="passwordArea">
          <label for="password">密碼</label>
          <span style="color: #76a5af">介於4~20個字元</span>
          <div><input v-model="password" type="password" id="password" /></div>
        </div>
        <div class="checkPasswordArea">
          <label for="checkPassword">確認密碼</label>
          <span v-if="correctPassword" style="color: #b4a7d6">一樣了~</span>
          <span v-else style="color: #76a5af">密碼不一樣</span>
          <div>
            <input v-model="checkPassword" type="password" id="checkPassword" />
          </div>
        </div>
        <div class="nicknameArea">
          <label for="nickname">暱稱</label>
          <span style="color: #b4a7d6">非必填</span>
          <div><input v-model="nickname" type="text" id="nickname" /></div>
        </div>
        <div class="birthdayArea">
          <label for="birthday">生日</label>
          <span style="color: #b4a7d6">非必填</span>
          <div><input v-model="birthday" id="birthday" type="date" /></div>
        </div>
        <div class="interestArea">
          <label for="interest">興趣</label>
          <span style="color: #b4a7d6">非必填</span>
          <div><input v-model="interest" id="interest" type="text" /></div>
        </div>
        <div class="introArea">
          <label for="intro">形容自己的一句話</label>
          <span style="color: #b4a7d6">非必填</span>
          <div><input v-model="intro" id="intro" type="text" /></div>
        </div>
      </form>
      <p style="color: #76a5af">{{ errMessage }}</p>
      <img
        class="nextPageImg"
        src="/static/media/rightarrow_green.png"
        @click="nextPageConsent"
      />
    </div>
    <div class="consentForm" v-if="pageState === 1">
      <div class="openCameraTitle">即將開啟鏡頭</div>
      <!-- <div class="openCameraNoticeMessage">我們即將開啓您的前鏡頭拍攝您的臉部請同意以下事項</div> -->
      <textarea
        v-model="content"
        readonly="readonly"
        class="consentContent"
      ></textarea>
      <div class="agreeArea">
        <input v-model="agreeConsent" type="checkbox" id="agreeCheckBox" />
        <label for="agreeCheckBox"></label>
        我同意
        <span style="color: #76a5af"> {{ errNotAgree }} </span>
      </div>

      <div>
        <img
          class="nextPageImg"
          src="/static/media/rightarrow_green.png"
          @click="nextFaceFeature"
        />
      </div>
    </div>
    <div class="camera" v-if="pageState === 2">
      <camera-reg
        class="fullScreen"
        facingMode="user"
        v-bind:label="userId"
        @face-accepted="update_progress"
        ref="camera"
      />
      <div class="firstFaceDetection">
        <!-- 告訴使用者要如何偵測 -->
        <div class="teachDescription">{{ teachMessage }}</div>
        <!-- 偵測不到臉部的時候需要顯示什麼 正常時不顯示-->
        <!-- <div class="warningNoDetection" v-if="showWarningMessage">
          <img class="warningImg" src="/static/media/warning.png" />
          <span class="warningMessage">{{ warningMessage }}</span>
        </div> -->
        <!-- 顯示進度圈圈 -->
        <!-- <img
          v-if="showProgress"
          class="progressFaceDetection"
          src="/static/media/loader.png"
        /> -->
        <!-- 完成之後會顯示此圖 未完成時不出現 -->
        <!-- <img
          v-else
          class="compeleteFaceDetection"
          src="/static/media/compelete.png"
        /> -->

        <loading-progress
          v-if="showProgress"
          :progress="progressValue"
          size="110"
          rotate
          fillDuration="2"
          rotationDuration="1"
        />

        <div class="checkmarkVue compeleteFaceDetection">
          <!-- class="checkmark" -->
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
            <!-- class="checkmark__circle" -->
            <circle cx="26" cy="26" r="25" fill="none" />
            <!-- class="checkmark__check" -->
            <path fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
          </svg>
        </div>
      </div>
      <!-- <div>
        <img
          class="nextPageImg"
          src="/static/media/rightarrow_green.png"
          @click="finish"
          style="opacity: 0.8"
        />
      </div> -->
    </div>
  </div>
</template>
<script>
import "vue-progress-path/dist/vue-progress-path.css";
import VueProgress from "vue-progress-path";
import Vue from "vue";
import { roomsRef, usersRef } from '../lib/firebase_config';
Vue.use(VueProgress);

const consentContent = require("./consent");
const CameraReg = () => import("./camera_registeration.vue");
const Checkmark = () => import("./checkmark.vue");

export default {
  name: "register",

  data() {
    return {
      userId: "",
      upLoadPicName: "上傳照片",
      hasUploadPic: false,
      img: "https://i.imgur.com/WinIC3F.png",
      file: "",
      errAccount: "",
      errMessage: "",
      password: "",
      checkPassword: "",
      correctPassword: true,
      nickname: "",
      birthday: "",
      interest: "",
      intro: "",
      pageState: 0,
      // 顯示怎麼偵測的文字
      teachMessage: "請慢慢轉動頭部",
      // 顯示偵測不到臉部的訊息以及是否顯示 正常情況不會顯示
      warningMessage: "偵測不到臉部T^T",
      showWarningMessage: true,
      // 顯示完成掃描的圖 正常情況不會顯示
      showProgress: true,
      content: consentContent.content,
      agreeConsent: false,
      errNotAgree: "",
      progressValue: 0.0,
    };
  },
  components: {
    cameraReg: CameraReg,
    checkmark: Checkmark,
    // Progress,
  },
  watch: {
    checkPassword: function () {
      this.correctPassword =
        this.checkPassword === this.password ? true : false;
    },
    password: function () {
      this.correctPassword =
        this.checkPassword === this.password ? true : false;
    },
  },
  mounted() {
    this.MaxChooseDate();
  },
  methods: {
    update_progress(new_progress) {
      this.progressValue = new_progress / 10;
      console.log(this.progressValue);
      if (this.progressValue >= 1) {
        this.finish();
      }
    },

    changeImage(e) {
      const file = event.target.files.item(0); //取得File物件
      const reader = new FileReader(); //建立FileReader 監聽 Load 事件
      reader.addEventListener("load", this.imageLoader);
      reader.readAsDataURL(file);
      this.file = e.target.files[0];
    },
    imageLoader(event) {
      // console.log(event.target.result)
      this.img = event.target.result;
      this.hasUploadPic = true;
    },
    MaxChooseDate() {
      var date_now = new Date();
      var year = date_now.getFullYear();
      var month =
        date_now.getMonth() + 1 < 10
          ? "0" + (date_now.getMonth() + 1)
          : date_now.getMonth() + 1;
      var date =
        date_now.getDate() < 10 ? "0" + date_now.getDate() : date_now.getDate();
      var field = document.getElementById("birthday");
      field.setAttribute("max", year + "-" + month + "-" + date);
      this.birthday = year + "-" + month + "-" + date;
      field.value = year + "-" + month + "-" + date;
    },
    nextPageConsent() {
      console.log("想要下一頁");
      this.errMessage = "";
      this.errAccount = "";
      if (
        this.correctPassword &&
        this.userId.length >= 1 &&
        this.userId.length <= 20 &&
        this.password.length >= 4 &&
        this.password.length <= 20
      ) {
        this.axios
          .post(server.apiUrl("/user/findAccount"), {
            uid: this.userId,
          })
          .then(
            function (response) {
              if (response.data.ok === "true") {
                console.log("NEXT");
                this.pageState = 1;
              } else {
                this.errAccount = ",已存在此帳號";
              }
            }.bind(this)
          )
          .catch((error) => {
            console.log(error);
          });
      } else {
        this.errMessage = "帳號密碼輸入格式錯誤";
      }
    },
    nextFaceFeature() {
      console.log("NEXT");
      this.errNotAgree = "";
      if (this.agreeConsent) {
        this.pageState = 2;
      } else {
        this.errNotAgree = ",還沒同意哦!";
      }
    },
    finish() {
      console.log("finish");
      /* COMPLETED Animated*/
      this.showProgress = false;
      const checkmarkSelect = document.querySelector(".checkmarkVue");
      const checkmarkCircle = checkmarkSelect.querySelector("circle");
      const checkmarkSvg = checkmarkSelect.querySelector("svg");
      const checkmarkPath = checkmarkSelect.querySelector("path");
      checkmarkSvg.classList.add("checkmark");
      checkmarkCircle.classList.add("checkmark__circle");
      checkmarkPath.classList.add("checkmark__check");
      /* -------------- */
      this.axios
        .post(server.apiUrl("/user/createAccount"), {
          uid: this.userId,
          password: this.password,
          nickname: this.nickname,
          birthday: this.birthday,
          interest: this.interest,
          intro: this.intro,
          avator: this.img,
        })
        .then((response) => {
          if (response.data.ok === "true") {
            console.log("新增使用者成功!");
             /* 新增使用者到firebase */
            let nicknameForFirebase = ""
            if(this.nickname===""){
                nicknameForFirebase = "匿名人士"
            }
            else{
              nicknameForFirebase = this.nickname
            }
            const user1 = {
              _id: this.userId,
              username: nicknameForFirebase,
              // avatar: this.img
            }
            // await usersRef.doc(user1._id).set(user1)
          } else {
            console.log("新增使用者失敗TT");
            this.pageState = 0;
          }
         
          window.setTimeout(() => {
            // Distroy the camera to prevent getContext error from pico.
            this.pageState = 3;
            this.$router.push("/main");
          }, 1000);
        })
        .catch((error) => {
          console.log(error);
        });
        
    },
  },
};
</script>
<style scoped>
.vue-progress-path {
  z-index: 111111;
  margin-top: 40vw;
}

.uploadPic {
  position: relative;
  margin-bottom: 4vh;
}
/*customPicInput uploadBtn 修改時要同時修改*/
.customPicInput {
  position: absolute;
  /* top: 0; */
  bottom: 0;
  /* left: 0; */
  right: 0;
  opacity: 0;
  display: block;
  width: 6vw;
  height: 6vw;
  clear: both;
  margin-top: 10vw;
  /* margin-bottom: 10vw; */
}
.uploadBtn {
  width: 6vw;
  height: 6vw;
  margin-top: 10vw;
  /* border-radius: 100%; */
  /* margin-bottom: 10vw; */
  /* margin-left: -7vw; */
}
.pic {
  width: 45vw;
  height: 45vw;
  margin-top: 15vw;
  border-radius: 100%;
  /* margin-bottom: 5vw; */
}
.profile {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.inputProfile input {
  border: 1px solid #45818e;
  border-radius: 4px;
  outline: none;
}
#account,
#password,
#checkPassword,
#nickname,
#birthday,
#interest,
#intro {
  width: 80vw;
  margin: 1vh 0;
}
#birthday {
  background-color: white;
}
.inputProfile span {
  font-size: 0.7em;
}
input[type="checkbox"] {
  display: none;
}
input[type="checkbox"] + label {
  display: inline-block;
  width: 4vw;
  height: 4vw;
  background-image: url("/static/media/checkbox_no.png");
  background-repeat: no-repeat;
  background-size: contain;
}
input[type="checkbox"]:checked + label {
  background-image: url("/static/media/checkbox_yes.png");
}
.nextPageImg {
  width: 8vw;
  height: 8vw;
  margin-top: 1vh;
  margin-bottom: 1vh;
  z-index: 1111;
}
.inputProfile label {
  color: #45818e;
}
.consentForm {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #45818e;
}
.openCameraTitle {
  font-size: 6vw;
  font-weight: bold;
  margin-top: 8vh;
}
/* .openCameraNoticeMessage{
  font-size: 4vw;
  margin-top:1vh;
  width: 80vw;
} */
.consentContent {
  resize: none;
  width: 80vw;
  height: 80vw;
  margin-top: 1vh;
  color: #8f8f8f;
  font-size: 4vw;
  padding: 1.5vw 1.5vw;
  border: 1px solid #45818e;
}
.agreeArea {
  vertical-align: middle;
  margin-top: 1vh;
  margin-bottom: 1vh;
  font-size: 4vw;
}

/* .uploadPicButton {
  width: 45vw;
  height: 45vw;*/
/* line-height: 2em; */
/* text-align: center; */
/* border: 0;
  border-radius: 10px;
  background-color: pink;
  font-size: 10px;
  margin-top: 15vw;
  border-radius: 100%;
  margin-bottom: 5vw; */
/*position: fixed;
     top: 50vh;
    left: 50vw;
    margin-left: -7vw;
    margin-top: -10vh; */
/*}*/

.fullScreen {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
/* .camera { */
/* height: 155vw; 34.5em */
/* width: 100vw; */
/*以下純測試用 加入相機後可以刪除的部分*/
/* background-image: url("/static/media/testPic.jpg"); */
/* background-size: cover; */
/* }  */

camera {
  position: absolute;
  z-index: -19999;
}

.firstFaceDetection {
  /* 設定每個方塊垂直置中 */
  height: 147vw; /*34.5em*/
  display: flex;
  /*justify-content: center;*/
  flex-direction: column;
  align-items: center;
}

.teachDescription {
  background-color: white;
  opacity: 0.8;
  font-size: xx-large;
  text-align: center;
  padding: 1vh 5vw;
  height: 5vh;
  line-height: 5vh;
  border-radius: 10px;
  margin-top: 2vh;
  z-index: 1111;
}

.warningNoDetection {
  /* 讓圖片語文字對齊置中 */
  display: flex;
  justify-content: center;
  align-items: center;
  /* opacity: 0.8; */
  z-index: 1111;
}

.warningImg {
  width: 9vw;
  height: auto;
  z-index: 1111;
}

.warningMessage {
  font-size: xx-large;
  z-index: 1111;
  color: red;
}

/* 下面兩個class設定都要一樣 一個是進度條 一個是完成圖*/
.progressFaceDetection,
.compeleteFaceDetection {
  width: 30vw;
  /* position: fixed; */
  /* top: 75vw;17em */
  /* left: 50vw;
  margin-left: -15vw;
  margin-top: -15vw; */
  margin-top: 40vw;
  z-index: 1111;
}

/*----- 完成圖示動畫 -----*/
.checkmark__circle {
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  stroke-width: 2;
  stroke-miterlimit: 10;
  stroke: #f1c232;
  fill: none;
  animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
}

.checkmark {
  width: 30vw;
  height: 30vw;
  border-radius: 50%;
  display: block;
  stroke-width: 2;
  stroke: #fff;
  stroke-miterlimit: 10;
  margin: 10% auto;
  box-shadow: inset 0px 0px 0px #f1c232;
  animation: fill 0.4s ease-in-out 0.4s forwards,
    scale 0.3s ease-in-out 0.9s both;
}

.checkmark__check {
  transform-origin: 50% 50%;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.8s forwards;
}

@keyframes stroke {
  100% {
    stroke-dashoffset: 0;
  }
}
@keyframes scale {
  0%,
  100% {
    transform: none;
  }
  50% {
    transform: scale3d(1.1, 1.1, 1);
  }
}
@keyframes fill {
  100% {
    box-shadow: inset 0px 0px 0px 40vw #f1c232;
  }
}
/*------------------- */
/* 以下為響應式的設定 */
@media screen and (max-width: 583px) {
  .teachDescription,
  .warningMessage {
    font-size: medium;
  }
  .warningImg {
    width: 6vw;
  }
}
</style>