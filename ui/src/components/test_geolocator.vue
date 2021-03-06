<template>
  <div>
    <canvas ref="canvas"></canvas>
    <div class="debug" ref="debug">
      <h1>
        <div v-on:click="showInfo = !showInfo">Debugger:</div>
        <div class="btn" v-on:click="clearHistory">Clear History</div>
        <div class="btn" v-if="lockLast" v-on:click="lockLast = !lockLast">
          Panning mode
        </div>
        <div class="btn" v-if="!lockLast" v-on:click="lockLast = !lockLast">
          Lock last point
        </div>
      </h1>
      <pre v-if="showInfo">
      1 grid = {{ (gridSize / activeScale).toFixed(2) }} m
      Kalman Gain: {{ K.toFixed(5) }}
      Varience of Estimate:   {{ estimatePos.var.toFixed(5) }}
      Varience of Measurment: {{ measurePos.var.toFixed(5) }}
      Estimate: ({{ estimatePos.x.toFixed(5) }}, {{ estimatePos.y.toFixed(5) }})
      Measured: ({{ measurePos.x.toFixed(5) }}, {{ measurePos.y.toFixed(5) }})
      Filtered: ({{ rawX.toFixed(5) }}, {{ rawY.toFixed(5) }})
      Speed: {{ speed.norm }} m/s, Heading: {{ speed.heading }}
      Delta Time: {{ deltaTime }}
      History Count: {{ cnt }}
      </pre>
      <!-- <ul>
         <li v-for="(item, index) in history">
           {{ index }}: ({{ item.x.toFixed(5) }}, {{ item.y.toFixed(5) }})
         </li>
      </ul>-->
    </div>
    <div class="compass">
      <div>N</div>
      <div>W ╋ E</div>
      <div>S</div>
    </div>
  </div>
</template>

<script>
import Geolocator from "../lib/geolocator";
import * as Hammer from "hammerjs";
export default {
  data: () => ({
    geolocator: null,
    ctx: null,
    rawX: 0,
    rawY: 0,
    estimatePos: { x: 0, y: 0, var: 0 },
    measurePos: { x: 0, y: 0, var: 0 },
    K: 0,
    accuracy: -1,
    deltaX: 0,
    deltaY: 0,
    lastCenterX: 0,
    lastCenterY: 0,
    history: [],
    gridSize: 10, // pixels
    scale: 10, // 1m = 10px
    activeScale: 10,
    centerX: 0, // The center coordinate of canvas
    centerY: 0,
    lockLast: true,
    isZooming: false,
    showInfo: true
  }),
  computed: {
    cnt: function() {
      return this.history.length;
    },
    speed: function() {
      if (this.cnt < 2) {
        return {
          norm: 0,
          heading: NaN
        };
      }
      let lastP = this.history[this.cnt - 1];
      let last2P = this.history[this.cnt - 2];
      let speed = {
        x: (lastP.x - last2P.x) / this.deltaTime,
        y: (lastP.y - last2P.y) / this.deltaTime
      };
      return {
        norm: Math.sqrt(speed.x * speed.x + speed.y * speed.y).toFixed(5),
        heading: ((180 / Math.PI) * Math.atan(-speed.y / speed.x)).toFixed(5)
      };
    },
    deltaTime: function() {
      if (this.cnt < 2) {
        return NaN;
      } else {
        let lastP = this.history[this.cnt - 1];
        let last2P = this.history[this.cnt - 2];
        return (lastP.t - last2P.t) / 1000;
      }
    }
  },
  mounted() {
    this.geolocator = new Geolocator();
    this.geolocator.watchDebug(this.onGeolocationRead.bind(this));

    this.$refs.canvas.width = window.innerWidth;
    this.$refs.canvas.height = window.innerHeight;
    this.ctx = this.$refs.canvas.getContext("2d");

    let gesture = new Hammer(this.$refs.canvas);
    gesture.get("pan").set({ direction: Hammer.DIRECTION_ALL });
    gesture.on("panmove panend", this.onCanvasPan.bind(this));
    gesture.get("pinch").set({ enable: true });
    gesture.on("pinchmove pinchend", this.onCanvasZoom.bind(this));
  },
  methods: {
    onGeolocationRead: function(pos) {
      this.estimatePos = pos.estimatePos;
      this.measurePos = pos.measurePos;
      this.K = pos.K;
      this.rawX = pos.x;
      this.rawY = pos.y;
      this.accuracy = pos.accuracy;

      // Push new point and draw
      this.history.push({
        x: pos.x,
        y: pos.y,
        t: pos.timestamp
      });

      //Move center to last point in lock mode
      if (this.lockLast) {
        this.centerX = this.rawX;
        this.centerY = this.rawY;
        this.lastCenterX = this.rawX;
        this.lastCenterY = this.rawY;
      }
      this.draw();
    },
    onCanvasPan(e) {
      //Disable panning when in lock mode
      if (this.lockLast) {
        this.deltaX = 0;
        this.deltaY = 0;
        return;
      }

      //Prevent panning from zooming
      if (this.isZooming) return;

      if (e.type === "panend") {
        this.deltaX += e.deltaX / this.activeScale;
        this.deltaY -= e.deltaY / this.activeScale;
        this.centerX = this.lastCenterX - this.deltaX;
        this.centerY = this.lastCenterY - this.deltaY;
      } else {
        this.centerX =
          this.lastCenterX - (this.deltaX + e.deltaX / this.activeScale);
        this.centerY =
          this.lastCenterY - (this.deltaY - e.deltaY / this.activeScale);
      }

      window.requestAnimationFrame(this.draw.bind(this));
    },
    onCanvasZoom(e) {
      this.activeScale = this.scale * e.scale;
      this.isZooming = true;
      if (e.type === "pinchend") {
        this.scale = this.activeScale;

        //Debounce to prevent pan after zooming
        setTimeout(() => {
          this.isZooming = false;
        }, 100);
      }
      window.requestAnimationFrame(this.draw.bind(this));
    },
    draw() {
      //Let center of canvas be the center of screen, then draw.

      //Clear last frame
      this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      this.ctx.save();

      //Draw grid
      this.ctx.strokeStyle = "#efefef";

      this.ctx.beginPath();
      //Verticle
      for (
        let i = -(this.centerX * this.activeScale) % this.gridSize;
        i < window.innerWidth;
        i += this.gridSize
      ) {
        this.ctx.moveTo(i, 0);
        this.ctx.lineTo(i, window.innerHeight);
      }
      //Horizontal
      for (
        let i = -(-this.centerY * this.activeScale) % this.gridSize;
        i < window.innerHeight;
        i += this.gridSize
      ) {
        this.ctx.moveTo(0, i);
        this.ctx.lineTo(window.innerWidth, i);
      }
      this.ctx.closePath();
      this.ctx.stroke();

      this.ctx.translate(window.innerWidth / 2, window.innerHeight / 2);

      //Draw history point(default 1 grid = 1 m)
      for (let [index, point] of this.history.entries()) {
        let newX = (point.x - this.centerX) * this.activeScale;
        let newY = -(point.y - this.centerY) * this.activeScale;
        //Use different color to indicate the age of point.
        this.ctx.fillStyle = `hsl(0,${((index + 1) / this.history.length) *
          100}%,50%)`;
        this.ctx.fillRect(newX, newY, 2, 2);
      }
      this.ctx.restore();
    },
    clearHistory: function() {
      this.history = [];

      //Clear last frame
      this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }
};
</script>

<style scoped lang="stylus">
.debug
  position fixed
  bottom 0px
  left 0px
  font-size 12px
  line-height 1.5em
  padding 1em
  box-sizing border-box
  width 100vw
  font-family monospace
  h1
    display flex
    justify-content space-between
  pre
    max-height 20em
    overflow-x scroll
.btn
  padding 0.2em 0.5em 0.2em 0.5em
  border: solid black 1px
  display: inline-block
  border-radius 1em;
  background-color rgba(230,230,210,0.5)
.compass
  display flex
  flex-direction column
  align-items center
  position fixed
  top 1em
  right 1em
  texe-align center
  font-family monospace
  line-height 1.5em
</style>
