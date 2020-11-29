 <template>
  <!-- [TODO]: 高度修改(畫面 地圖大小 上傳圖片) -->
  <!-- 個人文章還沒抓到個人定位 -->
  <div>
    <nav class="backAndNextButton">
      <font-awesome-icon
        icon="chevron-left"
        class="backButton"
        size="2x"
        @click.prevent="handleBack(fromRoute)"
      />
      <div
        class="btn"
        v-if="choosePicAndContent && this.img != null"
        @click="nextSetPage"
      >
        {{ nextButtonName }}
      </div>
      <div
        class="btn"
        @click="post"
        v-if="(chooseLocation || placeOrPersonal) && geolocationReady"
      >
        {{ postButtonName }}
      </div>
      <div
        class="btn"
        @click="nextSetLocationPage"
        v-if="choseTypeAndPrivacy && !placeOrPersonal"
      >
        {{ nextButtonName }}
      </div>
    </nav>

    <div class="postArticleBody" v-if="choosePicAndContent">
      <div class="picture">
        <label for="article-file">
          <div class="uploadPicButton" v-if="!hasUploadPic">
            <font-awesome-icon icon="upload" class="backButton" size="3x" />
          </div>
          <div class="imgContainer" v-if="hasUploadPic">
            <img class="pic" :src="img" />
          </div>
          <!-- 選擇檔案按鈕 但因為需要美化 因此直接display none -->
        </label>
        <input
          id="article-file"
          type="file"
          accept="image/jpg, image/jpeg, image/png, image/gif"
          @change="changeImage"
          multiple
          style="display: none"
        />
        <!-- <div
          @click="hasUploadPic = false"
          v-if="hasUploadPic"
          class="cancelButton"
        >
          <font-awesome-icon icon="times-circle" size="2x" />
        </div> -->
      </div>
      <textarea
        placeholder="輸入文章內容"
        class="inputContent"
        v-model="content"
      ></textarea>
    </div>

    <div class="TypeAndPrivacy" v-if="choseTypeAndPrivacy">
      <h2>誰可以看到您的文章</h2>
      <div class="privacy">
        <span>好友</span>
        <switches
          v-model="allOrFriend"
          theme="bootstrap"
          color="info"
        ></switches>
        <span>所有人</span>
      </div>

      <!-- <h2>挑選您的文章類型</h2>
      <div class="type">
        <span>地點文章</span>
        <switches v-model="placeOrPersonal" theme="bootstrap" color="info"></switches>
        <span>個人</span>
      </div>-->
    </div>

    <mapbox
      v-on:childByValue="childByValue"
      class="map"
      mapWidth="100%"
      mapHeight="calc(80vh - 3rem)"
      v-if="chooseLocation"
    ></mapbox>
    <!-- <div class="map" id="googleMap" v-if="chooseLocation" ></div> -->
    <div class="remind" v-if="chooseLocation">{{ remindContent }}</div>
  </div>
</template>

<script>
// import google from 'vue2-google-maps'
import Mapbox from "./mapbox.vue";
import Switches from "vue-switches";
import screenfull from "screenfull";

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
      geolocationReady: false,
      remindContent: "請在地圖中選擇您所在的位置",
      choseTypeAndPrivacy: false,
      allOrFriend: false,
      placeOrPersonal: false,
      // map: null,
      longitude: 0,
      latitude: 0,
      file: "",
    };
  },

  beforeRouteEnter(to, from, next) {
    next((vm) => {
      vm.fromRoute = from; //放上一頁參數
    });
  },
  components: {
    // 新增大頭照的components tag命名為proPic
    mapbox: Mapbox,
    Switches,
  },
  mounted() {},
  methods: {
    childByValue: function (lng, lat) {
      // childValue就是子组件传过来的值
      this.latitude = lat;
      this.longitude = lng;
      this.geolocationReady = true;
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

      // Enter full screen again
      screenfull.request();
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
      console.log("!!!!POST!!!!");
      /* IMGUR */

      let formData = new FormData();
      console.log(this.file);
      formData.append("image", this.file); //required
      console.log(formData.get("image"));
      this.axios
        .post(server.apiUrl("/article/"), {
          text: this.content,
          isPublic: this.allOrFriend,
          post_time: Date.now(),
          /* [TODO]: 上傳檔案僅能一張 FormData, 圖片集*/
          thumbnail: this.img,
          lon: this.longitude,
          lat: this.latitude,
        })
        .then(
          function (response) {
            console.log(response);
          }.bind(this)
        )
        .catch((error) => {
          console.log(error);
        });
      // Go back to main
      this.$router.back();
    },
  },
};
</script>

<style scoped lang="stylus">
.backAndNextButton {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1em;
  height: 3em;
  background: rgba(255, 255, 255, 0.8);
  box-sizing: border-box;

  .btn {
    height: 2em;
    padding: 0.5em;
    box-sizing: border-box;
    text-align: center;
    border: solid 1px black;
    border-radius: 10px;
    font-size: 0.9rem;
  }

  .btn:active {
    background-color: black;
    color: white;
  }
}

.postArticleBody {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: calc(80vh - 3rem);
  overflow-y: scroll;

  .picture {
    // Aspect-ratio: 1:1
    width: 80vw;
    height: 80vw;
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: center;

    .uploadPicButton {
      padding: 1em;
      width: 5em;
      height: 5em;
      box-sizing: border-box;
      text-align: center;
      border: 0;
      border-radius: 50%;
      background-color: #76a5af;
      color: white;
    }

    .uploadPicButton:active {
      background-color: #45818e;
    }

    img {
      width: 80vw;
      height: 80vw;
      object-fit: cover;
      // display: inline;
      // margin-right: 2.5vw;
      // margin-left: 2.5vw;
    }

    .cancelButton {
      height: 100%;
      display: flex;
      justify-conetnt: flex-start;
    }
  }

  .inputContent {
    width: 80%;
    margin: 2em 0;
    background: white;
    min-height: 10em;
    resize: none;
  }
}

// MAP
.map {
  animation-name: fadein;
  animation-duration: 1s;
}

// MAP
.remind {
  position: relative;
  top: -3rem;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 4rem;
  box-sizing: border-box;
  background: #ffffffaa;
  animation-name: slideUp;
  animation-duration: 1s;
  z-index: 999;
}

// MAP
@keyframes fadin {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
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
</style>
