<template>
  <div class="app">
    <header>
      <nav class="goBackBtn">
        <img src="static/media/back.svg" @click.prevent="handleBack(fromRoute)"/>
      </nav>
    </header>
    <div class="articleBody">
      <div class="articleHeader">
        <nav class="articleAuthor">
          <!-- 前者是要丟給child(profile_picture) props的參數名稱 後者是在parent(article) data區域之參數名稱 -->
          <proPic :diameter="parentDiameter" :Id="author"></proPic>
          <p>{{ authorName }}</p>
        </nav>
        <nav class="articleTime">{{postTime}}</nav>
      </div>
      <div id="articlePictures" class="articlePictures">
        <img
          v-for="(src,index) in articlPicture"
          :key="index"
          :src="src"
          @touchstart="touchstart"
          @touchmove="touchmove"
        />
      </div>
      <ul>
        <li v-for="(src,index) in articlPicture" :key="index">
          <span v-if="nowSelect==index" :style="{color: 'rgba(0,0,0,0.6)'}">●</span>
          <span v-if="nowSelect!=index" :style="{color: 'rgba(40,40,40,0.6)'}">●</span>
        </li>
      </ul>
      <div class="articleText">
        <p style="width:300px;height:100px;">{{articleTexts}}</p>
      </div>
      <div class="articleRespondBlock">
        <div class="wrapInput">
          <input v-model="message" />
          <!-- onclick -->
          <nav class="send" v-on:click="sendRespondMessage">
            <img src="static/media/send.svg" alt />
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import axios from "axios";
import ProPic from "./profile_picture.vue";

export default {
  // name: "",

  data() {
    return {
      fromRoute: null, //上一頁的參數
      message: "",
      authorName: "Author",
      articleTexts: "",
      //parentDiameter是要丟給ProPic的直徑長度
      parentDiameter: "2em",
      articlPicture: [],
      postTime: "",
      isStory: "",
      startPointX: 0,
      changePointX: 0,
      showIndex: 0,
      nowSelect: 0
    };
  },
  beforeRouteEnter(to, from, next) {
    next(vm => {
      vm.fromRoute = from; //放上一頁參數
    });
  },
  components: {
    // 新增大頭照的components tag命名為proPic
    proPic: ProPic
  },
  mounted() {
    this.getArticleDetail();
  },
  methods: {
    getArticleDetail() {
      const articleId = location.href.split("/").pop();
      console.log(articleId);
      axios
        // .get(server.apiUrl("/article/"+ articleId))
        .get(server.apiUrl("/article/" + "5235")) // test
        .then(
          function(response) {
            if (response.data.ok === "true") {
              this.articlPicture = response.data.thumbnail;
              this.articleTexts = response.data.text;
              this.authorName = response.data.author;
              this.isStory = response.data.isStory;
              if (Date.now() - parseInt(response.data.postTime) < 86400000) {
                const pathTime =
                  Date.now() - parseInt(response.data.postTime) / 1000;
                if (pathTime < 60)
                  this.postTime = "".concat(pathTime, " sec ago");
                else if (pathTime < 3600)
                  this.postTime = "".concat(
                    parseInt(pathTime / 60),
                    " min ago"
                  );
                else
                  this.postTime = "".concat(
                    parseInt(pathTime / 3600),
                    " hour ago"
                  );
              } else {
                const d = new Date(parseInt(response.data.postTime));
                this.postTime = "".concat(
                  d.getFullYear(),
                  "/",
                  d.getMonth() + 1,
                  "/",
                  d.getDate()
                );
              }
            } else {
              console.log("not ok");
              window.location.herf = window.history;
            }
          }.bind(this)
        )
        .then(() => {
          this.articleImage();
        })
        .catch(error => {
          console.log(error);
          window.location.herf = window.history;
        });
    },
    sendRespondMessage: function() {
      this.message;
      // const articleId = location.href.split("/").pop();
      const articleId = 5623;//test

      axios.
      post(server.apiUrl("/chat/" + articleId + "/response"),null,
      { params:{articleId:22525,
      uid:523654,
      message:"loren%20alfedv%20efef"}})
      .then(
        function(response) {
          console.log(response)
        }.bind(this)
      )
      .catch(error => {
        console.log(error);
      });
    },
    show(index) {
      this.changePointX = this.startPointX;
      let slider = document.getElementById("articlePictures");
      slider.style.marginLeft = `-${95 * index}vw`;
      this.nowSelect = index;
    },
    touchstart(e) {
      this.startPointX = e.changedTouches[0].pageX;
    },
    touchmove(e) {
      if (this.startPointX == this.changePointX) {
        return;
      }
      let currPointX = e.changedTouches[0].pageX;
      let leftSlide = this.startPointX - currPointX;
      if (leftSlide > 30 && this.showIndex < this.articlPicture.length - 1) {
        this.show(++this.showIndex);
      } else if (leftSlide < -30 && this.showIndex > 0) {
        this.show(--this.showIndex);
      }
    },
    handleBack(fallback) {
      //處理點下上一頁按鈕的動作
      if (!this.fromRoute.name) {
        this.$router.push(fallback);
      } else {
        this.$router.back();
      }
    }
  }
};
</script>

<style scoped lang="stylus">

.app {
  background-color: gray;
  color: white;
}

header {
  .goBackBtn {
    padding: 1vh 1vw;

    img {
      height: 1.5em;
    }
  }
}

.articleBody {
  margin: 1vh 0;
  height: 92vh;
  position: relative;

  .articleHeader {
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    .articleAuthor {
      display: flex;
      flex-direction: row;
      justify-content: flex-start;

      proPic {
        display: inline-block;
        width: 2em;
        height: 2em;
      }

      p {
        display: inline-block;
        font-size: 1.2em;
        padding: 0.3em 0.5em;
        text-align: center;
      }
    }
  }

  .articlePictures {
    overflow: hidden;
    white-space: nowrap;
    transition: 1s;
    padding: 0 2.5vw;

    img {
      width: 90vw;
      display: inline;
      margin-right: 2.5vw;
      margin-left: 2.5vw;
    }
  }

  ul {
    z-index: 100;
    margin-right 30vw
    margin-left 30vw
    margin-top -3vh
    margin-bottom 3vh
    width 40vw
    display flex
    justify-content center

    // margin-left
    li {
      display: inline-block;
      width: 2em;
      height: 2em;
      text-align center
    }
  }

  .articleText {
    margin: 1vh auto;
    width: 100vw;
    padding: 0 5vw;
    box-sizing: border-box;

    textarea {
      border: 0;
      background: rgba(0, 0, 0, 0);
      min-height: 25vh;
    }
  }

  .articleRespondBlock {
    margin: 1vh 2.5vw;
    width: 95vw;
    position: absolute;
    bottom: 0;

    .wrapInput {
      position: relative;

      input {
        -webkit-box-sizing: border-box; /* Safari/Chrome, other WebKit */
        -moz-box-sizing: border-box; /* Firefox, other Gecko */
        box-sizing: border-box; // IE
        background: rgba(0, 0, 0, 0);
        border-radius: 2em;
        height: 2.5em;
        width: 100%;
        color: white;
        padding-left: 1em;
        padding-right: 3em;
        -webkit-appearance: none;
      }

      nav {
        z-index: 100;
        position: absolute;
        top: 0;
        right: 0;
        margin: 0.25em 0.3em 0.3em 0.3em;
        padding: 0.2em 0.2em 0.3em 0.2em;

        img {
          width: 1.2em;
          height: 1.2em;
        }
      }
    }
  }
}
</style>
