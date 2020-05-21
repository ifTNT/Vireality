<template>
  <div id="wrap">
    <nav v-for="(src,index) in listShowFriend" :key="index" :style="styleList[index]">
      <proPic :diameter="parentDiameter" :Id="src[0]"></proPic>
    </nav>
  </div>
</template>
<script>
import axios from "axios";
import ProPic from "./profile_picture.vue";
export default {
  name: "friendListAround",
  data() {
    return {
      friendRad: [],
      listShowFriend: [],
      getFrientFlag: false,
      parentDiameter: "2em",
      styleList: []
    };
  },
  components: {
    // 新增大頭照的components tag命名為proPic
    proPic: ProPic
  },
  mounted() {
    this.getFriends();
  },
  methods: {
    // test() {
    //   this.sensorStarter();
    // },
    show() {
      this.styleList.length = 0;
      this.listShowFriend.forEach(index => {
        this.styleList.push(`left: ${(100 * (1 - index)) / 2}%`);
      });
    },
    sensorStarter() {
      const options = { frequency: 60, referenceFrame: "device" };
      const sensor = new AbsoluteOrientationSensor(options);

      sensor.addEventListener("reading", () => {
        // model is a Three.js object instantiated elsewhere.
        // model.quaternion.fromArray(sensor.quaternion).inverse();
        this.decideAxis(sensor.quaternion);
      });
      sensor.addEventListener("error", error => {
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
        console.log("AAAAA");
      } else {
        radXY = Math.acos(
          xNumber / Math.sqrt(Math.pow(xNumber, 2) + Math.pow(yNumber, 2))
        );
        console.log("BBBBB");
      }
      this.appendOnScreen(radXY);
    },
    getFriends() {
      axios
        .get(server.apiUrl("/user/friend_direction"))
        .then(response => {
          if (response.data.ok === "true") {
            this.friendRad = response.data.result;
            console.log(this.friendRad);
            this.getFrientFlag = true;
          } else {
            console.log("can't get friend place without ok");
            getFriends();
          }
        })
        .catch(response => {
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
      radDevice.push(radXY + Math.PI / 6); //大於零的部分
      if (radXY < Math.PI / 6) {
        radDevice.push((Math.PI * 11) / 6 + radXY); //2*Math.PI-Math.PI/6+radXY
      } else {
        radDevice.push(radXY - Math.PI / 6);
      }

      console.log(radDevice);
      while (true) {
        if (this.getFrientFlag === true) {
          this.friendRad.forEach(element => {
            console.log(element);
            if (
              element["dir"] <= radDevice[0] &&
              element["dir"] >= radDevice[1]
            ) {
              listToShow.push([element["id"], Math.cos(element["dir"])]);
            }
          });
          this.listShowFriend = listToShow;
          break;
        }
      }
      // console.log(listToShow);
    }
  }
};
</script>

<style scoped lang="stylus">
.wrap {
  position: relative;
  width: 100%;
  padding: 0% 2% 0% 2%;

  nav {
    position: absolute;
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