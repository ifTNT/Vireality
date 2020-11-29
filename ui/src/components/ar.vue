<template>
  <div>
    <camera
      class="fullScreen"
      v-on:camera-ready="onCameraReady"
      v-bind:tap-coordinate="this.tapCoordinate"
    />
    <canvas class="fullScreen" ref="arCanvas"></canvas>
    <div id="overlay">
      <font-awesome-icon
        icon="play-circle"
        class="play-btn"
        size="5x"
        inverse
        ref="start"
        v-on:click="initAR"
        v-if="!started"
      />
      <!-- <font-awesome-layers class="fa-lg" ref="add" v-on:click="addArticle" v-if="started">
        <font-awesome-icon icon="map-marker-alt" size="4x" transform="right-3" inverse />
        <font-awesome-icon icon="plus" size="lg" transform="down-5" inverse />
      </font-awesome-layers>-->
    </div>
    <div class="loading-wrapper" v-if="lossLocation">
      <loading :scale="0.3" :stickToBottom="true"></loading>
      <div class="text">Searching GPS...</div>
    </div>
  </div>
</template>
<script>
//Reference: https://stackoverflow.com/questions/47849626/import-and-use-three-js-library-in-vue-component
import * as THREE from "three";
import GeolocationARControls from "../lib/geolocation_ar_controls.js";
import convertGeolocation from "../lib/geolocation_converter.js";
import screenfull from "screenfull";

// Lazy-loading components
const Camera = () => import("./camera.vue");
const Loading = () => import("./loading.vue");

export default {
  name: "AR_view",
  props: {
    tapCoordinate: {
      type: Object,
    },
  },
  data: () => ({
    camera: null,
    scene: null,
    axesHelper: null,
    vground: null,
    renderer: null,
    controls: null,
    articleMaterial: null,
    geolocator: null,
    cameraHeight: 1.4, //Distance between camera and ground(m)
    started: false,
    videoWidth: 0,
    videoHeight: 0,
    article_list: [],
    loaded_article_id: new Set([]),
    lossLocation: false,
  }),
  mounted() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.$refs.arCanvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(screen.availWidth, screen.availHeight);
  },
  watch: {
    tapCoordinate: function (newCoord, oldCoord) {
      //Normalize the coordinate to (-1, 1)
      let { x, y } = newCoord;
      x = (x / screen.availWidth) * 2 - 1;
      y = -(y / screen.availHeight) * 2 + 1;

      let tapCoord = new THREE.Vector2(x, y);
      let ray = new THREE.Raycaster();
      ray.setFromCamera(tapCoord, this.camera);
      let intersects = ray.intersectObjects(this.scene.children);

      //if there are at least one object intersected with the ray
      if (intersects.length > 0) {
        for (var i = 0; i < intersects.length; i++) {
          if (typeof intersects[i].object.userData.link != "undefined") {
            this.$router.push(intersects[i].object.userData.link);
            break;
          }
        }
        //Open the cloest article
        // this.openUrl(intersects[0].object.userData.link);
      }
    },
  },
  methods: {
    onCameraReady(videoWidth, videoHeight) {
      this.videoWidth = videoWidth;
      this.videoHeight = videoHeight;
      console.re.log(
        `[AR] Camera Ready: Width: ${this.videoWidth} Height: ${videoHeight}`
      );
    },
    initAR: function () {
      this.started = true;

      if (screenfull.isEnabled) {
        screenfull.request();
      }

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
      let scale = screen.availHeight / this.videoHeight;

      // Full-frame CCD (36mm)
      let refCCDSize = 36;

      // 27mm is the average equivalent focal length
      //  on mobile phone.
      let refFocalLength = 27;

      //Calculate the new FoV by the definition.
      //The unit of the result is degree.
      let cameraFoV =
        (180 / Math.PI) *
        2 *
        Math.atan(((refCCDSize / 2) * scale) / refFocalLength);
      console.re.log(`[AR] FoV of Virtual Camera: ${cameraFoV}`);

      //Make a camera that have equivlent FoV of device's camera
      this.camera = new THREE.PerspectiveCamera(
        cameraFoV, //Calcualted FoV.
        screen.availWidth / screen.availHeight, //Aspect ratio
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
      this.vground = new THREE.Mesh(groundGeometry, groundMaterial);
      this.vground.position.set(0, 0, 0);

      // Generate grids of the ground
      // The grid size is one meter.
      for (let i = 1; i < groundRange; i++) {
        let gridGeometry = new THREE.CircleBufferGeometry(
          i, //Raduis of circle.
          groundSegments //How much triangles in circle.
        );
        let grid = new THREE.Mesh(gridGeometry, groundMaterial);

        // Append the grid object to the ground object.
        this.vground.add(grid);
        grid.position.set(0, 0, 0);
      }
      //this.scene.add(this.vground);
      //=========End Virtual Ground Object============

      //An axes helper
      this.axesHelper = new THREE.AxesHelper(0.1);
      this.axesHelper.position.set(0, 0, 0);
      this.scene.add(this.axesHelper);

      this.loadArticles();

      this.animate();
    },

    animate: function () {
      window.requestAnimationFrame(this.animate.bind(this));
      this.controls.update();

      // Stick axes helper in front of camera
      var vec = new THREE.Vector3(0, 0, -1);
      vec.applyQuaternion(this.camera.quaternion);
      vec.add(this.camera.position);
      this.axesHelper.position.copy(vec);

      if (this.vground !== null) {
        //Fix the position of vground relative to camera
        this.vground.position.x = this.camera.position.x;
        this.vground.position.y = this.camera.position.y;
      }

      // Update the visiblity of articles
      let articles = this.$store.state.articles;
      this.scene.traverse(function (child) {
        if (child.userData.link !== undefined) {
          child.visible = articles[child.userData.id].visible;
        }
      });

      this.renderer.render(this.scene, this.camera);
    },

    // The promise wrapper of three.js texture loader
    loadTexture: function (url) {
      return new Promise((resolve) => {
        new THREE.TextureLoader().load(url, resolve);
      });
    },
    // Fetch articles near by the user.
    // Including id, thumbnail, lontitude and latitude.
    loadArticles: function () {
      //Periodicly load article from server
      setTimeout(this.loadArticles, 5000);

      // Get current position
      let {
        longitude,
        latitude,
        accuracy,
      } = this.controls.getCurrentPosition();

      this.$store.commit("set_geolocation", {
        longitude,
        latitude,
        accuracy,
      });

      // If accuracy is too low, display lost GPS signal.
      this.lossLocation = accuracy > 15;

      // Refresh the article thumbnail
      this.axios
        .get(server.apiUrl("/articles/geolocation"), {
          params: {
            lon: longitude,
            lat: latitude,
          },
        })
        .then((res) => {
          console.re.log(`[AR] Article list fetched.`);
          res = res.data;
          if (res.ok !== "true") {
            console.re.log("[AR] Get article list failed.");
          } else {
            // Iterate the articles
            res.result.forEach(async (article) => {
              // If there existed same article, do not append.
              if (this.loaded_article_id.has(article.id)) return;

              // Fetch the texture from external website.
              const texture = await this.loadTexture(article.thumbnail);
              let articleMaterial = new THREE.MeshBasicMaterial({
                map: texture,
              });

              // Convert the geolocation to AR coordinate.
              let { lon, lat } = article;
              let { x, y } = convertGeolocation({
                longitude: lon,
                latitude: lat,
              });

              // change time to time 00:00 of that date(same as timeline).
              article.post_time = new Date(article.post_time);
              const postTime = parseInt(article.post_time / (86400 * 1000));
              article.post_time = postTime;

              // Append article
              this.addArticle(x, y, articleMaterial, article.id);
              this.loaded_article_id.add(article.id);
              this.$store.commit("add_article", article);
            });
          }
        });
    },
    addArticle: function (x, y, material, id) {
      //let { x, y } = this.camera.position;
      const geometry = new THREE.BoxGeometry(0.01, 1, 1); // Article cube
      let newArticle = new THREE.Mesh(geometry, material);
      //let newArticle = new THREE.Sprite(this.spriteMaterial);
      //newArticle.center.set(0.5, 0); //Center Bottom
      //newArticle.scale.set(1, 1, 1);

      // Place new article in front of camera
      var vec = new THREE.Vector3(x, y, 0);
      //var vec = new THREE.Vector3(0, 0, -2);
      //vec.applyQuaternion(this.camera.quaternion);
      //vec.add(this.camera.position);
      newArticle.position.copy(vec);
      //newArticle.position.z = 0.0;
      newArticle.rotation.x = Math.PI / 2;

      //Set the custom data
      newArticle.userData = {
        id,
        link: `/main/article/${id}`,
      };

      //Let the article facing to camera
      let faceOnCamera = function () {
        newArticle.rotation.y = Math.atan2(
          newArticle.position.y - this.camera.position.y,
          newArticle.position.x - this.camera.position.x
        );
        requestAnimationFrame(faceOnCamera);
      }.bind(this);
      faceOnCamera();

      this.scene.add(newArticle);
      this.article_list.push(newArticle);
    },
  },
  components: {
    camera: Camera,
    loading: Loading,
  },
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

.play-btn {
  color: #45818e;
  background: #b4a7d6;
  border-radius: 50%;
  animation: blink 1s ease-in-out infinite;
}

.loading-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  display: flex;
  color: white;
  align-items: flex-end;
}

.loading-wrapper .text {
  height: 75px;
  margin-left: -0.5em;
  display: flex;
  align-items: center;
  font-family: 'Audiowide', cursive;
}

@keyframes blink {
  0% {
    opacity: 100%;
  }

  50% {
    opacity: 50%;
  }

  100% {
    opacity: 100%;
  }
}

/* Make video to at least 100% wide and tall */
/* Setting width & height to auto prevents the browser from stretching or squishing the video */
/* Center the video */
</style>
