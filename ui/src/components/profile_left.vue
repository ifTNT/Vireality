<template>
  <div class="profile_left">
    <font-awesome-icon
      icon="chevron-right"
      class="rightButton"
      size="2x"
      @click.prevent="handleback()"
    />
    <h2>{{ articles.length }}</h2>
    <h2>{{ testMessage }}</h2>
    <ul id="example-1">
      <li v-for="(article, index) in articles" :key="index">
        <img src="article.img" alt="" />
        <p>article.post_time</p>
      </li>
    </ul>
  </div>
</template>
<script>
import axios from "axios";

export default {
  name: "profile_left",
  data() {
    return {
      Id: "",
      articles: [],
      testMessage: "",
    };
  },
  components: {},
  mounted() {
    this.Id = this.$route.query.profileId;
    this.Id = "a123";
    // To pass cookies to server
    this.axios
      .get(server.apiUrl(`/articles/user/${this.Id}`))
      .then((res) => {
        console.log(`[articleList] Article list fetched.`);
        res = res.data;
        if (res.ok !== "true") {
          console.log("[articleList] Get article list failed.");
        } else {
          res.result.forEach(async (article) => {
            console.log(article);
            this.articles.push({
              img: article.thumbnail,
              postTime: article.post_time,
              articleId: article.article_id,
            });
          });
        }
      })
      .then(() => {
        for (var i in this.articles.length) {
          if (Date.now() - parseInt(this.articles[i].post_time) < 86400000) {
            const pathTime =
              (Date.now() - parseInt(this.articles[i].post_time)) / 1000;
            if (pathTime < 60)
              this.articles[i].post_time = "".concat(
                parseInt(pathTime),
                " sec ago"
              );
            else if (pathTime < 3600)
              this.articles[i].post_time = "".concat(
                parseInt(pathTime / 60),
                " min ago"
              );
            else
              this.articles[i].post_time = "".concat(
                parseInt(pathTime / 3600),
                " hour ago"
              );
          } else {
            const d = new Date(parseInt(this.articles.post_time));
            this.articles[i].post_time = "".concat(
              d.getFullYear(),
              "/",
              d.getMonth() + 1,
              "/",
              d.getDate()
            );
          }
        }
      });
    friendship_state = 0;
  },
  methods: {
    handleBack(fallback) {
      //處理點下上一頁按鈕的動作
      console.log("testtest");
      if (!this.fromRoute.name) {
        this.$router.push(fallback);
      } else {
        this.$router.back();
      }
    },
  },
};
</script>

<style scoped lang="stylus">
.profile_left {
  width: 80vw;
  height: 80vh;
  text-align: center;
  padding: 5vh 5vw;
  box-sizing: border-box;
  overflow: scroll;
  li{
      height 40vh
      width 70vw
      margin 1em 5vw
  }
}
</style>