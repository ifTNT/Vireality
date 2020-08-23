<template>
  <div class="wrap">
    <ul class="linear-display" :style="{'width': `${widthDisplay}px`}">
      <li
        v-for="item in display"
        :key="item.lable"
        :style="{'left': `${item.position}px`}"
      >{{item.lable}}</li>
    </ul>
    <div class="center-mark"></div>
    <div class="indicator" :style="{'transform': `rotate(-${currentDir}rad)`}"></div>
    <input type="range" class="slider" ref="slider" v-model="currentDir" />
  </div>
</template>
<script>
export default {
  name: "testFriendListAround",
  data() {
    return {
      testDirStep: 50, // How many test point in a circle.
      display: [], // The elements that will be display.
      currentDir: 0, // Radius.
      FOV: Math.PI / 3, // The FoV that the friend will be displyed. (rad)
      widthDisplay: 300 // The range of projected direction. (px)
    };
  },
  mounted() {
    // Change the minimum and maximum value of the slider
    this.$refs.slider.min = 0;
    this.$refs.slider.max = 2 * Math.PI;
    this.$refs.slider.step = 0.0001;

    // Display current direction and visiable lables
    this.updateDir();
  },
  watch: {
    currentDir: function(newVal, oldVal) {
      this.updateDir();
    }
  },
  methods: {
    // Display current direction and visiable lables
    updateDir() {
      // Clear the displayed lables
      this.display = [];
      // Enumerate whole circle.
      for (let testIndex = 0; testIndex < this.testDirStep; testIndex++) {
        // Calculate the test direction of this round.
        let testDir = 2 * Math.PI * (testIndex / this.testDirStep);

        // Display the test lable if the test direction is in visible range.
        if (this.inVisibleRange(testDir)) {
          this.display.push({
            lable: testIndex,
            position: this.calculatePosition(testDir)
          });
        }
      }
    },

    // Return whether the given direction is visible from current direction.
    inVisibleRange(testDir) {
      // Get the normalized angle difference between current direction and given direction.
      let diffAngle = testDir - this.currentDir;
      diffAngle = Math.min(
        Math.abs(diffAngle),
        Math.abs(diffAngle + 2 * Math.PI),
        Math.abs(diffAngle - 2 * Math.PI)
      );

      // The angle difference less than the half of FoV implies the given direction is in the visible range.
      return diffAngle < this.FOV / 2;
    },

    // Return the 1-D-position of projected test direction.
    calculatePosition(testDir) {
      // Get the angle difference between the currection direction and the given direction.
      let diffAngle = testDir - this.currentDir;

      // Project the direction to the base line of current direction.
      let projectedDir = Math.sin(diffAngle);

      // The maximum position that projected direction will be.
      const maxProjection = Math.sin(this.FOV / 2);

      // Scale the projected direction in order to fit the display area.
      projectedDir *= this.widthDisplay / 2 / maxProjection;

      // Normalize the projected direction to [0, this.wideDisplay]
      projectedDir += this.widthDisplay / 2;

      return projectedDir;
    }
  }
};
</script>

<style scoped lang="stylus">
.wrap {
  width: 1500px;
  margin: 2em auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.linear-display {
  height: 2em;
  border: solid gray 1px;
  position: relative;
  box-sizing: border-box;
  overflow: hidden;

  li {
    width: 3em;
    margin-left: -1.5em;
    height: 2em;
    position: absolute;
    float: left;
    top: 0;
    display: flex;
    justify-content: center;
    align-items: center;
  }
}

.center-mark {
  height: 1em;
  border-left: solid black 1px;
  border-right: solid black 1px;
}

.indicator {
  width: 5em;
  height: 1em;
  margin: 3em 0;
  font-size: 30px;
  display: flex;
  align-items: center;

  &::before {
    content: '';
    width: 4em;
    height: 0.5em;
    background-color: black;
  }

  &::after {
    content: '';
    display: inline-block !important;
    width: 0;
    height: 0;
    border-left: solid black 1em;
    border-top: solid transparent 0.5em;
    border-bottom: solid transparent 0.5em;
  }
}
</style>