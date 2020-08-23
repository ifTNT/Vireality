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
    <canvas ref="indicator3d" class="indicator3d"></canvas>
    <div class="slider-container">
      <label>Cur. Dir.</label>
      <span>{{(currentDir/Math.PI*180).toFixed(4)}}deg</span>
      <!--<input type="range" class="slider" ref="currentDir" v-model="currentDir" />-->
    </div>
    <div class="slider-container">
      <label>Roll</label>
      <input type="range" class="slider" ref="roll" v-model="roll" />
    </div>
    <div class="slider-container">
      <label>Yaw</label>
      <input type="range" class="slider" ref="yaw" v-model="yaw" />
    </div>
    <div class="slider-container">
      <label>Pitch</label>
      <input type="range" class="slider" ref="pitch" v-model="pitch" />
    </div>
  </div>
</template>
<script>
import * as THREE from "three";
export default {
  name: "testFriendListAround",
  data() {
    return {
      testDirStep: 50, // How many test point in a circle.
      display: [], // The elements that will be display.
      currentDir: 0, // Radius.
      FOV: Math.PI / 3, // The FoV that the friend will be displyed. (rad)
      widthDisplay: 300, // The range of projected direction. (px)
      roll: 0,
      yaw: 0,
      pitch: 0,
      threeObj: {
        renderer: null,
        camera: null,
        scene: null,
        axesHelper: null,
        cellPhone: null
      }
    };
  },
  mounted() {
    // Initialize Three.js
    const indicatorWidth = 300;
    const indicatorHeight = 300;
    this.threeObj.renderer = new THREE.WebGLRenderer({
      canvas: this.$refs.indicator3d,
      antialias: true,
      alpha: true
    });
    this.threeObj.renderer.setPixelRatio(indicatorWidth / indicatorHeight);
    this.threeObj.renderer.setSize(indicatorWidth, indicatorHeight);
    this.$refs.indicator3d.width = indicatorWidth;
    this.$refs.indicator3d.height = indicatorHeight;

    // Setup camera of Three.js
    this.threeObj.camera = new THREE.PerspectiveCamera(
      60, //Calcualted FoV.
      indicatorWidth / indicatorHeight, //Aspect ratio
      0.5, //Near plate
      1100 //Far plate
    );
    this.threeObj.camera.position.set(0, 0, 1);

    // The scene object will attach all of the visible object
    this.threeObj.scene = new THREE.Scene();

    // Add an axes helper to scene
    this.threeObj.axesHelper = new THREE.AxesHelper(0.5);
    this.threeObj.axesHelper.position.set(0, 0, 0);

    // Add a reference cell phone model to the scene
    this.threeObj.cellPhone = new THREE.Mesh(
      new THREE.CubeGeometry(0.2, 0.3, 0.05),
      new THREE.MeshNormalMaterial()
    );

    // Post initialization of Three.js
    this.threeObj.scene.add(this.threeObj.axesHelper);
    this.threeObj.scene.add(this.threeObj.cellPhone);
    this.threeObj.renderer.render(this.threeObj.scene, this.threeObj.camera);

    // Change the minimum and maximum value of the slider
    [
      this.$refs.roll,
      this.$refs.yaw,
      this.$refs.pitch
    ].forEach(slider => {
      slider.min = 0;
      slider.max = 2 * Math.PI;
      slider.step = 0.0001;
    });

    // Display current direction and visiable lables
    this.updateDir();
  },

  // Monitor the changes of sliders
  watch: {
    roll: function() {
      this.updateDir();
    },
    yaw: function() {
      this.updateDir();
    },
    pitch: function() {
      this.updateDir();
    }
  },

  methods: {
    // Display current direction and visiable lables by given device orientation
    updateDir() {
      
      // Construct the new rotation from global frame to local frame
      let newRotation = new THREE.Euler(this.pitch, this.roll, this.yaw, "XYZ");
      let quaternion = new THREE.Quaternion();
      quaternion.setFromEuler(newRotation);
      
      // Update 3D indicator
      this.threeObj.axesHelper.quaternion.copy(quaternion);
      this.threeObj.cellPhone.quaternion.copy(quaternion);
      this.threeObj.renderer.render(this.threeObj.scene, this.threeObj.camera);

      // Calucalte new heading
      this.currentDir = this.calculateHeading(quaternion);

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
    },

    // Calculate heading angle in XY-Plane from given quaternion.
    calculateHeading(orientation) {
      let primaryProbe = new THREE.Vector3(0, 0, -1);
      let secondProbe = new THREE.Vector3(0, 1, 0);

      // Calculate the probes direction in global frame
      primaryProbe.applyQuaternion(orientation);
      secondProbe.applyQuaternion(orientation);

      // Project the probes to the global XY-Plane
      primaryProbe = this.projVec2XY(primaryProbe);
      secondProbe = this.projVec2XY(secondProbe);

      // Decide which probe can discribe the current heading
      let selectedProbe = new THREE.Vector3();
      const threshold = 1/Math.sqrt(2);
      if (primaryProbe.length() < threshold) {
        selectedProbe.copy(secondProbe);
      } else {
        selectedProbe.copy(primaryProbe);
      }

      // Calculate the heading angle from selected probe
      let headingAngle = Math.atan2(selectedProbe.y, selectedProbe.x);

      // Convert the angle from [-pi, pi] to [0, 2pi]
      if(headingAngle<0){
        headingAngle += 2*Math.PI;
      }

      return headingAngle;
    },

    // Project the given three dimentional vector to XY-Plane
    projVec2XY(testVec) {
      testVec.z = 0;
      return testVec;
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

.slider-container {
  width: 20em;
  display: flex;
  justify-content: space-between;
  margin: 0.5em 0;
}

.indicator3d {
  box-sizing: border-box;
  margin-bottom: 2em;
}
</style>