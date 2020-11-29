<template>
  <div ref="basicMapbox" :style="mapSize"></div>
</template>
<script>
import mapboxgl from "mapbox-gl";
export default {
  props: {
    mapWidth: {
      type: String,
    },
    mapHeight: {
      type: String,
    },
  },
  data() {
    return {
      longitude: 0,
      latitude: 0,
      marker: Object,
      map: Object,
    };
  },
  mounted() {
    //this.setCurrentPosition();
    let lng = this.$store.state.geolocation.longitude;
    let lat = this.$store.state.geolocation.latitude;
    this.init(lng, lat);
  },
  methods: {
    // 初始化
    init(lng, lat) {
      /* [TODO]:藏token */
      mapboxgl.accessToken =
        "pk.eyJ1IjoibG92ZTEyNDM1NiIsImEiOiJja2FiY2l0OXMwMG9kMnJxZ3N6d2Z3cTNvIn0.bYm9ygwRCG_cRVRU3695bA";
      const map = new mapboxgl.Map({
        container: this.$refs.basicMapbox,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [lng, lat], //設定地圖中心在地位點
        zoom: 16, // 地圖比例
        scrollZoom: false,
        doubleClickZoom: true,
        touchZoomRotate: true,
      });
      this.map = map;

      // var geolocate = new mapboxgl.GeolocateControl({
      //   positionOptions: {
      //     enableHighAccuracy: true
      //   },
      //   trackUserLocation: true
      //   //showUserLocation: true,
      // });
      // map.addControl(geolocate);

      this.marker = new mapboxgl.Marker({
        //draggable: true
        color: "#000000",
      })
        .setLngLat([lng, lat])
        .addTo(map);
      this.emitInitLngLat();

      map.on("move", () => {
        let lng = this.map.getCenter().lng;
        let lat = this.map.getCenter().lat;
        this.marker.setLngLat([lng, lat]);
        console.log(lng);
        console.log(lat);
        this.longitude = lng;
        this.latitude = lat;
        this.$emit("childByValue", this.longitude, this.latitude);
      });
    },
    emitInitLngLat() {
      var lngLat = this.marker.getLngLat();
      var lng = lngLat.lng;
      var lat = lngLat.lat;
      console.log(lng);
      console.log(lat);
      this.longitude = lng;
      this.latitude = lat;
      this.$emit("childByValue", this.longitude, this.latitude);
    },
  },
  computed: {
    mapSize() {
      let styleObj = {
        width: this.mapWidth,
        height: this.mapHeight,
      };
      return styleObj;
    },
  },
};
</script>
<style>
@import url("https://api.mapbox.com/mapbox-gl-js/v1.10.1/mapbox-gl.css");
</style>
