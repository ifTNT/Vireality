<template>
  <div class="profile_right">
    <font-awesome-icon
      icon="chevron-left"
      class="rightButton"
      size="2x"
      @click.prevent="$router.back()"
    />
    <div class="error" v-show="articles.length === 0">這個人沒有任何文章哦</div>
    <div ref="basicMapbox" class="map"></div>
    <!-- {{this.articles}} -->
  </div>
</template>
<script>
import axios from "axios";
import mapboxgl from "mapbox-gl";

export default {
  name: "profile_right",
  data() {
    return {
      id: "",
      articles: [],
      markers: [],
      map: undefined,
    };
  },
  components: {},
  mounted() {
    this.id = this.$route.params.id;
    // To pass cookies to server
    // this.axios.defaults.withCredentials = true;
    this.axios.get(server.apiUrl(`/articles/user/${this.id}`)).then((res) => {
      console.log(`[articleList] Article list fetched.`);
      res = res.data;
      if (res.ok !== "true") {
        console.log("[articleList] Get article list failed.");
      } else {
        res.result.forEach((article) => {
          console.log(article);
          this.articles.push({
            img: article.thumbnail,
            postTime: article.post_time,
            articleId: article.article_id,
            location: article.location,
          });
        });
        if (this.articles.length === 0) return;
        const lat = this.articles[0].location.latitude;
        // console.log(lat)
        const lng = this.articles[0].location.longitude;
        // console.log(lng)
        mapboxgl.accessToken =
          "pk.eyJ1IjoibG92ZTEyNDM1NiIsImEiOiJja2FiY2l0OXMwMG9kMnJxZ3N6d2Z3cTNvIn0.bYm9ygwRCG_cRVRU3695bA";
        const map = new mapboxgl.Map({
          container: this.$refs.basicMapbox,
          style: "mapbox://styles/mapbox/streets-v11",
          center: [lng, lat], //設定地圖中心在地位點
          zoom: 13, // 地圖比例
          scrollZoom: true,
          doubleClickZoom: true,
          touchZoomRotate: true,
        });
        this.map = map;

        this.articles.forEach((article) => {
          let marker = new mapboxgl.Marker({
            //draggable: false,
            color: "#000000",
          })
            .setLngLat([article.location.longitude, article.location.latitude])
            .addTo(map);

          //this.markers.push(marker);
          marker.getElement().addEventListener("click", (e) => {
            // Jump to article
            this.$router.push(`/main/article/${article.articleId}`);
            // var popup = new mapboxgl.Popup({ closeOnClick: true })
            //     .setLngLat([article.location.longitude, article.location.latitude])
            //     .setHTML('<h1>'+ article.articleId +'</h1>')
            //     .addTo(map);
          });
        });
      }
    });
  },
  methods: {
    handleBack() {
      this.$router.back();
    },
  },
};
</script>

<style scoped lang="stylus">
@import url('https://api.mapbox.com/mapbox-gl-js/v1.10.1/mapbox-gl.css');

.profile_right {
  width: 80vw;
  height: 80vh;
  text-align: center;
  padding: 5vh 5vw;
  box-sizing: border-box;
  overflow-y: scroll;
  overflow-x: hidden;

  .error{
    margin 10vh 0
  }

  .map {
    margin-top 2vh
    width: 100%;
    // height: calc(80vh - 3rem);
    height: calc(100% - 8vh);
}
}


</style>