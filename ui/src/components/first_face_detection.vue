<template>
<div class="camera">
  <div class="firstFaceDetection">
    <!-- 告訴使用者要如何偵測 -->
    <div class="teachDescription">{{ teachMessage }}</div>
    <!-- 偵測不到臉部的時候需要顯示什麼 正常時不顯示-->
    <div class="warningNoDetection" v-if="showWarningMessage">
      <img class="warningImg" src="/static/media/warning.png" />
      <span class="warningMessage">{{ warningMessage }}</span>
    </div>
    <!-- 顯示進度圈圈 -->
    <img class="progressFaceDetection" src="/static/media/loader.png" />
    <!-- 完成之後會顯示此圖 未完成時不出現 -->
    <img
      v-if="showCompeleteFaceDetection"
      class="compeleteFaceDetection"
      src="/static/media/compelete.png"
    />
  </div> 
  <!-- <loading-progress
  :progress="progress"
  :indeterminate="indeterminate"
  :counter-clockwise="counterClockwise"
  :hide-background="hideBackground"
  size="64"
  rotate
  fillDuration="2"
  rotationDuration="1"
/>-->
</div>
</template>
<script>
/*import Vue from 'vue'
import VueProgress from 'vue-progress-path'
import 'vue-progress-path/dist/vue-progress-path.css'
Vue.use(VueProgress, {
  // defaultShape: 'circle',
})*/

export default {
  name: "first_face_detection",
  data() {
    return {
      // 顯示怎麼偵測的文字
      teachMessage: "請慢慢轉動頭部，直到中間圈圈填滿",
      // 顯示偵測不到臉部的訊息以及是否顯示 正常情況不會顯示
      warningMessage: "偵測不到臉部T^T",
      showWarningMessage: true,
      // 顯示完成掃描的圖 正常情況不會顯示
      showCompeleteFaceDetection: true
    };
  },
};
</script>
<style scoped>

.camera{
  height: 100vh;
  width: 100vw;
 /*以下純測試用 加入相機後可以刪除的部分*/
  background-image: url("/static/media/testPic.jpg");
  background-size: cover;
}

.firstFaceDetection {
  /* 設定每個方塊垂直置中 */
  height: 100vh;
  display: flex;
  /*justify-content: center;*/
  flex-direction: column;
  align-items: center;
  font-family: "Microsoft JhengHei", Arial, Helvetica, sans-serif;
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
  position: fixed;
  top: 50vh;
  left: 50vw;
  margin-left: -15vw;
  margin-top: -15vw;
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