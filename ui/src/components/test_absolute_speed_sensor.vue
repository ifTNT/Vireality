<template>
  <div>
    <pre ref="debug" class="debug">
    Accel:
      x: {{accel.x}}
      y: {{accel.y}}
      accuracy: {{accel.accuracy}}
    Speed:
      x: {{speed.x}}
      y: {{speed.y}}
      accuracy: {{speed.accuracy}}
      norm: {{speed.norm}}
    Position:
      x: {{pos.x}}
      y: {{pos.y}}
      accuracy: {{pos.accuracy}}

    </pre>
  </div>
</template>

<script>
import Absolute2DSpeedSensor from "../lib/absolute_2d_speed_sensor.js";
export default {
  data: () => ({
    sensor: null
  }),
  computed: {
    accel: function(){
      let accel = this.sensor.readAccel()
      return {
        x: accel.x.toFixed(5),
        y: accel.y.toFixed(5),
        accuracy: accel.accuracy.toFixed(5),
      }
    },
    speed: function(){
      let speed = this.sensor.readSpeed()
      return {
        x: speed.x.toFixed(5),
        y: speed.y.toFixed(5),
        accuracy: speed.accuracy.toFixed(5),
        norm: speed.norm.toFixed(5)
      }
    },
    pos: function(){
      let pos = this.sensor.readPosition()
      return {
        x: pos.x.toFixed(5),
        y: pos.y.toFixed(5),
        accuracy: pos.accuracy.toFixed(5),
      }
    }
  },
  created() {
    this.sensor = new Absolute2DSpeedSensor();
  },
  methods: {
  }
};
</script>

<style scoped lang="stylus">
.debug
  font-family monospace
</style>
