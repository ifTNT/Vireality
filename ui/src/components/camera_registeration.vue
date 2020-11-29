<template>
  <div
    class="content"
    v-bind:style="{ width: `${canvasWidth}px`, height: `${canvasHeight}px` }"
    ref="content"
  >
    <video autoplay ref="capture"></video>
    <canvas ref="canvas"></canvas>
    <canvas ref="raw_canvas" style="display: none"></canvas>
  </div>
</template>

<script>
import pico from "../lib/pico.js";
import io from "socket.io-client";

export default {
  name: "camera",
  props: {
    facingMode: {
      type: String,
      default: "user",
      validator: (
        value // The value must match one of two strings
      ) => ["environment", "user"].indexOf(value) !== -1,
    },
    label: {
      type: String,
    },
  },
  data: () => ({
    cameraReady: false,
    facefinderClassifyRegion: {},
    markImg: new Image(),
    markImgReady: false,
    cascadeReady: false,
    timer: undefined,

    canvasWidth: screen.availWidth,
    canvasHeight: screen.availHeight,

    //Parameters for drawing video
    drawParameter: {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    },

    // Place to store detected faces
    dets: [],
    confiTable: [],

    // The websocket connection of backend.
    recogBackendWS: {},

    req_id: 0,
  }),
  mounted() {
    this.initCamera();
    this.initPico();
    this.initRecogBackendWS();
    this.$refs.raw_canvas.width = this.canvasWidth;
    this.$refs.raw_canvas.height = this.canvasHeight;
    this.$refs.canvas.width = this.canvasWidth;
    this.$refs.canvas.height = this.canvasHeight;
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
      //Adjuest canvas size and start picojs after video is ready
      this.$refs.capture.addEventListener(
        "loadedmetadata",
        () => {
          let width = this.$refs.capture.videoWidth;
          let height = this.$refs.capture.videoHeight;
          this.cameraReady = true;
          console.re.log(
            `[Face Detection Reg] Camera stream loaded. VideoWidth: ${width}, VideoHeight: ${height}`
          );
          console.re.log(
            `[Face Detection Reg] CanvasWidth: ${this.canvasWidth}, CanvasHeight: ${this.canvasHeight}`
          );
          //==========Scale video to fit canvas============

          //Size of canvas
          let canvasWidth = this.canvasWidth;
          let canvasHeight = this.canvasHeight;

          //Calculate scale factor
          let scale = Math.max(canvasWidth / width, canvasHeight / height);
          let offsetX = canvasWidth / 2 - (width / 2) * scale;
          let offsetY = canvasHeight / 2 - (height / 2) * scale;

          this.drawParameter = {
            x: offsetX,
            y: offsetY,
            width: width * scale,
            height: height * scale,
          };
          console.re.log(
            `[Face Detection Reg] Scaled Video Width: ${
              width * scale
            } Height: ${height * scale}`
          );
          //=============================================

          // Update the pico face detector every frame.
          this.timer = window.setInterval(() => {
            this.updatePico();
          }, 10);
        },
        false
      );

      if (navigator.mediaDevices.getUserMedia) {
        console.re.log(`[Face Detection Reg] Facing Mode:${this.facingMode}`);
        navigator.mediaDevices
          .getUserMedia({
            video: {
              //Get the video that at least have SD quality
              //Height  of video actually is width of video
              height: { ideal: 720 },
              facingMode: { exact: this.facingMode },
            },
          })
          .then((stream) => {
            console.re.log("[Face Detection Reg] Setting stream");
            this.$refs.capture.srcObject = stream;
          })
          .catch((error) => {
            console.re.log(`[Face Detection Reg] Get webcam error`, error);
          });
      }
    },
    initPico: function () {
      var cascadeurl = "/static/model/facefinder";
      fetch(cascadeurl)
        .then((response) => response.arrayBuffer())
        .then((buffer) => {
          let bytes = new Int8Array(buffer);
          this.facefinderClassifyRegion = pico.unpack_cascade(bytes);
          this.cascadeReady = true;
          console.re.log("[Face Detection Reg] facefinder loaded");
        });
    },

    // Initialize the websocket connection to backend.
    initRecogBackendWS: function () {
      let ws = io(server.recogBackendUrl());

      // The common event handler of websockets
      ws.on("connect", () => {
        console.re.log("[Reg-backend WS] Connection opened");
      });

      ws.on("disconnect", () => {
        console.re.log("[Reg-backend WS] Connection closed");
      });

      // The event which will be triggred while receive data from server
      ws.on("recog_res", (data) => {
        console.log("Received response", data);
        if (data.found === true) {
          // The userID indicate progress of the faceID creation
          this.$emit("face-accepted", data.userID);
        }
      });

      this.recogBackendWS = ws;
    },

    /* Detection Queue of picojs */
    updateMemory: pico.instantiate_detection_memory(5),

    updatePico: function () {
      if (!this.cascadeReady) return;
      if (
        this.$refs.canvas === undefined ||
        this.$refs.raw_canvas === undefined
      ) {
        // Kill it self
        clearInterval(this.timer);
      }

      let ctx = this.$refs.canvas.getContext("2d");
      let raw_ctx = this.$refs.raw_canvas.getContext("2d");

      let width = this.canvasWidth;
      let height = this.canvasHeight;

      //Draw video to raw canvas
      raw_ctx.drawImage(
        this.$refs.capture,
        this.drawParameter.x,
        this.drawParameter.y,
        this.drawParameter.width,
        this.drawParameter.height
      );

      //Clone data from raw canvas to standard canvas
      ctx.drawImage(this.$refs.raw_canvas, 0, 0);

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
      // Store detected faces
      this.dets = dets;

      for (let face of dets) {
        if (face[3] > 50.0) {
          ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
          let _width = face[2] / 2;
          let _x = face[1] - _width / 2;
          let _y = face[0] - _width / 2;

          let fX = Math.round(face[1]);
          let fY = Math.round(face[0]);
          let fW = Math.round(face[2]);
          fW = fW * 1.2;

          let faceX = Math.round(fX - fW / 2);
          let faceY = Math.round(fY - fW / 2);
          let faceW = fW;

          ctx.beginPath();
          ctx.lineWidth = "3";
          ctx.strokeStyle = "blue";
          ctx.strokeRect(faceX, faceY, faceW, faceW);
          ctx.stroke();

          // Clone raw image from camera
          let crop_x = faceX;
          let crop_y = faceY;
          let crop_diameter = faceW;
          let target_diameter = 160;
          let dummy_canvas = document.createElement("canvas");
          dummy_canvas.width = target_diameter;
          dummy_canvas.height = target_diameter;

          let dummy_ctx = dummy_canvas.getContext("2d");
          dummy_ctx.drawImage(
            this.$refs.raw_canvas,
            crop_x,
            crop_y,
            crop_diameter,
            crop_diameter,
            0,
            0,
            target_diameter,
            target_diameter
          );

          // Request faces from server
          this.newFaceReq(dummy_canvas.toDataURL("image/jpeg", 1.0));
        }
      }
    },
    newFaceReq: function (encoded_img) {
      this.req_id++;

      // Slow down the requests
      if (this.req_id % 10 != 0) return;
      // Send recognize request to backend.
      let new_face_msg_payload = {
        img: encoded_img,
        req_id: this.req_id,
        label: this.label,
      };

      this.recogBackendWS.emit("new", new_face_msg_payload);
    },
  },
};
</script>

<style scoped lang="stylus">
.content {
  overflow: hidden;

  /* hide the original video */
  video {
    display: none;
  }

  canvas {
    /* Make video to at least 100% wide and tall */
    min-width: 100%;
    min-height: 100%;
    /* Setting width & height to auto prevents the browser from stretching or squishing the video */
    width: auto;
    height: auto;
  }
}
</style>
