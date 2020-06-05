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
    return {
      longitude: 0,
      latitude: 0,
      marker: Object,
      startLngLat: Object,
      startXY: Object,
      map: Object
    };
  },
  mounted() {
    this.setCurrentPosition();
  },
  methods: {
    setCurrentPosition() {
      var lng = 0.0;
      var lat = 0.0;
      // 找到現在的位置
      var getPosition = function(options) {
        return new Promise(function(resolve, reject) {
          navigator.geolocation.getCurrentPosition(resolve, reject, options);
        });
      };

      getPosition()
        .then(position => {
          console.log(position);
          console.log(position.coords.latitude, position.coords.longitude);
          lng = position.coords.longitude;
          lat = position.coords.latitude;
          this.init(lng, lat);
        })
        .catch(err => {
          console.error(err.message);
        });
      // var options = {
      //   enableHighAccuracy: true,
      //   timeout: 5000,
      //   maximumAge: 0
      // };

      // function success(pos) {
      //   var crd = pos.coords;

      //   console.log('Your current position is:');
      //   console.log(`Latitude : ${crd.latitude}`);
      //   lat = `${crd.latitude}`
      //   console.log(lat)
      //   console.log(`Longitude: ${crd.longitude}`);
      //   lng =  `${crd.longitude}`
      //   console.log(lng)

      //   console.log(`More or less ${crd.accuracy} meters.`);
      // }

      // function error(err) {
      //   console.warn(`ERROR(${err.code}): ${err.message}`);
      // }

      // navigator.geolocation.getCurrentPosition(success, error, options);
      //
    },
    // 初始化
    init(lng, lat) {
      mapboxgl.accessToken =
        "pk.eyJ1IjoibG92ZTEyNDM1NiIsImEiOiJja2FiY2l0OXMwMG9kMnJxZ3N6d2Z3cTNvIn0.bYm9ygwRCG_cRVRU3695bA";
      const map = new mapboxgl.Map({
        container: this.$refs.basicMapbox,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [lng, lat], //設定地圖中心在地位點
        zoom: 18, // 地圖比例
        scrollZoom: false,
        doubleClickZoom: false,
        touchZoomRotate: false
      });
      this.map = map;
      //console.log(map);
      console.log(map.getCenter());
      var geolocate = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true
        //showUserLocation: true,
      });
      map.addControl(geolocate);
      // 一開起來就會追蹤位置
      // map.on("load", function() {
      //   geolocate.trigger();
      // });
      console.log(geolocate);

      this.marker = new mapboxgl.Marker({
        //draggable: true
        color: "#000000"
      })
        .setLngLat([lng, lat])
        .addTo(map);
      this.emitInitLngLat();
      // this.marker.on("dragend", this.onDragEnd);
      console.log(this.marker.getOffset());

      // map.on("touchmove", function(e) {
      //     // e.point is the x, y coordinates of the mousemove event relative
      //     // to the top-left corner of the map
      //     console.log(JSON.stringify(e.point));
      //     // e.lngLat is the longitude, latitude geographical position of the event
      //     console.log(JSON.stringify(e.lngLat.wrap()));
      // });

      //  map.on("touchstart", this.onTouchStart);
      //  map.on("touchend", this.onTouchEnd);
      //   map.on("touchmove",this.onTouchMove);
      map.on("move",  () => {
        
        let lng = this.map.getCenter().lng;
        let lat = this.map.getCenter().lat;
        this.marker.setLngLat([lng, lat])
        console.log(lng)
        console.log(lat)
        this.longitude = lng;
        this.latitude = lat;
        this.$emit("childByValue", this.longitude, this.latitude);
      });
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
    },
    onTouchMove(e) {
      console.log(JSON.stringify(e.point));
      // e.lngLat is the longitude, latitude geographical position of the event
      console.log(JSON.stringify(e.lngLat.wrap()));
      // var lng = e.lngLat.lng
      // var lat = e.lngLat.lat
      // this.startLngLat.lng = lng - this.startLngLat.lng
      // this.startLngLat.lat = lat - this.startLngLat.lat
    },
    onTouchStart(e) {
      console.log("start");
      console.log(e);
      // e.point is the x, y coordinates of the mousemove event relative
      // to the top-left corner of the map
      console.log(JSON.stringify(e.point));

      // e.lngLat is the longitude, latitude geographical position of the event
      console.log(JSON.stringify(e.lngLat.wrap()));
      console.log(e.lngLat.lng);
      console.log(e.lngLat.lat);
      this.startLngLat = e.lngLat.wrap();
      this.startXY = e.point;
      // this.marker.setLngLat(e.lngLat.wrap());
    },
    // function distance(start){
    //   return end=>{
    //     start-end
    //   }
    // }
    onTouchEnd(e) {
      // e.point is the x, y coordinates of the mousemove event relative
      // to the top-left corner of the map
      console.log("end");
      // console.log(JSON.stringify(e.point));
      // // e.lngLat is the longitude, latitude geographical position of the event
      console.log(JSON.stringify(e.lngLat.wrap()));
      // console.log(e.lngLat.lng);
      // console.log(e.lngLat.lat);
      var tmpLng = e.lngLat.lng - this.startLngLat.lng;
      var tmpLat = e.lngLat.lat - this.startLngLat.lat;
      var tmpX = e.point.x - this.startXY.x;
      var tmpY = e.point.y - this.startXY.y;
      console.log(tmpLng);
      console.log(tmpLat);
      console.log(tmpX);
      console.log(tmpY);
      var lngLat = this.marker.getLngLat();
      var lng = lngLat.lng - tmpLng;
      var lat = lngLat.lat - tmpLat;

      var xy = this.marker.getOffset();
      var x = xy.x - tmpX;
      var y = xy.y - tmpY;
      // console.log(lng)
      // console.log(lat)
      this.marker.setLngLat([lng, lat]);
      this.marker.setOffset([x, y]);
      this.longitude = lng;
      this.latitude = lat;
      // var lngLat = this.marker.getLngLat();
      // var lng = lngLat.lng;
      // var lat = lngLat.lat;
      // console.log(lng);
      // console.log(lat);
      this.$emit("childByValue", this.longitude, this.latitude);
    },
    onDragEnd() {
      var lngLat = this.marker.getLngLat();
      var lng = lngLat.lng;
      var lat = lngLat.lat;
      console.log(lng);
      console.log(lat);
      this.longitude = lng;
      this.latitude = lat;
      this.$emit("childByValue", this.longitude, this.latitude);
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
