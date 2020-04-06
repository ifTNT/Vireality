<template>
  <div
    class="content"
    :style="{ width: width + 'px', height: height + 'px' }"
    ref="content"
  >
    <video autoplay ref="capture"></video>
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script>
import pico from "../lib/pico.js";
export default {
  name: "camera",
  data: () => ({
    cameraReady: false,
    facefinderClassifyRegion: {},
    markImg: new Image(),
    markImgReady: false,
    width: window.innerWidth,
    height: window.innerHeight,
    facingMode: 'enviorment'
  }),
  mounted() {
    this.initCamera();
    this.initPico();
    this.initMarkImage();
  },
  methods: {
    rgba_to_grayscale: function (rgba, nrows, ncols) {
      var gray = new Uint8Array(nrows * ncols);
      for (var r = 0; r < nrows; ++r)
        for (var c = 0; c < ncols; ++c)
          // gray = 0.2*red + 0.7*green + 0.1*blue
          gray[r * ncols + c] =
            (2 * rgba[r * 4 * ncols + 4 * c + 0] +
              7 * rgba[r * 4 * ncols + 4 * c + 1] +
              1 * rgba[r * 4 * ncols + 4 * c + 2]) /
            10;
      return gray;
    },
    initCamera: function () {
      if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({
            video: {
              //width: window.innerWidth,
              height: this.height,
              facingMode: { exact: this.facingMode },
            },
          })
          .then((stream) => {
            this.$refs.capture.srcObject = stream;
          })
          .catch((error) => {
            console.log(`[Face Detection] Get webcam error`, error);
          });
      }

      //Adjuest canvas size and start picojs after video is ready
      this.$refs.capture.addEventListener(
        "loadedmetadata",
        () => {
          let width = this.$refs.capture.videoWidth;
          let height = this.$refs.capture.videoHeight;
          this.$refs.canvas.width = width;
          this.$refs.canvas.height = height;
          this.cameraReady = true;
          this.$emit("cameraReady", width, height);
          console.log(
            `[Face Detection] Camera stream loaded. VideoWidth: ${width}, VideoHeight: ${height}`
          );
          this.updatePico();
        },
        false
      );
    },
    initPico: function () {
      var cascadeurl = "/static/model/facefinder";
      fetch(cascadeurl)
        .then((response) => response.arrayBuffer())
        .then((buffer) => {
          let bytes = new Int8Array(buffer);
          this.facefinderClassifyRegion = pico.unpack_cascade(bytes);
          console.log("[Face Detection] facefinder loaded");
        });
    },
    initMarkImage() {
      this.markImg.addEventListener("load", () => {
        console.log("[Face Detection] marker loaded");
        this.markImgReady = true;
      });
      this.markImg.src = "/static/media/placeholder.png";
    },

    /* Detection Queue of picojs */
    updateMemory: pico.instantiate_detection_memory(5),
    updatePico: function () {
      requestAnimationFrame(this.updatePico);
      if (!this.markImgReady) return;

      let ctx = this.$refs.canvas.getContext("2d");
      ctx.drawImage(this.$refs.capture, 0, 0);
      let width = this.$refs.capture.videoWidth;
      let height = this.$refs.capture.videoHeight;
      var rgba = ctx.getImageData(0, 0, width, height).data;
      // prepare input to `run_cascade`
      let image = {
        pixels: this.rgba_to_grayscale(rgba, width, height),
        nrows: height,
        ncols: width,
        ldim: width,
      };
      let params = {
        shiftfactor: 0.1, // move the detection window by 10% of its size
        minsize: 100, // minimum size of a face
        maxsize: 1000, // maximum size of a face
        scalefactor: 1.1, // for multiscale processing: resize the detection window by 10% when moving to the higher scale
      };
      // run the cascade over the frame and cluster the obtained detections
      // dets is an array that contains (r, c, s, q) quadruplets
      // (representing row, column, scale and detection score)
      let dets = pico.run_cascade(image, this.facefinderClassifyRegion, params);
      dets = this.updateMemory(dets);
      dets = pico.cluster_detections(dets, 0.2); // set IoU threshold to 0.2

      // draw detections
      // check the detection score
      // if it's above the threshold, draw it
      // (the constant 50.0 is empirical: other cascades might require a different one)
      ctx.strokeStyle = "white";
      ctx.font = "20px Ubuntu";
      for (let face of dets) {
        if (face[3] > 50.0) {
          ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
          let _width = face[2] / 2;
          let _x = face[1] - _width / 2;
          let _y = face[0] - _width / 2;

          //Draw box of detected face
          const aspect_ratio = 1;
          let _height = _width * aspect_ratio;
          _y -= _height * 1.8; //Calculate offset. Negative is ok.
          ctx.drawImage(this.markImg, _x, _y, _width, _height);
        }
      }
    },
  },
};
</script>

<style scoped lang="stylus">
.content
    overflow hidden

    /* hide the original video*/
    video
      display none
    canvas
       /* Make video to at least 100% wide and tall */
       min-width 100%
       min-height 100%

       /* Setting width & height to auto prevents the browser from stretching or squishing the video */
       width auto
       height auto

       /* Center the canvas */
       position relative
       top 50%
       left 50%
       transform translate(-50%, -50%)
</style>
