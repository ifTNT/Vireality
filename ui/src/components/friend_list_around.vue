<template>
  <div class="wrap"></div>
</template>
<script>
export default {
  name: "friendListAround",
  data() {
    return {
      friendRad: [],
      listShowFriend: []
    };
  },
  mounted() {
    this.test();
  },
  methods: {
    sensorStarter() {
      const options = { frequency: 60, referenceFrame: "device" };
      const sensor = new AbsoluteOrientationSensor(options);

      sensor.addEventListener("reading", () => {
        // model is a Three.js object instantiated elsewhere.
        model.quaternion.fromArray(sensor.quaternion).inverse();
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
    decideAxis(quaternion) {
      const dy = [0, 0, 1, 0];
      const dz = [0, 0, 0, 1];
      var path = [];
      var outputY = [];
      var outputZ = [];
      path[0] =
        quaternion[0] * dy[0] -
        quaternion[1] * dy[1] -
        quaternion[2] * dy[2] -
        quaternion[3] * dy[3];
      path[1] =
        quaternion[1] * dy[0] +
        quaternion[0] * dy[1] +
        quaternion[3] * dy[2] -
        quaternion[2] * dy[3];
      path[2] =
        quaternion[2] * dy[0] +
        quaternion[0] * dy[2] +
        quaternion[3] * dy[1] -
        quaternion[1] * dy[3];
      path[3] =
        quaternion[3] * dy[0] -
        quaternion[0] * dy[3] +
        quaternion[1] * dy[2] -
        quaternion[3] * dy[1];
      outputY[0] =
        path[0] * quaternion[0] -
        path[1] * -quaternion[1] -
        path[2] * -quaternion[2] -
        path[3] * -quaternion[3];
      outputY[1] =
        path[1] * quaternion[0] +
        path[0] * -quaternion[1] +
        path[3] * -quaternion[2] -
        path[2] * -quaternion[3];
      outputY[2] =
        path[2] * quaternion[0] +
        path[0] * -quaternion[2] +
        path[3] * -quaternion[1] -
        path[1] * -quaternion[3];
      outputY[3] =
        path[3] * quaternion[0] -
        path[0] * -quaternion[3] +
        path[1] * -quaternion[2] -
        path[3] * -quaternion[1];

      path[0] =
        quaternion[0] * dz[0] -
        quaternion[1] * dz[1] -
        quaternion[2] * dz[2] -
        quaternion[3] * dz[3];
      path[1] =
        quaternion[1] * dz[0] +
        quaternion[0] * dz[1] +
        quaternion[3] * dz[2] -
        quaternion[2] * dz[3];
      path[2] =
        quaternion[2] * dz[0] +
        quaternion[0] * dz[2] +
        quaternion[3] * dz[1] -
        quaternion[1] * dz[3];
      path[3] =
        quaternion[3] * dz[0] -
        quaternion[0] * dz[3] +
        quaternion[1] * dz[2] -
        quaternion[3] * dz[1];
      outputZ[0] =
        path[0] * quaternion[0] -
        path[1] * -quaternion[1] -
        path[2] * -quaternion[2] -
        path[3] * -quaternion[3];
      outputZ[1] =
        path[1] * quaternion[0] +
        path[0] * -quaternion[1] +
        path[3] * -quaternion[2] -
        path[2] * -quaternion[3];
      outputZ[2] =
        path[2] * quaternion[0] +
        path[0] * -quaternion[2] +
        path[3] * -quaternion[1] -
        path[1] * -quaternion[3];
      outputZ[3] =
        path[3] * quaternion[0] -
        path[0] * -quaternion[3] +
        path[1] * -quaternion[2] -
        path[3] * -quaternion[1];

      // (0,0,y,z)為投影在大地yz平面上，取abs(z/y)值較小者為所要的軸
      // 當z軸為所取之軸時要將得到值加上負號，-z

      var axisY = Math.abs(outputY[2] / outputY[3]);
      var axisZ = Math.abs(outputZ[2] / outputZ[3]);
      if (axisY <= axisZ) {
        this.xy(outputY[1], outputY[2]);
      } else {
        this.xy(outputZ[1], -outputZ[3]);
      }
    },
    xy(xNumber, yNumber) {
      var radXY;
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
        .get("/user/friend_direction")
        .then(response => {
          if (response["ok"] === "true") {
            this.friendRad = response["result"];
          } else {
            console.log("can't get friend place without ok");
            getFriends();
          }
        })
        .catch(response => {
          console.log("can't get friends place");
          console.log(response);
          // getFriends()
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
      listShowFriend = listToShow;
    }
  }
};
</script>

<style scoped lang="stylus"></style>
