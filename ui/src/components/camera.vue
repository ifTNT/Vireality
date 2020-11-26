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
import Axios from "axios";
import io from "socket.io-client";

export default {
  name: "camera",
  props: {
    facingMode: {
      type: String,
      default: "environment",
      validator: (
        value // The value must match one of two strings
      ) => ["environment", "user"].indexOf(value) !== -1,
    },
    tapCoordinate: {
      type: Object,
    },
  },
  watch: {
    tapCoordinate: function (newCoord, oldCoord) {
      for (let face of this.dets) {
        if (face[3] > 50.0) {
          let width = face[2] / 2;
          let x = face[1] - width / 2;
          let y = face[0] - width / 2;

          // The box of detected face
          const aspect_ratio = 1;
          let height = width * aspect_ratio;
          y -= height * 1.8; //Calculate offset. Negative is ok.
          if (
            Math.abs(newCoord.y - y) < width &&
            Math.abs(newCoord.x - x) < width
          ) {
            // Tap in region of detection
            // [TODO] Lookup table to translate faces to link.
            this.$emit("open", "/main/profile");
            break;
          }
        }
      }
    },
  },
  data: () => ({
    cameraReady: false,
    facefinderClassifyRegion: {},
    markImg: new Image(),
    markImgReady: false,
    cascadeReady: false,

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
    // The pending queue of backend.
    recogPending: new Set([]),

    debug: false,
  }),
  mounted() {
    this.initCamera();
    this.initPico();
    this.initMarkImage();
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
            `[Face Detection] Camera stream loaded. VideoWidth: ${width}, VideoHeight: ${height}`
          );
          console.re.log(
            `[Face Detection] CanvasWidth: ${this.canvasWidth}, CanvasHeight: ${this.canvasHeight}`
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
            `[Face Detection] Scaled Video Width: ${width * scale} Height: ${
              height * scale
            }`
          );
          //=============================================

          // Inform upper-layer component that camera stream is ready
          this.$emit("camera-ready", width * scale, height * scale);

          // Update the pico face detector every frame.
          this.updatePico();

          // Perodicly check whether faces has assigned userID.
          // If not, send a recognize request to backend.
          window.setInterval(() => {
            this.updateId();
          }, 1000);
        },
        false
      );

      if (navigator.mediaDevices.getUserMedia) {
        console.re.log(`[Face Detection] Facing Mode:${this.facingMode}`);
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
            console.re.log("[Face Detection] Setting stream");
            this.$refs.capture.srcObject = stream;
          })
          .catch((error) => {
            console.re.log(`[Face Detection] Get webcam error`, error);
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
          console.re.log("[Face Detection] facefinder loaded");
        });
    },
    initMarkImage: function () {
      this.markImg.addEventListener("load", () => {
        console.re.log("[Face Detection] marker loaded");
        this.markImgReady = true;
      });
      this.markImg.src = "/static/media/placeholder.png";
    },

    // Initialize the websocket connection to backend.
    initRecogBackendWS: function () {
      let ws = io(server.recogBackendUrl());

      // The common event handler of websockets
      ws.on("connect", () => {
        console.re.log("[Recog-backend WS] Connection opened");
      });

      ws.on("disconnect", () => {
        console.re.log("[Recog-backend WS] Connection closed");
      });

      // The event which will be triggred while receive data from server
      ws.on("recog_res", (data) => {
        this.onRecogBackendWSRes(data);
      });

      this.recogBackendWS = ws;
    },

    /* Detection Queue of picojs */
    updateMemory: pico.instantiate_detection_memory(5),

    updateConfidenceTable: function (ctx) {
      var wayLength = [];
      for (let face of this.dets) {
        if (face[3] > 50.0) {
          wayLength.push([-1, 10000000, 0, 0]);
        }
      }

      var faceI = 0;

      for (let face of this.dets) {
        if (face[3] > 50.0) {
          //console.log(face);
          // add all face in wayLength
          const scale_factor = 1.2;
          wayLength[faceI][2] = face[1] - (face[2] * scale_factor) / 2;
          wayLength[faceI][3] = face[0] - (face[2] * scale_factor) / 2;
          wayLength[faceI][4] = face[2] * scale_factor;
          if (this.confiTable[0] == undefined) {
            faceI++;
            continue;
          }
          // find if there has same face
          for (var j = 0; j < this.confiTable.length; j++) {
            const xDist =
              face[1] - face[2] / 2 - this.confiTable[j].position[0];
            const yDist =
              face[0] - face[2] / 2 - this.confiTable[j].position[1];
            var target = Math.pow(xDist, 2) + Math.pow(yDist, 2);
            if (wayLength[faceI][1] > target && target < 3000) {
              wayLength[faceI][0] = j;
              wayLength[faceI][1] = target;
            }
          }
          faceI++;
        }
      }
      // console.log(wayLength);
      var confiThis = new Array(this.confiTable.length);
      confiThis.fill(-1, 0, this.confiTable.length);
      for (var j = 0; j < wayLength.length; j++) {
        if (wayLength[j][0] != -1) {
          if (confiThis[wayLength[j][0]] == -1) {
            confiThis[wayLength[j][0]] == j;
          } else {
            if (wayLength[confiThis[wayLength[j][0]]][1] > wayLength[j][1]) {
              confiThis[wayLength[j][0]] == j;
              wayLength[confiThis[wayLength[j][0]]][0] = -1;
              wayLength[confiThis[wayLength[j][0]]][1] = 10000000;
            }
          }
        }
      }
      for (var j = 0; j < wayLength.length; j++) {
        if (wayLength[j][0] == -1) {
          // console.log("test: " + j);
          this.confiTable.push({
            faceDeviceID: String(Date.now()) + String(j),
            userID: undefined,
            confidence: 16,
            position: [wayLength[j][2], wayLength[j][3], wayLength[j][4]],
            times: 0,
            fetchCountDown: 0,
            retryCnt: 0,
          });
        } else {
          // if (this.confiTable[j] == undefined) break;
          // this.confiTable[wayLength[j][0]].faceDeviceID =
          //   this.confiTable[wayLength[j][0]].faceDeviceID.toString()[0] == "f"
          //     ? this.confiTable[wayLength[j][0]].faceDeviceID
          //     : "f" + this.confiTable[wayLength[j][0]].faceDeviceID;
          this.confiTable[wayLength[j][0]].confidence = 15;
          this.confiTable[wayLength[j][0]].position = [
            wayLength[j][2],
            wayLength[j][3],
            wayLength[j][4],
          ];
          this.confiTable[wayLength[j][0]].times++;
        }
      }
      // delete the face whitch confidence is too low, else confidence - 1
      for (var i = this.confiTable.length - 1; i >= 0; i--) {
        if (this.confiTable[i] == undefined) continue;
        else if (this.confiTable[i].confidence < 4) {
          this.confiTable.splice(i, 1);
        } else this.confiTable[i].confidence--;
      }
      // console.log("====== test start =====");
      // console.log("wayLength: " + wayLength.length);
      // console.log(wayLength);
      // // wayLength.forEach((element) => {
      // //   console.log(element[0]);
      // // });
      // console.log("dets:");
      // console.log(this.dets);
      // console.log("confiTablet" + this.confiTable.length);
      // this.confiTable.forEach((element) => {
      //   console.log(element);
      // });
      // console.log("====== test end ====\n");

      this.confiTable.forEach((element) => {
        if (this.debug) {
          ctx.beginPath();
          ctx.lineWidth = "2";
          if (element.times == 0) ctx.strokeStyle = "blue";
          else {
            ctx.strokeStyle = "orange";
          }
          // ctx.strokeStyle = "blue";
          ctx.rect(
            element.position[0],
            element.position[1],
            element.position[2],
            element.position[2]
          );
          ctx.font = "30px Arial";
          if (element.userID !== undefined) {
            ctx.fillText(
              `UID: ${element.userID}`,
              element.position[0],
              element.position[1]
            );
          } else {
            ctx.fillText(
              element.faceDeviceID,
              element.position[0],
              element.position[1]
            );
          }
          ctx.fillText(
            element.times,
            element.position[0],
            element.position[1] + 30
          );
          ctx.stroke();

          // confiDelete++
        } else {
          // The position information of current face.
          let face_x = element.position[0];
          let face_y = element.position[1];
          let face_width = element.position[2];
          let face_height = face_width;
          let font_size = 30;
          ctx.font = `${font_size}px Roboto,微軟正黑體,Microsoft JhengHei,sans-serif`;
          // The margin of user ID box, in pixels.
          let margin = 10;

          //Draw the marker of detected face
          const aspect_ratio = 0.5;
          let marker_height = face_height * aspect_ratio;
          let marker_width = face_width * aspect_ratio;
          //Calculate offset. Negative is ok.
          let marker_y =
            element.userID === undefined
              ? face_y - marker_height
              : face_y - marker_height - font_size - 2 * margin;
          let marker_x = face_x + marker_width / 2;
          ctx.drawImage(
            this.markImg,
            marker_x,
            marker_y,
            marker_width,
            marker_height
          );

          if (element.userID !== undefined) {
            // The height and width calculated by given user id.
            let user_id_height = font_size;

            let user_id_width = ctx.measureText(element.userID).width;
            let user_id_x = face_x + face_width / 2 - user_id_width / 2;
            let user_id_y = face_y - margin;

            // The drawing position of background rectangle
            let rect_width = user_id_width + 2 * margin;
            let rect_height = user_id_height + 2 * margin;
            let rect_x = user_id_x - margin;
            let rect_y = user_id_y - user_id_height - margin;

            // Draw the background box
            ctx.fillStyle = "#76a5afaa";
            ctx.fillRect(rect_x, rect_y, rect_width, rect_height);

            ctx.fillStyle = "white";
            ctx.fillText(`${element.userID}`, user_id_x, user_id_y);
          }
        }
      });
      if (this.debug) {
        // return this.confiTable.length;
        ctx.font = "30px Arial";
        ctx.fillText(this.confiTable.length, 200, 30);
      }
    },

    updatePico: function () {
      requestAnimationFrame(this.updatePico);
      if (!this.markImgReady || !this.cascadeReady) return;

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
      ctx.strokeStyle = "white";
      //ctx.font = "20px Ubuntu";

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
          // console.log(faceX);
          // console.log(faceY);
          // console.log(faceW);

          if (this.debug) {
            ctx.beginPath();
            ctx.lineWidth = "3";
            ctx.strokeStyle = "blue";
            ctx.strokeRect(faceX, faceY, faceW, faceW);
            ctx.stroke();
          }
        }
      }
      this.updateConfidenceTable(ctx);
    },
    updateId: function () {
      let ctx = this.$refs.canvas.getContext("2d");
      // ctx.fillText("test", 100, 30);
      for (var i = 0; i < this.confiTable.length; i++) {
        let currConfi = this.confiTable[i];
        if (currConfi.userID === undefined) {
          if (currConfi.fetchCountDown > 0) {
            currConfi.fetchCountDown--;
            continue;
          }
          // Exponential back-off
          currConfi.retryCnt += 1;
          currConfi.fetchCountDown = Math.pow(2, currConfi.retryCnt);

          // Clone raw image from camera
          let crop_x = currConfi.position[0];
          let crop_y = currConfi.position[1];
          let crop_diameter = currConfi.position[2];
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
          this.fetchIdbyFace(
            dummy_canvas.toDataURL("image/jpeg", 1.0),
            currConfi.faceDeviceID
          );
        }
      }
    },
    fetchIdbyFace: function (encoded_img, faceDeviceID) {
      // Abort when there existed a pending request.
      if (this.recogPending.has(faceDeviceID)) return;

      // Append to pending list.
      this.recogPending.add(faceDeviceID);

      console.re.log(
        `[Recog-backend WS] Fetching face with faceDeviceID=${faceDeviceID}`
      );

      // Send recognize request to backend.
      let recog_msg_payload = {
        faceDeviceID,
        img: encoded_img,
      };

      this.recogBackendWS.emit("recog", recog_msg_payload);
    },

    // This function will be called while received response from backend.
    // If the response is user founded,
    // it will update entity in confiTable accroding to given job.
    // Otherwise, nothing will happend.
    onRecogBackendWSRes(res) {
      // Remove job from pending list.
      this.recogPending.delete(res.faceDeviceID);

      // If not found the face in database, do nothing.
      if (!res["found"]) return;

      console.re.log(`[Recog-backend WS] ${res.faceDeviceID} is ${res.userID}`);

      // Linearly searching the confiTable entity cooresponsed to faceDeviceID
      for (let i = 0; i < this.confiTable.length; i++) {
        let face = this.confiTable[i];

        // Update the cooresponsed entity with responsed userID
        if (face.faceDeviceID === res.faceDeviceID) {
          face.userID = res.userID;
          break;
        }
      }

      return;
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
