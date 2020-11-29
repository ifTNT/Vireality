<template>
  <div id="wrap">
    <nav>
      <!-- <proPic :diameter="parentDiameter" :Id="src[0]"></proPic> -->
      <div
        v-for="(user, index) in friendRad"
        v-bind:key="index"
        v-bind:style="{ left: `${user.pos}px`, color: 'red' }"
        v-show="user.visible"
      >
        <profilePicture
          v-bind:diameter="parentDiameter"
          v-bind:Id="user.id"
          v-on:click="openProfile(user.id)"
        ></profilePicture>
      </div>
      <!-- <img src="https://i.imgur.com/07XbOpL.png" alt style="width:2em" /> -->
      <!-- <p>{{this.listShowFriend[0].dir}}</p> -->
    </nav>
  </div>
</template>
<script>
import ProPic from "./profile_picture.vue";
import * as THREE from "three";
export default {
  name: "friendListAround",
  data() {
    return {
      friendRad: [],
      getFrientFlag: false,
      parentDiameter: "2em",
      currentDir: 0, // The calculated direction. (rad)
      FOV: Math.PI / 3, // The FoV that the friend will be displyed. (rad)
      widthDisplay: 300, // The range of projected direction. (px)
    };
  },
  components: {
    profilePicture: ProPic,
  },
  mounted() {
    this.getFriends();
    // this.show();

    // Set the width of friend list to the width of window.
    this.widthDisplay = screen.availWidth;
  },
  methods: {
    openProfile(id) {
      this.$emit("open", "/main/profile");
    },
    // test() {
    //   this.sensorStarter();
    // },
    show() {
      this.styleList.length = 0;
      this.listShowFriend.forEach((index) => {
        // console.log(index);
        // if(index.dir - Math.PI / 6)
        this.styleList.push(
          `${
            100 - (100 * (Math.sin(index.dir - Math.PI / 6) + 0.5)).toFixed(2)
          }%`
        );
        console.log(100 * (Math.sin(index.dir - Math.PI / 6) + 0.5).toFixed(2));
        console.log((index.dir / Math.PI).toFixed(2));
      });
    },
    sensorStarter() {
      const options = { frequency: 60, referenceFrame: "device" };
      const sensor = new AbsoluteOrientationSensor(options);

      sensor.addEventListener("reading", () => {
        // model is a Three.js object instantiated elsewhere.
        // model.quaternion.fromArray(sensor.quaternion).inverse();
        this.updateDir(sensor.quaternion);
      });
      sensor.addEventListener("error", (error) => {
        if (event.error.name == "NotReadableError") {
          console.log("Sensor is not available.");
        }
      });
      sensor.start();
      console.log(sensor);
      console.log("test");
    },
    caculateMatrix(quaternion, dm) {
      var path = [];
      var output = [];
      let qx = quaternion[0];
      let qy = quaternion[1];
      let qz = quaternion[2];
      let qw = quaternion[3];
      path[3] = qw * dm[3] - qx * dm[0] - qy * dm[1] - qz * dm[2];
      path[0] = qx * dm[3] + qw * dm[0] + qz * dm[1] - qy * dm[2];
      path[1] = qy * dm[3] + qw * dm[1] + qz * dm[0] - qx * dm[2];
      path[2] = qz * dm[3] - qw * dm[2] + qx * dm[1] - qz * dm[0];
      output[3] = path[0] * qw - path[1] * -qx - path[2] * -qy - path[3] * -qz;
      output[0] = path[1] * qw + path[0] * -qx + path[3] * -qy - path[2] * -qz;
      output[1] = path[2] * qw + path[0] * -qy + path[3] * -qx - path[1] * -qz;
      output[2] = path[3] * qw - path[0] * -qz + path[1] * -qy - path[3] * -qx;
      return output;
    },
    decideAxis(quaternion) {
      const dy = [0, 1, 0, 0]; //x,y,z,w
      const dz = [0, 0, 1, 0];
      var outputY = this.caculateMatrix(quaternion, dy);
      var outputZ = this.caculateMatrix(quaternion, dz);
      // (0,0,y,z)為投影在大地yz平面上，取abs(z/y)值較小者為所要的軸
      // 當z軸為所取之軸時要將得到值加上負號，-z

      var axisY = Math.abs(outputY[0] / outputY[1]);
      var axisZ = Math.abs(outputZ[0] / outputZ[2]);
      // console.log(outputY + "  " + outputZ);
      if (axisY <= axisZ) {
        this.xy(outputY[0], outputY[1]);
      } else {
        this.xy(outputZ[0], -outputZ[2]);
      }
    },
    xy(xNumber, yNumber) {
      var radXY;
      // console.log(xNumber+"  "+yNumber)
      if (yNumber < 0) {
        radXY =
          Math.acos(
            xNumber / Math.sqrt(Math.pow(xNumber, 2) + Math.pow(yNumber, 2))
          ) + Math.PI;
        // console.log("AAAAA");
      } else {
        radXY = Math.acos(
          xNumber / Math.sqrt(Math.pow(xNumber, 2) + Math.pow(yNumber, 2))
        );
        // console.log("BBBBB");
      }
      this.appendOnScreen(radXY);
    },
    getFriends() {
      //   this.friendRad = [
      //     {
      //       id: "123",
      //       dir: 0
      //     },
      //     {
      //       id: "1234",
      //       dir: 3.3218
      //     },
      //     {
      //       id: "12345",
      //       dir: 1.3318
      //     },
      //     {
      //       id: "123456",
      //       dir: 2.3518
      //     }
      //   ];
      //   this.friendRad.forEach(friend => {
      //     friend["pos"] = 0;
      //     friend["visible"] = false;
      //   });
      //   this.getFrientFlag = true;
      //   this.sensorStarter();
      this.axios
        .get(server.apiUrl("/user/friend_direction"))
        .then((response) => {
          if (response.data.ok === "true") {
            this.friendRad = response.data.result;
            console.log(this.friendRad);
            this.friendRad.forEach((friend) => {
              friend["pos"] = 0;
              friend["visible"] = false;
            });
            this.getFrientFlag = true;
          } else {
            console.log("can't get friend place without ok");
            setTimeout(() => {
              this.getFriends();
            }, 1000);
          }
        })
        .catch((response) => {
          console.log("can't get friends place");
          console.log(response);
          // getFriends();
        })
        .then(() => {
          this.sensorStarter();
        });
    },
    appendOnScreen(radXY) {
      var listToShow = [];
      var radDevice = []; //has two num, first is deviceDeg + π/6, second is deviceDeg - π/6
      // 上下限，超過2PI或小於零的部分在後面算差距時就會被導正，這裡可以先不管
      radDevice.push(radXY + Math.PI / 6);
      radDevice.push(radXY - Math.PI / 6);
      // if (radXY > (Math.PI * 11) / 6) {
      //   radDevice.push(radXY - (Math.PI * 11) / 6); //2*Math.PI-Math.PI/6+radXY
      // } else {
      //   radDevice.push(radXY + Math.PI / 6); //大於零的部分
      // }
      // if (radXY < Math.PI / 6) {
      //   radDevice.push((Math.PI * 11) / 6 + radXY); //2*Math.PI-Math.PI/6+radXY
      // } else {
      //   radDevice.push(radXY - Math.PI / 6);
      // }

      // console.log(radDevice);
      while (true) {
        if (this.getFrientFlag === true) {
          this.friendRad.forEach((element) => {
            if (
              element["dir"] <= radDevice[0] &&
              element["dir"] >= radDevice[1]
            ) {
              listToShow.push({
                id: element["id"],
                dir: Math.cos(element["dir"] - radDevice[1] + Math.PI / 6),
              });
            }
          });
          this.listShowFriend = listToShow;
          this.show();
          break;
        }
      }
      // console.log(this.listShowFriend.length);
      // if (this.listShowFriend.length) {
      //   this.listShowFriend.forEach(element => {
      //     console.log(element.dir);
      //   });
      // }
      // console.log(listToShow);
    },
    // Display current direction and visiable lables by given device orientation
    updateDir(quaternion_arr) {
      // Construct the new rotation from global frame to local frame
      let quaternion = new THREE.Quaternion();
      quaternion.fromArray(quaternion_arr);

      // Calucalte new heading
      this.currentDir = this.calculateHeading(quaternion);

      // Clear the displayed lables
      this.listShowFriend = [];
      // Enumerate whole circle.
      this.friendRad = this.friendRad.map((friend) => {
        // Display the test lable if the test direction is in visible range.
        friend["visible"] = this.inVisibleRange(friend["dir"]);
        friend["pos"] = this.calculatePosition(friend["dir"]);
        return friend;
      });
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

      // Inverse the direction
      projectedDir = -projectedDir;

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
      const threshold = 1 / Math.sqrt(2);
      if (primaryProbe.length() < threshold) {
        selectedProbe.copy(secondProbe);
      } else {
        selectedProbe.copy(primaryProbe);
      }

      // Calculate the heading angle from selected probe
      let headingAngle = Math.atan2(selectedProbe.y, selectedProbe.x);

      // Convert the angle from [-pi, pi] to [0, 2pi]
      if (headingAngle < 0) {
        headingAngle += 2 * Math.PI;
      }

      return headingAngle;
    },

    // Project the given three dimentional vector to XY-Plane
    projVec2XY(testVec) {
      testVec.z = 0;
      return testVec;
    },
  },
};
</script>

<style scoped lang="stylus">
#wrap {
  position: relative;
  width: 100%;
  height: 2em;
  overflow: hidden;

  nav div {
    position: absolute;
    display: inline-block;
    margin-left: -1em;
  }
}
</style>



// path[0] =
//         quaternion[0] * dm[0] -
//         quaternion[1] * dm[1] -
//         quaternion[2] * dm[2] -
//         quaternion[3] * dm[3];
//       path[1] =
//         quaternion[1] * dm[0] +
//         quaternion[0] * dm[1] +
//         quaternion[3] * dm[2] -
//         quaternion[2] * dm[3];
//       path[2] =
//         quaternion[2] * dm[0] +
//         quaternion[0] * dm[2] +
//         quaternion[3] * dm[1] -
//         quaternion[1] * dm[3];
//       path[3] =
//         quaternion[3] * dm[0] -
//         quaternion[0] * dm[3] +
//         quaternion[1] * dm[2] -
//         quaternion[3] * dm[1];
//       output[0] =
//         path[0] * quaternion[0] -
//         path[1] * -quaternion[1] -
//         path[2] * -quaternion[2] -
//         path[3] * -quaternion[3];
//       output[1] =
//         path[1] * quaternion[0] +
//         path[0] * -quaternion[1] +
//         path[3] * -quaternion[2] -
//         path[2] * -quaternion[3];
//       output[2] =
//         path[2] * quaternion[0] +
//         path[0] * -quaternion[2] +
//         path[3] * -quaternion[1] -
//         path[1] * -quaternion[3];
//       output[3] =
//         path[3] * quaternion[0] -
//         path[0] * -quaternion[3] +
//         path[1] * -quaternion[2] -
//         path[3] * -quaternion[1];