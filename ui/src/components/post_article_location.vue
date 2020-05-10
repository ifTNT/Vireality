 <template>
  <!--這頁廢掉了XDD todo: -->
  <div class="chooseLocation">
    <header>
      <nav>
        <!-- @click="nextPage" -->
        <div class="postButton">{{postButtonName}}</div>
      </nav>
    </header>
    <div class="map"></div>
    <div class="remind">{{remindContent}}</div>
  </div>
</template>
<script>
export default {
  data() {
    return {
      postButtonName: "發布",
      remindContent:"請在地圖中選擇您所在的位置"
    };
  },

  mounted() {},
  methods: {}
};
</script>

<style scoped lang="stylus">
.chooseLocation {
  background-color: rgba(0, 0, 0, 0.4);
  font-family: Microsoft JhengHei, 'Roboto Slab', serif;
  height:100vh;
  width: 100vw;

  header {
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
        background-color: pink;
        font-size: 25px;
        line-height: 1.5em;
      }

      .postButton:active {
        background-color: white; // 可更改
      }
    }
  }

  .map {
    background-color: rgb(255, 0, 0, );
    height: 70vh;
    margin-top: 8vh;
  }

  .remind {
      font-size : 5vw;
      text-align :center;
      margin-top: 2vh;
  }
}
</style>
