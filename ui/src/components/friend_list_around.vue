<template>
  <div class="wrap">
    <li v-for="item in listShowFriend" v-bind:key="item.friendId" :style="{left:item.friendDir}">
      <!-- {{item.friendId}} -->
      <nav class="eacItem">
        <!-- click it go to the personal page -->
        <proPic :diameter="parentDiameter" :Id="item.friendId"></proPic>
      </nav>
    </li>
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
      parentDiameter: "2em"
    };
  },
  components: {
    // 新增大頭照的components tag命名為proPic
    proPic: ProPic
  },
  mounted() {
    this.getFriends(), this.sensorStarter();
  },
  methods: {
    sensorStarter() {
      this.decideAxis([0, 1, 0.1, 0.1]);
      // const options = { frequency: 60, referenceFrame: "device" };
      // const sensor = new AbsoluteOrientationSensor(options);

      // sensor.addEventListener("reading", () => {
      //   // model is a Three.js object instantiated elsewhere.
      //   // model.quaternion.fromArray(sensor.quaternion).inverse();
      //   this.decideAxis(sensor.quaternion);
      // });
      // sensor.addEventListener("error", error => {
      //   if (event.error.name == "NotReadableError") {
      //     console.log("Sensor is not available.");
      //   }
      // });
      // sensor.start();
      // console.log(sensor);
      // console.log("test");
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
        console.log("axisY"+axisY)
      } else {
        this.xy(outputZ[1], -outputZ[3]);
        console.log("axisZ"+axisZ)
      }
    },
    xy(xNumber, yNumber) {
      var radXY;
      if (yNumber < 0) {
        radXY =
          Math.acos(
            xNumber / Math.sqrt(Math.pow(xNumber, 2) + Math.pow(yNumber, 2))
          ) + Math.PI;
        console.log("<")
      } else {
        radXY = Math.acos(
          xNumber / Math.sqrt(Math.pow(xNumber, 2) + Math.pow(yNumber, 2))
        );
        console.log("else")
      }
      this.appendOnScreen(radXY);
    },
    getFriends() {
      this.friendRad = [
        {
          friendId: "a123",
          friendDir: Math.PI / 6
        },
        {
          friendId: "b1234",
          friendDir: (Math.PI / 6) * 1.2
        },
        {
          friendId: "c12345",
          friendDir: (Math.PI / 6) * 1.4
        },
        {
          friendId: "d123456",
          friendDir: (Math.PI / 6) * 1.6
        },
        {
          friendId: "e1234567",
          friendDir: (Math.PI / 6) * 1.8
        }
      ];
      console.log(this.friendRad[1].friendDir);
      // axios
      //   .get("/user/friend_direction")
      //   .then(response => {
      //     if (response["ok"] === "true") {
      //       this.friendRad = response["result"];
      //     } else {
      //       console.log("can't get friend place without ok");
      //       getFriends();
      //     }
      //   })
      //   .catch(response => {
      //     console.log("can't get friends place");
      //     console.log(response);
      //     // getFriends()
      //   });
    },
    appendOnScreen(radXY) {
      // test
      this.friendRad = [
        {
          friendId: "a123",
          friendDir: Math.PI / 6
        },
        {
          friendId: "b1234",
          friendDir: (Math.PI / 6) * 1.2
        },
        {
          friendId: "c12345",
          friendDir: (Math.PI / 6) * 1.4
        },
        {
          friendId: "d123456",
          friendDir: (Math.PI / 6) * 1.6
        },
        {
          friendId: "e1234567",
          friendDir: (Math.PI / 6) * 1.8
        }
      ];
      // end test
      var listToShow = [];
      this.friendRad.forEach(element => {
        console.log(radXY);
        console.log(element.friendDir)
        if (
          element.friendDir <= radXY + Math.PI / 6 &&
          element.friendDir >= radXY - Math.PI / 6
        ) {
          listToShow.push({
            friendId: element.friendId,
            friendDir: Math.cos(radXY - element.friendDir)
          });
          console.log("in 1");
        } else if (radXY < Math.PI / 6) {
          if (element.friendDir > (Math.PI * 11) / 6 + radXY) {
            listToShow.push({
              friendId: element.friendId,
              friendDir: Math.cos(
                element.friendDir - (Math.PI * 11) / 6 + radXY
              )
            });
            console.log("in 2");
          }
          console.log("in 2 failed");
        } else if (radXY > (Math.PI * 11) / 6) {
          if (element.friendDir < 2 * Math.PI - radXY) {
            listToShow.push({
              friendId: element.friendId,
              friendDir: Math.cos(element.friendDir + 2 * Math.PI - radXY)
            });
            console.log("in 3");
          }
          console.log("in 3 failed");
        } else {
          console.log("all failes");
        }
        console.log(listToShow);
      });
      this.listShowFriend = listToShow;
      console.log(listToShow[2]);
    }
  }
};
</script>

<style scoped lang="stylus">
.wrap {
  width: 100%;
  position: relative;

  li {
    display: inline-block;
    position: absolute;
  }
}
</style>