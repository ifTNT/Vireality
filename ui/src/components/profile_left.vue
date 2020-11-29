<template>
  <div class="profile_left">
    <font-awesome-icon
      icon="chevron-right"
      class="rightButton"
      size="2x"
      @click.prevent="$router.back()"
    />
    <ul id="example-1">
      <li v-for="(article, index) in articles" :key="index">
        <img
          :src="article.img"
          alt=""
          @click.prevent="handleToArticle(article.articleId)"
        />
        <p>{{ article.postTime }}</p>
        <div class="bottomLine"></div>
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
    };
  },
  components: {},
  mounted() {
    this.id = this.$route.params.id;
    // To pass cookies to server
    this.axios.get(server.apiUrl(`/articles/user/${this.Id}`)).then((res) => {
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
      for (var i = 0; i < this.articles.length; i++) {
        console.log(i);

        console.log(parseInt(new Date(this.articles[i].postTime).getTime()));

        if (
          Date.now() - parseInt(new Date(this.articles[i].postTime).getTime()) <
          86400000
        ) {
          const pathTime =
            (Date.now() -
              parseInt(new Date(this.articles[i].postTime).getTime())) /
            1000;
          if (pathTime < 60)
            this.articles[i].postTime = "".concat(
              parseInt(pathTime),
              " sec ago"
            );
          else if (pathTime < 3600)
            this.articles[i].postTime = "".concat(
              parseInt(pathTime / 60),
              " min ago"
            );
          else
            this.articles[i].postTime = "".concat(
              parseInt(pathTime / 3600),
              " hour ago"
            );
        } else {
          const d = new Date(this.articles[i].postTime);
          this.articles[i].postTime = "".concat(
            d.getFullYear(),
            "/",
            d.getMonth() + 1,
            "/",
            d.getDate()
          );
        }
      }
      //   console.log(this.articles);
    });
    friendship_state = 0;
  },
  methods: {
    handleToArticle(articleId) {
      this.$router.push(`/main/article/${articleId}`);
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
  overflow-y: scroll;
  overflow-x: hidden;

  ul {
    text-align: center;

    li {
      height: 40vh;
      width: 70vw;
      padding: 1em 0;
      margin: 2em 0;

      img {
        height: 40vh;
        width: 70vw;
        // overflow hidden
        object-fit: cover;
        object-position: 50% 50%;
      }

      p {
        text-align: end;
      }

      .bottomLine {
        box-sizing: border-box;
        border-bottom: solid 2px;
        border-color: gray;
        border-radius: 6px;
        width: 70vw;
        height: 2px;
        margin-top: 1em;
      }
    }
  }
}
</style>