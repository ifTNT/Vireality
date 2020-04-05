<template>
  <div class="content" ref="content">
    <video autoplay ref="capture"></video>
  </div>
</template>

<script>
export default {
  name: "camera",
  props: {
      'height': window.innerHeight
  },
  data() {
    return {
        cameraReady: false
    };
  },
  mounted() {
      this.initCamera();
  },
  methods: {
    initCamera: function() {
      var self = this;
      this.getCameraStream(function() {
        self.cameraReady = true;
      });
    },
    getCameraStream: function(callback) {
      if (navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({
            video: {
              //width: window.innerWidth,
              height: { min: this.height },
              facingMode: { exact: "environment" }
            }
          })
          .then(
            function(stream) {
              this.$refs.capture.srcObject = stream;
              callback();
            }.bind(this)
          )
          .catch(function(error) {
            //console.log(error);
            console.log(`Get webcam error:\n  ${error.name}:${error.constraint}`);
          });
      }
    }
  }
};
</script>

<style scoped lang="stylus">
.content
    overflow hidden
    width 100%
</style>
