 <template>
  <!-- todo: 高度修改(畫面 地圖大小 上傳圖片) 驗證機制(是否有圖片) POST的API 地圖 隱私等等設定清單 -->
  <div class="post">
    <header>
      <nav class="backAndNextButton" v-if="choosePicAndContent" >
        <img src="static/media/back.svg" @click.prevent="handleBack(fromRoute)" />
        <div class="nextButton" @click="nextPage">{{nextButtonName}}</div>
      </nav>
      <nav v-if="chooseLocation">
        <div class="postButton"  @click="post">{{postButtonName}}</div>
      </nav>
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
        <textarea placeholder="輸入文章內容" class="inputContent"></textarea>
      </div>
    </div>

    <div class="map" v-if="chooseLocation"></div>
    <div class="remind" v-if="chooseLocation">{{remindContent}}</div>
  </div>
</template>
<script>
export default {
  data() {
    return {
      nextButtonName: "下一步",
      upLoadPicName: "上傳照片",
      postButtonName:"發佈",
      hasUploadPic: false,
      img: null,
      fromRoute: null, //上一頁的參數
      choosePicAndContent: true,
      chooseLocation: false,
      remindContent: "請在地圖中選擇您所在的位置"
    };
  },

  beforeRouteEnter(to, from, next) {
    next(vm => {
      vm.fromRoute = from; //放上一頁參數
    });
  },

  mounted() {},
  methods: {
    changeImage(e) {
      const file = event.target.files.item(0); //取得File物件
      const reader = new FileReader(); //建立FileReader 監聽 Load 事件
      reader.addEventListener("load", this.imageLoader);
      reader.readAsDataURL(file);
    },
    imageLoader(event) {
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
    nextPage() {
      // document.location.href="/#/post_article_location";
      this.choosePicAndContent = false;
      this.chooseLocation = true;
    },
    post(){
      document.location.href="/#/main";
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
      background-color: pink;
      font-size: 25px;
      line-height: 1.5em;
    }

    .nextButton:active {
      background-color: white; // 可更改
    }
  }
  nav{
    padding: 1vh 1vw;
      display: flex;
      justify-content: flex-end;
    //MAP
      .postButton {
        width: 12vw;
        height: 1.5em;
        text-align: center;
        border: 0;
        border-radius: 10px;
        background-color: pink;
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
      background-color: pink;
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
      min-height: 20vh;
      font-size: 3vw;
      resize: none;
    }
  }
}

//MAP
.map {
  background-color: rgb(255, 255, 255, );
  height: 70vh;
  margin-top: 3vh;
  animation-name: slideUp;
  animation-duration: 1s;
}
//MAP
.remind {
  font-size: 5vw;
  text-align: center;
  margin-top: 2vh;
  animation-name: slideUp;
  animation-duration: 1s;
}
//MAP
@keyframes slideUp{
    from{
        margin-top: 100vh;
    }
    to{
        margin-top: 3vh;
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
    //MAP
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
        min-height: 37vh;
        font-size: 3vw;
      }
    }
  }

  @media screen and (min-height: 750px) and (max-height: 900px) {
    .postArticleBody {
      .textArea {
        .inputContent {
          min-height: 44vh;
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
