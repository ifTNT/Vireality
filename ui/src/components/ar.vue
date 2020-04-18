<template>
  <div>
    <camera class="fullScreen" v-on:camera-ready="onCameraReady" />
    <canvas class="fullScreen" ref="arCanvas"></canvas>
    <div id="overlay">
      <div class="btn" ref="start" v-on:click="initAR" v-if="!started">
        Start
      </div>
      <div class="btn" ref="add" v-on:click="addArticle" v-if="started">
        Add GeoArticle
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
  data: () => ({
      camera: null,
      scene: null,
      axesHelper: null,
      vground: null,
      renderer: null,
      controls: null,
      spriteMaterial: null,
      geolocator: null,
      cameraHeight: 1.4, //Distance between camera and ground(m)
      started: false,
      videoWidth: 0,
      videoHeight: 0,
  }),
  methods: {
    onCameraReady(videoWidth, videoHeight) {
      this.videoWidth = videoWidth;
      this.videoHeight = videoHeight;
      console.log(
        `[AR] Camera Ready: Width: ${this.videoWidth} Height: ${videoHeight}`
      );
    },
    initAR: function() {
      this.started = true;

      //===============Camera and Control================
      //                                                |
      // This camera is expect to have the same FoV,    |
      //  and the same height with the screen           |
      // The controller rotate camera accroding         |
      //  to device orientation                         |
      //                                                |
      //=================================================

      // Because the video may had been cropped,
      // calculating new FoV is needed.

      // Three.js only sets the vertical FoV.
      // How much video had been croped in height.
      let scale = window.innerHeight / this.videoHeight;

      // Full-frame CCD (36mm)
      let refCCDSize = 36;

      // 27mm is the average equivalent focal length
      //  on mobile phone.
      let refFocalLength = 27;

      //Calculate the new FoV by the definition.
      //The unit of the result is degree.
      let cameraFoV =
        (180 / Math.PI) *
        2 * Math.atan(
          ((refCCDSize / 2) * scale) / refFocalLength
        );
      console.log(
        `[AR] FoV of Virtual Camera: ${this.cameraFoV}`
      );

      //Make a camera that have equivlent FoV of device's camera
      this.camera = new THREE.PerspectiveCamera(
        cameraFoV, //Calcualted FoV.
        window.innerWidth / window.innerHeight, //Aspect ratio
        0.5, //Near plate
        1100 //Far plate
      );

      //Adjuest the camera to the height of the device's camera.
      this.camera.position.set(0, 0, this.cameraHeight);

      //This controller will track the orientation of device in the earth coordinate system.
      this.controls = new GeolocationARControls(this.camera);

      this.scene = new THREE.Scene();

      //=========Virtual Ground Object=============
      //                                          |
      // This object is a reference               |
      //  ground object while debugging           |
      // It's been placed right below the camera. |
      //                                          |
      //===========================================
      let groundRange = 10; //The radius of ground.
      let groundSegments = 64; //The triangles in circle.
      var groundGeometry = new THREE.CircleBufferGeometry(
        groundRange, // Raduis of the ground.
        groundSegments // How much triangles contains in ground.
      );
      var groundMaterial = new THREE.MeshBasicMaterial({
        color: 0xaaaaaa, // The color of mesh.
        wireframe: true, // Use wireframe for debugging.
      });
      this.vground = new THREE.Mesh(
        groundGeometry, groundMaterial
      );
      this.vground.position.set(0, 0, 0);

      // Generate grids of the ground
      // The grid size is one meter.
      for(let i=1; i<groundRange; i++){
        let gridGeometry = new THREE.CircleBufferGeometry(
          i, //Raduis of circle.
          groundSegments //How much triangles in circle.
        );
        let grid = new THREE.Mesh(gridGeometry, groundMaterial);
        
        // Append the grid object to the ground object. 
        this.vground.add(grid);
        grid.position.set(0,0,0);
      }
      this.scene.add(this.vground);
      //=========End Virtual Ground Object============

      //An axes helper
      this.axesHelper = new THREE.AxesHelper(0.1);
      this.axesHelper.position.set(0, 0, 0);
      this.scene.add(this.axesHelper);

      //Add markers to the scene
      const spriteMap = new THREE.TextureLoader().load(
        //"/static/media/placeholder.png"
        "/static/media/test_article.png"
      );
      this.spriteMaterial = new THREE.SpriteMaterial({
        map: spriteMap,
        color: 0xffffff
      });

      this.renderer = new THREE.WebGLRenderer({
          canvas: this.$refs.arCanvas,
          antialias: true,
          alpha: true
      });
      this.renderer.setPixelRatio(window.devicePixelRatio);
      this.renderer.setSize(
        window.innerWidth,
        window.innerHeight
      );

      this.animate();
    },
    animate: function() {
      window.requestAnimationFrame(this.animate.bind(this));
      this.controls.update();

      // Stick axes helper in front of camera
      var vec = new THREE.Vector3( 0, 0, -1 );
      vec.applyQuaternion( this.camera.quaternion );
      vec.add(this.camera.position);
      this.axesHelper.position.copy( vec );
      
      if (this.vground !== null) {
        //Fix the position of vground relative to camera
        this.vground.position.x = this.camera.position.x;
        this.vground.position.y = this.camera.position.y;
      }
      this.renderer.render(this.scene, this.camera);
    },
    addArticle: function () {
      let { x, y } = this.camera.position;
      let sprite = new THREE.Sprite(this.spriteMaterial);
      sprite.center.set(0.5, 1)
      sprite.position.set(x, y, 0.5);
      sprite.scale.set(0.75, 0.75, 0.75);
      this.scene.add(sprite);
    },
  },
  components: {
    camera: Camera
  }
};
</script>

<style scoped lang="stylus">
#overlay {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
}

.btn {
  padding: 1em;
  box-sizing: border-box;
  border: solid black 1px;
  border-radius: 1em;
  background-color: rgba(255, 255, 255, 0.5);
}

.fullScreen {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

/* Make video to at least 100% wide and tall */
/* Setting width & height to auto prevents the browser from stretching or squishing the video */
/* Center the video */
</style>
