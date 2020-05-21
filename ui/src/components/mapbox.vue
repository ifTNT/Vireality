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
        style: "mapbox://styles/mapbox/streets-v11",
        center: [120.276694, 22.732917], //設定地圖中心在高大資工
        zoom: 15 // 地圖比例
      });
      //console.log(map);

      var geolocate = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true
        //showUserLocation: true,
      });

      // 一開起來就會追蹤位置
      map.addControl(geolocate);
      map.on("load", function() {
        geolocate.trigger();
      });
      console.log(geolocate);

      var marker = new mapboxgl.Marker({
        draggable: true
      })
        .setLngLat([120.276694, 22.732917])
        .addTo(map);

      function onDragEnd() {
        var lngLat = marker.getLngLat();
        var lng = lngLat.lng;
        var lat = lngLat.lat;
        console.log(lng);
        console.log(lat);
      }

      marker.on("dragend", onDragEnd);

     

      var language = new MapboxLanguage();
      map.addControl(language);
      //navigator.geolocation.getCurrentPosition()
      //console.log(geolocate["_lastKnownPosition"]);
      // console.log(typeof(geolocate));
      // for(let i in geolocate){
      //   console.log(i);
      // }
      // //加marker
      // var marker = new mapboxgl.Marker()
      //   .setLngLat([120.276694, 22.732917])
      //   .addTo(map);
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
@import url("https://api.mapbox.com/mapbox-gl-js/v1.10.1/mapbox-gl.css");
</style>
