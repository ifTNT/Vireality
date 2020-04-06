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
  data() {
    return {
      cameraReady: false,
      facefinderClassifyRegion: {},
      dets: {},
      markImg: new Image(),
      markImgReady: false,
      width: window.innerWidth,
      height: window.innerHeight,
    };
  },
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
              height: { min: this.height },
              facingMode: { exact: "environment" },
            },
          })
          .then(
            function (stream) {
              this.$refs.capture.srcObject = stream;
            }.bind(this)
          )
          .catch(function (error) {
            console.log(
              `Get webcam error:\n  ${error.name}:${error.constraint}`
            ,error);
          });
      }

      //Adjuest canvas size and start picojs after video is ready
      let self = this;
      this.$refs.capture.addEventListener(
        "loadedmetadata",
        function (e) {
          self.$refs.canvas.width = this.videoWidth;
          self.$refs.canvas.height = this.videoHeight;
          self.cameraReady = true;
          self.$emit("cameraReady", this.videoWidth, this.videoHeight);
          console.log(`VideoWidth: ${this.videoWidth}`);
          self.updatePico();
        },
        false
      );
    },
    initPico: function () {
      var cascadeurl = "/static/model/facefinder";
      fetch(cascadeurl)
        .then(function (response) {
          return response.arrayBuffer();
        })
        .then(
          function (buffer) {
            var bytes = new Int8Array(buffer);
            this.facefinderClassifyRegion = pico.unpack_cascade(bytes);
            console.log("* facefinder loaded");
          }.bind(this)
        );
    },
    initMarkImage() {
      this.markImg.addEventListener("load", () => {
        this.markImgReady = true;
      });
      this.markImg.src = "/static/media/placeholder.png";
    },
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
      this.dets = pico.run_cascade(
        image,
        this.facefinderClassifyRegion,
        params
      );
      this.dets = this.updateMemory(this.dets);
      this.dets = pico.cluster_detections(this.dets, 0.2); // set IoU threshold to 0.2
      // draw detections
      // check the detection score
      // if it's above the threshold, draw it
      // (the constant 50.0 is empirical: other cascades might require a different one)
      ctx.strokeStyle = "white";
      ctx.font = "20px Ubuntu";
      for (let face of this.dets) {
        if (face[3] > 50.0) {
          ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
          let _width = face[2] / 2;
          let _x = face[1] - _width / 2;
          let _y = face[0] - _width / 2;

          //Draw box of detected face
          const aspect_ratio = 1;
          let _height = _width * aspect_ratio;
          _y -= _height; //Negative is ok.
          _y -= _height * 0.8;
          //ctx.fillRect(_x, _y, _width, _height);
          ctx.drawImage(this.markImg, _x, _y, _width, _height);
          //ctx.strokeRect(_x, _y, _width, _height);

          //Draw text
          // let font_x = _x + 0.1 * _width;
          // let font_y = _y + 0.5 * (_height - 20);
          // ctx.fillStyle = "white";
          // ctx.fillText(
          //   "It works! " + (face[3] / 100).toFixed(2),
          //   font_x,
          //   font_y
          // );
          //Draw face
          //ctx.lineWidth = 1;
          //ctx.strokeStyle = "blue";
          //ctx.strokeRect(
          //  face[1] - face[2] / 2,
          //  face[0] - face[2] / 2,
          //  face[2],
          //  face[2]
          //);
        }
      }
    },
    updateMemory: pico.instantiate_detection_memory(5),
  },
};
</script>

<style scoped lang="stylus">
.content
    overflow hidden
    // width 100vw
    // height 100vh

    video
      display none
    canvas
       /* Make video to at least 100% wide and tall */
       min-width 100%
       min-height 100%

       /* Setting width & height to auto prevents the browser from stretching or squishing the video */
       width auto
       height auto

       /* Center the video */
       position relative
       top 50%
       left 50%
       transform translate(-50%, -50%)
</style>
