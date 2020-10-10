 <template>
  <!-- [TODO]: 高度修改(畫面 地圖大小 上傳圖片) -->
  <!-- 個人文章還沒抓到個人定位 -->
  <div class="post">
    <header>
      <nav class="backAndNextButton">
        <img src="static/media/back.svg" @click.prevent="handleBack(fromRoute)" />
        <div
          class="nextButton"
          v-if="choosePicAndContent && this.img != null"
          @click="nextSetPage"
        >{{nextButtonName}}</div>
        <div
          class="postButton"
          @click="post"
          v-if="chooseLocation||placeOrPersonal"
        >{{postButtonName}}</div>
        <div
          class="nextButton"
          @click="nextSetLocationPage"
          v-if="choseTypeAndPrivacy && !placeOrPersonal"
        >{{nextButtonName}}</div>
      </nav>
      <nav></nav>
    </header>

    <div class="postArticleBody" v-if="choosePicAndContent">
      <div class="picture">
        <label class="uploadPicButton">
          {{upLoadPicName}}
          <!-- 選擇檔案按鈕 但因為需要美化 因此直接display none -->
          <input
            type="file"
            accept="image/jpg, image/jpeg, image/png, image/gif"
            @change="changeImage"
            multiple
            style="display:none"
          />
        </label>
        <img class="pic" v-if="hasUploadPic" :src="img" />
      </div>
      <div class="textArea">
        <textarea placeholder="輸入文章內容" class="inputContent" v-model="content"></textarea>
      </div>
    </div>

    <div class="TypeAndPrivacy" v-if="choseTypeAndPrivacy">
      <h2>誰可以看到您的文章</h2>
      <div class="privacy">
        <span>所有人</span>
        <switches v-model="allOrFriend" theme="bootstrap" color="info"></switches>
        <span>好友</span>
      </div>

      <!-- <h2>挑選您的文章類型</h2>
      <div class="type">
        <span>地點文章</span>
        <switches v-model="placeOrPersonal" theme="bootstrap" color="info"></switches>
        <span>個人</span>
      </div> -->
    </div>

    <mapbox
      v-on:childByValue="childByValue"
      class="map"
      mapWidth="100vw"
      mapHeight="70vh"
      v-if="chooseLocation"
    ></mapbox>
    <!-- <div class="map" id="googleMap" v-if="chooseLocation" ></div> -->
    <div class="remind" v-if="chooseLocation">{{remindContent}}</div>
  </div>
</template>

<script>
// import google from 'vue2-google-maps'
import Mapbox from "./mapbox.vue";
import Switches from "vue-switches";
import axios from "axios";

export default {
  data() {
    return {
      nextButtonName: "下一步",
      upLoadPicName: "上傳照片",
      postButtonName: "發佈",
      hasUploadPic: false,
      img: null,
      fromRoute: null, //上一頁的參數
      content: "",
      choosePicAndContent: true,
      chooseLocation: false,
      remindContent: "請在地圖中選擇您所在的位置",
      choseTypeAndPrivacy: false,
      allOrFriend: false,
      placeOrPersonal: false,
      // map: null,
      longitude: 0,
      latitude: 0
    };
  },

  beforeRouteEnter(to, from, next) {
    next(vm => {
      vm.fromRoute = from; //放上一頁參數
    });
  },
  components: {
    // 新增大頭照的components tag命名為proPic
    mapbox: Mapbox,
    Switches
  },
  mounted() {},
  methods: {
    childByValue: function(lng, lat) {
      // childValue就是子组件传过来的值
      this.latitude = lat;
      this.longitude = lng;
    },
    changeImage(e) {
      const file = event.target.files.item(0); //取得File物件
      const reader = new FileReader(); //建立FileReader 監聽 Load 事件
      reader.addEventListener("load", this.imageLoader);
      reader.readAsDataURL(file);
    },
    imageLoader(event) {
      // console.log(event.target.result)
      this.img = event.target.result;
      this.hasUploadPic = true;
    },

    handleBack(fallback) {
      //處理點下上一頁按鈕的動作
      if (!this.fromRoute.name) {
        this.$router.push(fallback);
      } else {
        this.$router.back();
      }
    },
    nextSetPage() {
      // document.location.href="/#/post_article_location";
      this.choosePicAndContent = false;
      this.choseTypeAndPrivacy = true;
      console.log(this.content);
    },
    nextSetLocationPage() {
      this.choseTypeAndPrivacy = false;
      this.chooseLocation = true;
    },
    post() {
      console.log("!!!!POST!!!!")
      axios.post(server.apiUrl("/article/" ),
        {
            /* [TODO]:uid還沒拿到 */
            author: "a123", //test
            text: this.content,
            isPuclic: this.allOrFriend,
            post_time: Date.now(),
            /* [TODO]: 上傳檔案還不能顯示全部圖片 僅能顯示第一張 且尚未上傳到imgur */
            // thumbnail: [String] FormData, 圖片集
            lon: this.longitude,
            lat: this.latitude
          },
        )
        .then(
          function(response) {
            console.log(response);
          }.bind(this)
        )
        .catch(error => {
          console.log(error);
        });
      // document.location.href = "/#/main";
    }
  }
};
</script>

<style scoped lang="stylus">
.post {
  background-color: rgba(0, 0, 0, 0.4);
  font-family: Microsoft JhengHei, 'Roboto Slab', serif;
  height: 100vh;
  width: 100vw;
}

header {
  .backAndNextButton {
    display: flex;
    Justify-content: space-between;
    align-items: center;
    padding: 1vh 1vw;

    img {
      height: 1.5em;
    }

    .nextButton {
      width: 12vw;
      height: 1.5em;
      text-align: center;
      border: 0;
      border-radius: 10px;
      background-color: white;
      font-size: 25px;
      line-height: 1.5em;
    }

    .nextButton:active {
      background-color: white; // 可更改
    }
  }

  nav {
    padding: 1vh 1vw;
    display: flex;
    justify-content: flex-end;

    .postButton {
      width: 12vw;
      height: 1.5em;
      text-align: center;
      border: 0;
      border-radius: 10px;
      background-color: white;
      font-size: 25px;
      line-height: 1.5em;
    }
  }
}

.postArticleBody {
  margin: 1vh 0;
  height: 91vh;
  position: relative;

  .picture {
    padding: 0 2.5vw;
    width: 90vw;
    height: 90vw;

    .uploadPicButton {
      width: 15vw;
      height: 2em;
      line-height: 2em;
      text-align: center;
      border: 0;
      border-radius: 10px;
      background-color: white;
      font-size: 30px;
      position: fixed;
      top: 50vh;
      left: 50vw;
      margin-left: -7vw;
      margin-top: -10vh;
    }

    .uploadPicButton:active {
      background-color: white; // 可更改
    }

    img {
      width: 90vw;
      height: 90vw;
      display: inline;
      margin-right: 2.5vw;
      margin-left: 2.5vw;
    }
  }

  .textArea {
    margin: 1vh auto;
    width: 100vw;
    padding: 0 5vw;
    box-sizing: border-box;

    .inputContent {
      width: 87 vw;
      padding: 1vh;
      background: white;
      min-height: 10em;
      font-size: 3vw;
      resize: none;
    }
  }
}

// MAP
.map {
  // background-color: rgb(255, 255, 255, );
  height: 70vh;
  width: 100vw;
  margin-top: 3vh;
  animation-name: slideUp;
  animation-duration: 1s;
}

// MAP
.remind {
  font-size: 5vw;
  text-align: center;
  margin-top: 2vh;
  animation-name: slideUp;
  animation-duration: 1s;
}

// MAP
@keyframes slideUp {
  from {
    margin-top: 100vh;
  }

  to {
    margin-top: 3vh;
  }
}

// chose type
.TypeAndPrivacy {
  text-align: center;
  margin-top: 25vh;

  h2 {
    font-weight: bold;
  }

  .privacy, .type {
    margin: 3vh 0;
  }
}

@media screen and (min-width: 500px) and (max-width: 900px) {
  .postArticleBody {
    .picture {
      .uploadPicButton {
        font-size: 25px;
        width: 15vw;
      }
    }
  }
}

@media screen and (min-width: 300px) and (max-width: 695px) {
  header {
    .backAndNextButton {
      .nextButton {
        width: 14vw;
        font-size: 13px;
      }
    }

    // MAP
    nav {
      .postButton {
        font-size: 13px;
        width: 14vw;
      }
    }
  }

  .postArticleBody {
    .picture {
      .uploadPicButton {
        width: 25vw;
        font-size: 15px;
        margin-left: -12vw;
        margin-top: -18vh;
      }
    }
  }

  .postArticleBody {
    .textArea {
      .inputContent {
        min-height: 10em;
        font-size: 3vw;
      }
    }
  }

  @media screen and (min-height: 750px) and (max-height: 900px) {
    .postArticleBody {
      .textArea {
        .inputContent {
          min-height: 10em;
          font-size: 3vw;
        }
      }
    }

    .postArticleBody {
      .picture {
        .uploadPicButton {
          margin-left: -12vw;
          margin-top: -23vh;
        }
      }
    }
  }
}
</style>
