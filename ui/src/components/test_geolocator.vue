<template>
  <div>
    <canvas ref="canvas"></canvas>
    <div class="debug" ref="debug">
      <h1>
        Debugger:
        <div class="btn" v-on:click="clearHistory">Clear History</div>
      </h1>
      <br />
      <pre>
      1 grid = {{(1/this.activeScale).toFixed(2)}} m
      Kalman Gain: {{ K.toFixed(5) }}
      Varience of Estimate:   {{ estimatePos.var.toFixed(5) }}
      Varience of Measurment: {{ measurePos.var.toFixed(5) }}
      Estimate: ({{ estimatePos.x.toFixed(5) }}, {{ estimatePos.y.toFixed(5) }})
      Measured: ({{ measurePos.x.toFixed(5) }}, {{ measurePos.y.toFixed(5) }})
      Filtered: ({{ rawX.toFixed(5) }}, {{ rawY.toFixed(5) }})
      Compare to Init: ({{ (rawX - initX).toFixed(5) }},{{
          (rawY - initY).toFixed(5)
        }})
      Speed: {{speed.norm}} m/s, Heading: {{speed.heading}}
      Timestamp: {{ timestamp() }}
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
    initX: 0,
    initY: 0,
    deltaX: 0,
    deltaY: 0,
    activeDeltaX: 0,
    activeDeltaY: 0,
    history: [],
    gridSize: 10, // pixels
    scale: 1,
    activeScale: 1
  }),
  computed: {
    cnt: function() {
      return this.history.length;
    },
    totalDeltaX: function() {
      return this.deltaX + this.activeDeltaX;
    },
    totalDeltaY: function() {
      return this.deltaY + this.activeDeltaY;
    },
    speed: function(){
      if(this.cnt<2){
        return {
          norm: 0,
          heading: NaN
        }
      }
      let speed = {
        x: this.history[this.cnt-1].x - this.history[this.cnt-2].x,
        y: this.history[this.cnt-1].y - this.history[this.cnt-2].y
      }
      return {
        norm: Math.sqrt(speed.x*speed.x+speed.y*speed.y).toFixed(5),
        heading: (180/Math.PI*Math.atan(-speed.y/speed.x)).toFixed(5)
      };
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
    timestamp: () => +Date.now(),
    onGeolocationRead: function(pos) {
      this.estimatePos = pos.estimatePos;
      this.measurePos = pos.measurePos;
      this.K = pos.K;
      this.rawX = pos.x;
      this.rawY = pos.y;
      this.accuracy = pos.accuracy;
      if (this.cnt == 0) {
        this.initX = this.rawX;
        this.initY = this.rawY;
      }
      let x = this.rawX - this.initX;
      let y = -(this.rawY - this.initY); //Invert Y-axis

      // Push new point and draw
      this.history.push({ x, y });
      this.draw();
    },
    onCanvasPan(e) {
      if (e.type === "panend") {
        this.deltaX += e.deltaX;
        this.deltaY += e.deltaY;
        this.activeDeltaX = 0;
        this.activeDeltaY = 0;
      } else {
        this.activeDeltaX = e.deltaX;
        this.activeDeltaY = e.deltaY;
      }

      window.requestAnimationFrame(this.draw.bind(this));
    },
    onCanvasZoom(e) {
      this.activeScale = this.scale * e.scale;
      if (e.type === "pinchend") {
        this.scale = this.activeScale;
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
        let i = this.totalDeltaX % this.gridSize;
        i < window.innerWidth;
        i += this.gridSize
      ) {
        this.ctx.moveTo(i, 0);
        this.ctx.lineTo(i, window.innerHeight);
      }
      //Horizontal
      for (
        let i = this.totalDeltaY % this.gridSize * this.activeScale;
        i < window.innerHeight;
        i += this.gridSize
      ) {
        this.ctx.moveTo(0, i);
        this.ctx.lineTo(window.innerWidth, i);
      }
      this.ctx.closePath();
      this.ctx.stroke();

      this.ctx.translate(window.innerWidth / 2, window.innerHeight / 2);

      //Draw history point(1grid = 1m)
      for (let [index, point] of this.history.entries()) {
        let newX =
          point.x * this.gridSize * this.activeScale + this.totalDeltaX;
        let newY =
          point.y * this.gridSize * this.activeScale + this.totalDeltaY;
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
