<template>
  <div class="app">
    <header>
      <nav class="goBackBtn">
        <img src="static/media/back.svg" />
      </nav>
    </header>
    <div class="articleBody">
      <div class="articleHeader">
        <nav class="articleAuthor">
          <!-- 前者是要丟給child(profile_picture) props的參數名稱 後者是在parent(article) data區域之參數名稱 -->
           <proPic  :diameter="parentDiameter"></proPic>
          <p>{{ autherName }}</p>
        </nav>
        <nav class="articleTime"></nav>
      </div>
      <div class="articlePictures">
        <ul>
          <li>
            <a>
              <img src="https://fakeimg.pl/2500x2000/ffff00/" />
            </a>
          </li>
          <li>
            <a>
              <img src="https://fakeimg.pl/2500x2000/ffff00/" />
            </a>
          </li>
          <li>
            <a>
              <img src="https://fakeimg.pl/2500x2000/ffff00/" />
            </a>
          </li>
          <li>
            <a>
              <img src="https://fakeimg.pl/2500x2000/ffff00/" />
            </a>
          </li>
          <li>
            <a>
              <img src="https://fakeimg.pl/2500x2000/ffff00/" />
            </a>
          </li>
        </ul>
        <ol>
          <li class="on"></li>
          <li></li>
          <li></li>
          <li></li>
          <li></li>
        </ol>
      </div>
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
import ProPic from './profile_picture.vue'

export default {
  // name: "",

  data() {
    return {
      message: "",
      autherName: "Auther",
      articleTexts: "",
      //parentDiameter是要丟給ProPic的直徑長度
      parentDiameter:'2em'
    };
  },
  components:{
    // 新增大頭照的components tag命名為proPic
    proPic:ProPic
  },
  mounted() {
    this.articleImage(), this.articleText();

  },
  methods: {
    sendRespondMessage: function() {
      this.message;
    },
    articleText() {
      this.articleTexts = "testetstetstetstetsttestet";
    },
    articleImage() {
      document.addEventListener(
        "DOMContentLoaded",
        function() {
          var oBox = document.querySelector(".articlePictures");
          var oUl = oBox.getElementsByTagName("ul")[0];
          var aLi = oUl.children;
          var oOl = oBox.getElementsByTagName("ol")[0];
          var aBtn = oOl.children;
          var aA = oUl.getElementsByTagName("a");
          //複製一個
          oUl.innerHTML += oUl.innerHTML;
          oUl.style.width = aLi.length * aLi[0].offsetWidth + "px";
          var W = oUl.offsetWidth / 2;
          var tX = 0;
          var iNow = 0;
          oUl.addEventListener(
            "touchstart",
            function(ev) {
              var downX = ev.targetTouches[0].pageX;
              var disX = downX - tX;
              clearInterval(oUl.timer);
              function fnMove(ev) {
                tX = ev.targetTouches[0].pageX - disX;
                if (tX < 0) {
                  oUl.style.WebkitTransform = "translateX(" + (tX % W) + "px)";
                } else {
                  oUl.style.WebkitTransform =
                    "translateX(" + (((tX % W) - W) % W) + "px)";
                }
                ev.preventDefault();
              }
              function fnEnd(ev) {
                var upX = ev.changedTouches[0].pageX;
                if (Math.abs(downX - upX) < 50) {
                  startMove(oUl, -iNow * aLi[0].offsetWidth);
                } else {
                  if (downX > upX) {
                    //++
                    iNow++;
                    startMove(oUl, -iNow * aLi[0].offsetWidth);
                    tab();
                  } else {
                    iNow--;
                    startMove(oUl, -iNow * aLi[0].offsetWidth);
                    tab();
                  }
                }
                oUl.removeEventListener("touchmove", fnMove, false);
                oUl.removeEventListener("touchend", fnEnd, false);
              }
              oUl.addEventListener("touchmove", fnMove, false);
              oUl.addEventListener("touchend", fnEnd, false);
            },
            false
          );

          //按鈕切換
          function tab() {
            for (var i = 0; i < aBtn.length; i++) {
              aBtn[i].className = "";
            }
            console.log(iNow);
            if (iNow > 0) {
              aBtn[iNow % aBtn.length].className = "on";
            } else {
              aBtn[
                ((iNow % aBtn.length) + aBtn.length) % aBtn.length
              ].className = "on";
            }
          }

          function startMove(obj, iTarget) {
            clearInterval(obj.timer);
            var count = Math.floor(500 / 30);
            var start = tX;
            var dis = iTarget - start;
            var n = 0;
            obj.timer = setInterval(function() {
              n++;
              var a = 1 - n / count;
              tX = start + dis * (1 - a * a * a);
              if (tX < 0) {
                oUl.style.WebkitTransform = "translateX(" + (tX % W) + "px)";
              } else {
                oUl.style.WebkitTransform =
                  "translateX(" + (((tX % W) - W) % W) + "px)";
              }
              if (n == count) {
                clearInterval(obj.timer);
              }
            }, 30);
          }

          oUl.addEventListener(
            "click",
            function() {
              var n =
                iNow > 0
                  ? iNow % aBtn.length
                  : ((iNow % aBtn.length) + aBtn.length) % aBtn.length;
              window.location.href = aA[n].dataset.href;
            },
            false
          );
        },
        false
      );
    }
  }
};
</script>

<style scoped lang="stylus">
body {
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
    width: 100vw;
    // height: 45vh;
    margin: 2vh auto;
    overflow: hidden;
    position: relative;

    ul {
      display: flex;
      flex-direction: row;
      align-items: flex-start;

      li a img {
        width: 100vw;
        height: auto;
        object-position: center;
        object-fit: cover;
      }
    }

    ol {
      width: 90px;
      position: absolute;
      bottom: 8px;
      left: 50%;
      margin-left: -45px;

      li {
        width: 10px;
        height: 10px;
        background: #999;
        border-radius: 50%;
        float: left;
        margin: 3px;
      }

      .on {
        background: #ffffff;
      }
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
