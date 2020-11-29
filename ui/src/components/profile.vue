<template>
  <div class="profile">
    <profilePicture :diameter="parentDiameter" :Id="Id"></profilePicture>
    <!-- <div class="profilePricture"></div> -->
    <nav class="goBackBtn">
      <font-awesome-icon
        icon="times"
        class="backButton"
        size="1x"
        @click.prevent="$router.back()"
      />
        <!-- @click.prevent="handleBack(fromRoute)" -->

    </nav>
    <div class="profileMidWrap">
      <font-awesome-icon
        icon="chevron-left"
        class="leftButton"
        size="2x"
        @click.prevent="handleLeft()"
      />
      <div class="profileMessage">
        <div class="name">{{ nickName }}</div>
        <div class="hobbies">
          <p>interest</p>
          {{ interest }}
        </div>
        <div class="description">
          <p>intro</p>
          {{ intro }}
        </div>
      </div>
      <font-awesome-icon
        icon="chevron-right"
        class="rightButton"
        size="2x"
        @click.prevent="handleRight()"
      />
    </div>
    <!-- 0:交友申請 1:送出交友申請 2:收到交友申請,資料庫不存入 3:聊天室 4:編輯,資料庫不存入-->
    <button
      class="button"
      type="button"
      color="black"
      v-if="friendship_state === 1"
    >
      已送出申請
    </button>
    <button
      class="button"
      type="button"
      color="black"
      v-if="friendship_state === 2"
    >
      收到交友申請
    </button>
    <button
      class="button"
      type="button"
      color="black"
      v-if="friendship_state === 3"
    >
      聊天室
    </button>
    <button
      class="button"
      type="button"
      color="black"
      v-if="friendship_state === 4"
    >
      編輯
    </button>
    <button
      class="button"
      type="button"
      color="black"
      @click="sendFriendRequest"
      v-if="friendship_state === 0"
    >
      申請交友
    </button>
  </div>
</template>
<script>
import axios from "axios";
import ProPic from "./profile_picture.vue";
// GET /user/:id/info
// 給定使用者ID，取得該使用者的個人資料(名字、興趣、一句話)
// 輸入參數: id(使用者ID)
// 輸出:
//  nickName: 使用者暱稱
//  interest: 使用者興趣
//  intro: 使用者形容自己的一句話

// 輸入:

// GET /api/v1/user/test/info
// 輸出:

// {
//     "ok": "true",
//     "nickName": "王小明",
//     "interest": "打籃球",
//     "intro": "我就爛"
// }

export default {
  name: "friend_profile",
  // 目前以parameters處裡
  // props:{
  //     Id:{
  //         type: String,
  //         //預設為0px 避免父類別沒有傳入資料
  //         default: "b123"
  //     }
  // },
  data() {
    return {
      nickName: "Author",
      interest: "",
      intro: "",
      parentDiameter: "23vh",
      // isFriend:false,
      friendship_state: 0, //0:交友申請 1:送出交友申請 2:收到交友申請,資料庫不存入 3:聊天室 4:編輯,資料庫不存入
      Id: "",
    };
  },
  components: {
    profilePicture: ProPic,
  },
  mounted() {
    this.axios
      .get(server.apiUrl("/user/" + this.Id + "/info"))
      .then(
        function (response) {
          if (response.data.ok === "true") {
            this.nickName = response.data.nickName;
            this.interest = response.data.interest;
            this.intro = response.data.intro;
            // this.isFriend = response.data.isFriend
            this.friendship_state = response.data.friendship_state;
          } else {
            console.log("not ok");
          }
        }.bind(this)
      )
      .catch((error) => {
        console.log(error);
      });
    friendship_state = 0;
  },
  methods: {
    sendFriendRequest: function () {
      console.log("friend req");
      /* [TODO]:userid還沒 targetid要進入時收到*/
      // axios
      // .post(server.apiUrl("/chat/"+this.Id+"/friend_request"),{uid:"a123",targetUid: this.Id})
      // .then(
      //     function(response){
      //         if(response.data.ok === "true"){
      //             console.log("ok")
      //         }
      //         else{
      //             console.log("not ok");
      //         }
      //     }.bind(this)
      // )
      // .catch(error => {
      //     console.log(error);
      // });
    },
    handleBack(fallback) {
      //處理點下上一頁按鈕的動作

      console.log("[this.$router]")
      console.log(this.$router)
      if (!this.fromRoute.name) {
        this.$router.push(fallback);
      } else {
        this.$router.back();
      }
    },
    handleLeft(){
      this.$router.push(`./Profile_left?profileId=${this.Id}&Id=${this.nickName}`);
    },
    handleRight(){
      this.$router.push(`./Profile_right?profileId=${this.Id}&Id=${this.nickName}`);
    },
  },
};
</script>

<style scoped lang="stylus">
.profile {
  width: 80vw;
  height: 80vh;
  text-align: center;
  padding: 5vh 5vw;
  box-sizing: border-box;
  font-family: Microsoft JhengHei;
  color: black;
  position: relative;

  .profilePicture {
  }

  .goBackBtn {
    position: absolute;
    top: 1.5vh;
    right: 3vw;
  }

  .profileMidWrap {
    display: flex;
    justify-content: space-between;

    .profileMessage {
      overflow: scroll;
      height: 37vh;
      box-sizing: border-box;

      .name {
        font-size: 1.6em;
        margin: 0.5em;
      }

      .hobbies {
        font-size: 1.2em;
        margin: 0.5em;
      }

      .description {
        font-size: 1.2em;
        margin: 0.5em;
      }

      p {
        color: gray;
      }
    }
  }

  .button {
    margin: calc(((10vh - 2.1em) / 2));
    background-color: #E8E8E8;
    border: none;
    border-radius: 0.5em;
    color: black;
    padding: 0.5em 1em;
    text-align: center;
    font-size: 1.1em;
    height: 2.5em;
  }
}
</style>