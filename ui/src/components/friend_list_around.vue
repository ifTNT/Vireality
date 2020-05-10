<template>
  <div class="wrap"></div>
</template>
<script>
import axios from "axios";
export default {
  name: "friendListAround",
  data() {
    return {
      friendRad: [],
      listShowFriend: [],
      getFrientFlag: false
    };
  },
  mounted() {
    this.getFriends()
  },
  methods: {
    // test() {
    //   this.sensorStarter();
    // },
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
    caculateMatrix(quaternion,dm){
      var path = [];
      var output = [];
      let qx = quaternion[0];
      let qy = quaternion[1];
      let qz = quaternion[2];
      let qw = quaternion[3];
      path[0] =
        quaternion[0] * dm[0] -
        quaternion[1] * dm[1] -
        quaternion[2] * dm[2] -
        quaternion[3] * dm[3];
      path[1] =
        quaternion[1] * dm[0] +
        quaternion[0] * dm[1] +
        quaternion[3] * dm[2] -
        quaternion[2] * dm[3];
      path[2] =
        quaternion[2] * dm[0] +
        quaternion[0] * dm[2] +
        quaternion[3] * dm[1] -
        quaternion[1] * dm[3];
      path[3] =
        quaternion[3] * dm[0] -
        quaternion[0] * dm[3] +
        quaternion[1] * dm[2] -
        quaternion[3] * dm[1];
      output[0] =
        path[0] * quaternion[0] -
        path[1] * -quaternion[1] -
        path[2] * -quaternion[2] -
        path[3] * -quaternion[3];
      output[1] =
        path[1] * quaternion[0] +
        path[0] * -quaternion[1] +
        path[3] * -quaternion[2] -
        path[2] * -quaternion[3];
      output[2] =
        path[2] * quaternion[0] +
        path[0] * -quaternion[2] +
        path[3] * -quaternion[1] -
        path[1] * -quaternion[3];
      output[3] =
        path[3] * quaternion[0] -
        path[0] * -quaternion[3] +
        path[1] * -quaternion[2] -
        path[3] * -quaternion[1];
      return output;
    },
    decideAxis(quaternion) {
      const dy = [0, 1, 0, 0]; //x,y,z,w
      const dz = [0, 0, 1, 0];
      var outputY = this.caculateMatrix(quaternion,dy);
      var outputZ = this.caculateMatrix(quaternion,dz);
      // (0,0,y,z)為投影在大地yz平面上，取abs(z/y)值較小者為所要的軸
      // 當z軸為所取之軸時要將得到值加上負號，-z

      var axisY = Math.abs(outputY[1] / outputY[2]);
      var axisZ = Math.abs(outputZ[1] / outputZ[2]);
      console.log(outputY+"  "+outputZ)

      if (axisY <= axisZ) {
        this.xy(outputY[1], outputY[2]);
      } else {
        this.xy(outputZ[1], -outputZ[3]);
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
      } else {
        radXY = Math.acos(
          xNumber / Math.sqrt(Math.pow(xNumber, 2) + Math.pow(yNumber, 2))
        );
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
          // getFriends()
        })
        .then(() => {
          this.sensorStarter();
        });
    },
    appendOnScreen(radXY) {
      var listToShow = [];
      var radDevice = []; //has two num, first is deviceDeg + π/6, second is deviceDeg - π/6
      radDevice.push(radXY + Math.PI / 6);
      if (radXY < Math.PI / 6) {
        radDevice.push((Math.PI * 11) / 6 + radXY); //2*Math.PI-Math.PI/6+radXY
      } else {
        radDevice.push(radXY - Math.PI / 6);
      }
      this.friendRad.forEach(element => {
        if (element["dir"] <= radDevice[0] && element["dir"] >= radDevice[1]) {
          listToShow.push([element["id"], Math.cos(element["dir"])]);
        }
      });
      this.listShowFriend = listToShow;
      // console.log(this.listShowFriend);
    }
  }
};
</script>

<style scoped lang="stylus"></style>
