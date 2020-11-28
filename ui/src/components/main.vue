<template>
  <div ref="arGesture" class="arGesture">
    <toolbar style="position: fixed; width: 100vw; z-index: -999"></toolbar>
    <ar
      class="ar"
      v-bind:tap-coordinate="this.tapCoordinate"
      v-on:open="openUrl"
    ></ar>
    <friendList v-if="isShowFriendList" v-on:open="openUrl"></friendList>
    <timeLine v-if="isShowTimeLine" v-bind:date="timestamp"></timeLine>
    <div
      class="blackbg"
      v-if="showLightBox"
      @click.prevent="$router.back()"
    ></div>
    <div class="lightbox" v-show="showLightBox">
      <div class="container">
        <router-view name="lightBox" />
      </div>
    </div>
  </div>
</template>


<script>
import * as Hammer from "hammerjs";

// Lazy loading components
const Toolbar = () => import("./toolbar.vue");
const AR = () => import("./ar.vue");
const Gesture = () => import("./main_gesture.vue");
const FriendList = () => import("./friend_list_around.vue");
const TimeLine = () => import("./timeline.vue");

const oneDay = 86400000; //Timestamp coresponding to one day.
// var Content = "none";
export default {
  name: "main",
  data() {
    return {
      isShowFriendList: true,
      isShowTimeLine: false,
      canDoPan: true, //防止pinch之後會偵測到pan
      disableGesture: false,
      showLightBox: false,
      timestamp: +Date.now(), //時間軸的時間 預設為現在
      swipeDeadZone: 1, // Unit: ms
      tapCoordinate: { x: NaN, y: NaN }, //點擊時的座標位置
      // tapped: false,
      // swipedUp: false,
      // swiped: false,
      // testContent:Content
    };
  },
  components: {
    toolbar: Toolbar,
    ar: AR,
    gesture: Gesture,
    friendList: FriendList,
    timeLine: TimeLine,
  },
  watch: {
    $route: function (to, from) {
      // Prevent gesture recognition in sub-pages
      if (to.name !== "Main") {
        this.disableGesture = true;
        this.showLightBox = true;
      } else {
        this.disableGesture = false;
        this.showLightBox = false;
      }
    },
  },
  mounted() {
    var direction;
    var testElement = this.$refs.arGesture;
    var manager = new Hammer.Manager(testElement);
    var Test = this.$refs.arGesture;

    // var count = 0
    var tap = new Hammer.Tap({
      taps: 1,
      pointers: 1,
    });
    //點擊展開文章
    manager.add(tap);
    manager.on("tap", this.click.bind(this));
    //

    //上滑發文
    var swipe = new Hammer.Swipe({
      direction: Hammer.DIRECTION_ALL,
      pointers: 1,
    });

    manager.add(swipe);
    manager.on("swipeup", this.swipeUp.bind(this));
    // manager.on('swipeup', (function(event){
    //     // this.swipedUp = !this.swipedUp;
    //     // console.log(this);
    //      console.log("swipeup");
    //      if(this.isShowTimeLine)
    //         this.isShowTimeLine = !this.isShowTimeLine;
    //      Test.style.backgroundColor = "orange";
    // }).bind(this));
    //

    //左右滑動跳出時間軸
    var pan = new Hammer.Pan({
      direction: Hammer.DIRECTION_ALL,
      pointers: 1,
    });
    manager.add(pan);
    manager.on("panleft", this.panLeft.bind());
    manager.on("panright", this.panRight.bind());
    // manager.on('panleft', (function(event){

    //     // this.swiped = !this.swiped;
    //     // event.enable = true;
    //     console.log("panleft");
    //     this.isShowTimeLine=true;
    //     Test.style.backgroundColor = "blue";
    // }).bind(this));

    // manager.on('panright', (function(event){
    //     // this.swiped = !this.swiped;
    //     // event.enable = true;
    //     console.log("panright");
    //     this.isShowTimeLine=true;
    //     Test.style.backgroundColor = "yellow";
    // }).bind(this));
    //

    //Due to swipe and pan are asynchronous
    swipe.recognizeWith(pan);

    //縮小手勢將文章聚合
    var pinch = new Hammer.Pinch({
      direction: Hammer.DIRECTION_ALL,
      pointers: 2,
    });
    manager.add(pinch);
    manager.on("pinchend", this.pinch.bind(this));
    // manager.on('pinchend',(function(event){
    //     this.setNotDoPan();
    //     this.timer = setTimeout(this.setDoPan, 3000);
    //     // console.log(this);
    //     if(this.isShowTimeLine)
    //         this.isShowTimeLine = false;
    //     if(event.scale > 1){
    //         console.log("pinchout");
    //     }
    //     else{
    //         console.log("pinchin");
    //     }
    // }));

    //     manager.on('pinchin', (function(event){
    //         console.log("pinchin");
    //         if(this.isShowTimeLine)
    //             this.isShowTimeLine = !this.isShowTimeLine;
    //         Test.style.backgroundColor = "black";

    //     }));

    //    //放大手勢散開文章
    //     manager.on('pinchout', (function(event){
    //         console.log("pinchout");
    //         if(this.isShowTimeLine)
    //             this.isShowTimeLine = !this.isShowTimeLine;
    //         Test.style.backgroundColor  = "purple";
    //     }));
    window.addEventListener("resize", this.onWindowResize.bind(this));
  },
  methods: {
    openUrl(url) {
      var urlSlit = url.split("/");
      var urlSend = `${urlSlit[0]}/${urlSlit[1]}/${urlSlit[2]}?articleId=${urlSlit[3]}`;
      this.$router.push(urlSend);
    },
    click(event) {
      if (this.disableGesture) return;
      let { x, y } = event.center; //Get the tapping point
      this.tapCoordinate = { x, y };
      this.isShowTimeLine = false;
      this.$store.commit("show_all_articles");
    },
    swipeUp(event) {
      if (this.disableGesture) return;
      console.log("swipeup");
      this.isShowTimeLine = false;
      this.$store.commit("show_all_articles");
      this.openUrl("/main/post");
    },
    panLeft(event) {
      if (this.disableGesture) return;
      if (this.canDoPan) {
        console.log("panleft");
        if (this.$route.name == "Main") {
          this.isShowTimeLine = true;
        }
        this.timestamp += oneDay;
        this.canDoPan = false;
        setTimeout(() => {
          this.canDoPan = true;
        }, this.swipeDeadZone);
      }
    },
    panRight(event) {
      if (this.disableGesture) return;
      if (this.canDoPan) {
        console.log("panright");
        if (this.$route.name == "Main") {
          this.isShowTimeLine = true;
        }
        this.timestamp -= oneDay;
        this.canDoPan = false;
        setTimeout(() => {
          this.canDoPan = true;
        }, this.swipeDeadZone);
      }
    },
    pinch(event) {
      if (this.disableGesture) return;
      this.setNotDoPan();
      if (!this.canDoPan) {
        this.timer = setTimeout(this.setDoPan.bind(this), 1000);
        // console.log(this);
        if (this.isShowTimeLine) this.isShowTimeLine = false;
        if (event.scale > 1) {
          console.log("pinchout");
        } else {
          console.log("pinchin");
        }
      }
    },

    setDoPan() {
      //console.log("setDoPan");
      this.canDoPan = true;
    },
    setNotDoPan() {
      //console.log("setNotDoPan");
      this.canDoPan = false;
    },
    onWindowResize() {
      // Handle the virtual keyboard collapse event on mobile
      //if (!(document.activeElement instanceof HTMLInputElement)) {
      // Scroll to top
      window.scrollTo(0, 0);
      //}
    },
  },
};
</script>

<style lang="stylus" scoped>
toolbar {
  position: absolute;
  left: 0px;
  top: 0px;
  z-index: 3;
}

.ar {
  height: 100vh !important;
  width: 100vw;
  position: absolute;
  left: 0px;
  top: 0vh !important;
  z-index: -19999;
}

/* .gesture{
    height: 95vh !important;
    position:absolute;
    left:0px;
    top:5vh;
    z-index:-99999999;
   
} */
.arGesture {
  width: 100vw;
  height: 100vh;
  position: absolute;
  left: 0px;
  top: 0vh !important;
  background-color: black;
  transition: transform 300ms ease-out;
  z-index: -99999999;
  overflow: hidden;
}

.blackbg {
  background-color: #000000aa;
  width: 100%;
  height: 100%;
  position: fixed;
  top: 0;
  left: 0;
  z-index: -990;
}

.lightbox {
  position: absolute;
  top: 50%;
  left: 50%;
  margin-left: -40vw;
  margin-top: -45vh;
  background-color: white;
  font-family: Microsoft JhengHei, 'Roboto', sans-serif;
  height: 80vh;
  width: 80vw;
  border-radius: 10px;
  overflow: hidden;

  .container {
    position: relative;
  }
}

/* .expand{
    transform: scale(2.5);
  
}
.post{
    width:80%;
    height: 80%;
    position:fixed;
    left:0vw;
    top:0vh;
    background-color:silver;
}
.timeLine{
    width:80%;
    height:5%;
    position:fixed;
    left:10vw;
    top: 5vh;
    background-color: blue;
} */
</style>