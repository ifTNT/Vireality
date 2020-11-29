<template>
  <div class="profile_right">
    
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
    this.id = this.$route.query.profileId;
    // id for test
    this.id = "a123";
    // To pass cookies to server
    axios.defaults.withCredentials = true;
    axios
      .get(server.apiUrl(`/articles/user/${this.id}`))
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
.profile_right {
}
</style>