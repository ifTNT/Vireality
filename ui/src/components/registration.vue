<template>
  <div class="registration">
    <div class="profile" v-if="pageState === 0">
      <label class="uploadPicButton">
        {{ upLoadPicName }}
        <!-- 選擇檔案按鈕 但因為需要美化 因此直接display none -->
        <input
          type="file"
          accept="image/jpg, image/jpeg, image/png, image/gif"
          @change="changeImage"
          style="display: none"
        />
      </label>
      <img class="pic" :src="img" />
      <form class="inputProfile">
        <div>
          <label for="feedback-user">帳號</label>
          <input v-model="userId" id="feedback-user" />
          <p>介於1~20個字元{{ errAccount }}</p>
          <label for="password">密碼</label>
          <input v-model="password" type="password" id="password" />
          <p>介於4~20個字元</p>
        </div>
        <div>
          <label for="checkPassword">確認密碼</label>
          <input v-model="checkPassword" type="password" id="checkPassword" />
          <p v-if="correctPassword">一樣了~</p>
          <p v-else>密碼不一樣</p>
        </div>
        <div>
          <label for="nickname">暱稱</label>
          <input v-model="nickname" type="text" id="nickname" />
        </div>
        <div>
          <label for="birthday">生日</label>
          <input v-model="birthday" id="birthday" type="date" />
        </div>
        <div>
          <label for="interest">興趣</label>
          <input v-model="interest" id="interest" type="text" />
        </div>
        <div>
          <label for="intro">形容自己的一句話</label>
          <input v-model="intro" id="intro" type="text" />
        </div>
      </form>
      <p>{{ errMessage }}</p>
      <img
        class="nextPage"
        src="/static/media/rightarrow.png"
        @click="nextPage"
      />
    </div>
    <div class="consentForm" v-if="pageState === 1">
      <h2>即將開啟鏡頭</h2>
      <p>我們即將開啓您的前鏡頭拍攝您的臉部請同意以下事項</p>
      <textarea v-model="content" class="consentContent"></textarea>
      <input v-model="agreeConsent" type="checkbox" /> 我同意<br />
      <div>
        {{ errNotAgree }}
        <img
          class="nextPage"
          src="/static/media/rightarrow.png"
          @click="nextFaceFeature"
        />
      </div>
    </div>
    <div class="camera" v-if="pageState === 2">
      <div class="firstFaceDetection">
        <!-- 告訴使用者要如何偵測 -->
        <div class="teachDescription">{{ teachMessage }}</div>
        <!-- 偵測不到臉部的時候需要顯示什麼 正常時不顯示-->
        <div class="warningNoDetection" v-if="showWarningMessage">
          <img class="warningImg" src="/static/media/warning.png" />
          <span class="warningMessage">{{ warningMessage }}</span>
        </div>
        <!-- 顯示進度圈圈 -->
        <img
          v-if="showProgress"
          class="progressFaceDetection"
          src="/static/media/loader.png"
        />
        <!-- 完成之後會顯示此圖 未完成時不出現 -->
        <img
          v-else
          class="compeleteFaceDetection"
          src="/static/media/compelete.png"
        />
      </div>
      <div>
        <img
          class="nextPage"
          src="/static/media/rightarrow.png"
          @click="finish"
        />
      </div>
    </div>
  </div>
</template>
<script>
import axios from "axios";
const consentContent = require("./consent");

export default {
  name: "register",
  data() {
    return {
      userId: "",
      upLoadPicName: "上傳照片",
      hasUploadPic: false,
      img: "https://i.imgur.com/oPYT6RD.png",
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
    };
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
    nextPage() {
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
        axios
          .post(server.apiUrl("/user/findAccount"), {
            uid: this.userId,
          })
          .then(
            function (response) {
              if (response.data.ok === "true") {
                console.log("NEXT");
                this.pageState = 1;
              } else {
                this.errAccount = "已存在此帳號";
              }
            }.bind(this)
          )
          .catch((error) => {
            console.log(error);
          });
      } else {
        this.errMessage = "帳號密碼錯誤";
      }
    },
    nextFaceFeature() {
      console.log("NEXT");
      this.errNotAgree = "";
      if (this.agreeConsent) {
        this.pageState = 2;
      } else {
        this.errNotAgree = "還沒同意哦!";
      }
    },
    finish() {
      console.log("finish");
      axios
        .post(server.apiUrl("/user/createAccount"), {
          uid: this.userId,
          password: this.password,
          nickname: this.nickname,
          birthday: this.birthday,
          interest: this.interest,
          intro: this.intro,
          avator: this.img,
        })
        .then(
          function (response) {
            if (response.data.ok === "true") {
              console.log("上傳成功");
            } else {
            }
          }.bind(this)
        )
        .catch((error) => {
          console.log(error);
        });
    },
  },
};
</script>
<style scoped>
.uploadPicButton {
  width: 45vw;
  height: 45vw;
  /* line-height: 2em; */
  /* text-align: center; */
  border: 0;
  border-radius: 10px;
  background-color: pink;
  font-size: 10px;
  margin-top: 15vw;
  border-radius: 100%;
  margin-bottom: 5vw;
  /*position: fixed;
     top: 50vh;
    left: 50vw;
    margin-left: -7vw;
    margin-top: -10vh; */
}
.pic {
  width: 45vw;
  height: 45vw;
  /* position: fixed;
    top: 5vw; */
  margin-top: 15vw;
  /* margin-left: 23vw; */
  border-radius: 100%;
  /* background-color: brown; */
  margin-bottom: 5vw;
}
.nextPage {
  width: 10vw;
  height: 10vw;
}
.consentContent {
  resize: none;
  width: 80vw;
  height: 80vw;
}

.camera {
  height: 155vw; /*34.5em*/
  width: 100vw;
  /*以下純測試用 加入相機後可以刪除的部分*/
  background-image: url("/static/media/testPic.jpg");
  background-size: cover;
}

.firstFaceDetection {
  /* 設定每個方塊垂直置中 */
  height: 147vw; /*34.5em*/
  display: flex;
  /*justify-content: center;*/
  flex-direction: column;
  align-items: center;
  font-family: "Microsoft JhengHei", Verdana;
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
}

.warningNoDetection {
  /* 讓圖片語文字對齊置中 */
  display: flex;
  justify-content: center;
  align-items: center;
}

.warningImg {
  width: 9vw;
  height: auto;
}

.warningMessage {
  font-size: xx-large;
}

/* 下面兩個class設定都要一樣 一個是進度條 一個是完成圖*/
.progressFaceDetection,
.compeleteFaceDetection {
  width: 30vw;
  /* [TODO]:要固定位置還是用margin */
  /* position: fixed; */
  /* top: 75vw;17em */
  /* left: 50vw;
  margin-left: -15vw;
  margin-top: -15vw; */
  margin-top: 40vw;
}

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