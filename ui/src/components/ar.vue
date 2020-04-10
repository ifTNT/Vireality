<template>
  <div>
    <camera class="fullScreen" v-on:camera-ready="onCameraReady" />
    <canvas class="fullScreen" ref="arCanvas"></canvas>
    <div id="overlay">
      <div class="btn" ref="start" v-on:click="initAR" v-if="!started">
        Start
      </div>
      <div class="btn" ref="add" v-on:click="addMarker" v-if="false && started">
        Add Marker
      </div>
    </div>
  </div>
</template>
<script>
//Reference: https://stackoverflow.com/questions/47849626/import-and-use-three-js-library-in-vue-component
import * as THREE from "three";
import GeolocationARControls from "../lib/geolocation_ar_controls.js";
import Camera from "@/components/camera";
export default {
  name: "AR_view",
  data() {
    return {
      camera: null,
      scene: null,
      axesHelper: null,
      vground: null,
      renderer: null,
      controls: null,
      spriteMaterial: null,
      geolocator: null,
      cameraHeight: 1.4, //Distance between camera and ground
      cameraFoV: 67.35, //Average value for mobile
      started: false,
      videoWidth: 0,
      videoHeight: 0,
    };
  },
  methods: {
    onCameraReady(videoWidth, videoHeight) {
      this.videoWidth = videoWidth;
      this.videoHeight = videoHeight;
      console.log(`[AR] Camera ready: Width: ${this.videoWidth} Height: ${videoHeight}`);
    },
    initAR: function () {
      this.started = true;

      //==================Camera and Control=============================================
      //                                                                                |
      //This camera is expect to have the same FoV and height with the camera on device |
      //The controller rotate camera accroding to device orientation                    |
      //                                                                                |
      //================================================================================|

      //If the video had been croped, adjuest FoV
      if (this.videoHeight > window.innerHeight || this.videoWidth > window.innerWidth) {
        //How much video had been croped
        let scaleFactor = Math.min(
            window.innerHeight / this.videoHeight,
            window.innerWidth / this.videoWidth
        );

        //Full-frame CCD (36mm)
        let referenceCCDSize = 36;

        //27mm is the average equivalent focal length on mobile phone
        let referenceFocalLength = 27;

        //Calculate the new FoV by the definition.
        this.cameraFoV =
          (180 / Math.PI) *
          2 *
          Math.atan(
            ((referenceCCDSize / 2) * scaleFactor) / referenceFocalLength
          );
      }

      //Make a camera that have equivlent FoV of device's camera
      this.camera = new THREE.PerspectiveCamera(
        this.cameraFoV, //Calcualted FoV.
        window.innerWidth / window.innerHeight, //Aspect ratio
        1, //Near plate
        1100 //Far plate
      );

      //Adjuest the camera to the height of the device's camera.
      this.camera.position.set(0, 0, this.cameraHeight);

      //This controller will track the orientation of device in the earth coordinate system.
      this.controls = new GeolocationARControls(this.camera);

      this.scene = new THREE.Scene();

      //==================Virtual Ground Object===================
      //                                                         |
      //This object is a reference ground object while debugging |
      //It's been placed at below the camera                     |
      //                                                         |
      //==========================================================
      var groundGeometry = new THREE.BoxBufferGeometry(
        1000,
        1000,
        0.001,
        100,
        100,
        1
      );
      var groundMaterial = new THREE.MeshBasicMaterial({
        color: 0xaaaaaa,
        wireframe: true,
      });
      this.vground = new THREE.Mesh(groundGeometry, groundMaterial);
      this.vground.position.set(0, 0, 0);
      this.scene.add(this.vground);
      //================End Virtual Ground Object=================

      //An axes helper
      this.axesHelper = new THREE.AxesHelper(1);
      this.axesHelper.position.set(0, 0, 0);
      this.scene.add(this.axesHelper);

      //Add markers to the scene
      const spriteMap = new THREE.TextureLoader().load(
        "/static/media/placeholder.png"
      );
      this.spriteMaterial = new THREE.SpriteMaterial({
        map: spriteMap,
        color: 0xffffff,
      });

      this.renderer = new THREE.WebGLRenderer({ canvas: this.$refs.arCanvas, antialias: true, alpha: true });
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.setSize(window.innerWidth, window.innerHeight);

      //

      window.addEventListener("resize", this.onWindowResize, false);
      this.animate();
    },
    animate: function () {
      window.requestAnimationFrame(this.animate.bind(this));
      this.controls.update();
      this.axesHelper.position.x = this.camera.position.x;
      this.axesHelper.position.y = this.camera.position.y;
      if (this.vground !== null) {
        //Fix the position of vground relative to camera
        this.vground.position.x = this.camera.position.x;
        this.vground.position.y = this.camera.position.y;
      }
      this.renderer.render(this.scene, this.camera);
    },
    addMarker: function () {
      let { x, y } = this.camera.position;
      let sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.set(x, y, 0);
      sprite.scale.set(0.5, 0.5, 0.5);
      this.scene.add(sprite);
    },
    onWindowResize: function () {
      //Camera aspect ratio
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();

      renderer.setSize(window.innerWidth, window.innerHeight);
    },
  },
  components: {
    camera: Camera,
  },
};
</script>

<style scoped lang="stylus">
#overlay
  width 100vw
  height 100vh
  display flex
  justify-content center
  align-items center
  position fixed

.btn
  padding 1em
  box-sizing border-box
  border solid black 1px
  border-radius 1em
  background-color rgba(255, 255, 255, 0.5)

.fullScreen
  position absolute
  top 0
  bottom 0
  width 100vw
  height 100vh
  overflow hidden

//canvas
  /* Make video to at least 100% wide and tall */
  //min-width 100%
  //min-height 100%

  /* Setting width & height to auto prevents the browser from stretching or squishing the video */
  //width 100vw
  //height 100vh

  /* Center the video */
  //position absolute
  //top 50%
  //left 50%
  //transform translate(-50%, -50%)
</style>
