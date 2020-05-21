<template>
  <div ref="basicMapbox" :style="mapSize"></div>
</template>
<script>
import mapboxgl from "mapbox-gl";
export default {
  props: {
    mapWidth: {
      type: String
    },
    mapHeight: {
      type: String
    }
  },
  data() {
    return {};
  },
  mounted() {
    this.init();
    
  },
  methods: {
    // 初始化
    init() {
      mapboxgl.accessToken =
        "pk.eyJ1IjoibG92ZTEyNDM1NiIsImEiOiJja2FiY2l0OXMwMG9kMnJxZ3N6d2Z3cTNvIn0.bYm9ygwRCG_cRVRU3695bA";
      const map = new mapboxgl.Map({
        container: this.$refs.basicMapbox,
        style: "mapbox://styles/mapbox/streets-v9",
        center: [120.276694, 22.732917], //設定地圖中心在高大資工
        zoom: 15 // 地圖比例
      });
      console.log(map);

      //加marker
      var marker = new mapboxgl.Marker()
        .setLngLat([120.276694, 22.732917])
        .addTo(map);

      //使用定位模块
        map.addControl(new mapboxgl.GeolocateControl({
            positionOptions: {
                enableHighAccuracy: true
            },
            trackUserLocation: true,
            showUserLocation: true,
            zoom: 14,
            
        }))
    }
  },
  computed: {
    mapSize() {
      let styleObj = {
        width: this.mapWidth,
        height: this.mapHeight
      };
      return styleObj;
    }
  }
};
</script>
<style>
@import url("https://api.tiles.mapbox.com/mapbox-gl-js/v0.44.2/mapbox-gl.css");
</style>
