<template>
  <div class="center" :style="cube_style">
    <div class="cube">
      <div class="top"></div>
      <div class="right"></div>
      <div class="bottom"></div>
      <div class="left"></div>
      <div class="front"></div>
      <div class="back">Vireality</div>
    </div>
    <div class="shadow"></div>
    <div class="text">{{ text }}</div>
  </div>
</template>
<script>
export default {
  name: "loading",
  props: {
    // The scale fraction of whole component
    scale: {
      type: Number,
      default: 1,
    },
    // The text that will be displaied at the bottom of the shadow
    text: {
      type: String,
      default: "",
    },
    stickToBottom: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {};
  },
  computed: {
    cube_style() {
      return {
        "transform-origin": this.stickToBottom ? "bottom left" : "top left",
        transform: `scale(${this.scale})`,
        width: `${200 * this.scale}px`,
        "margin-left": `${100 * this.scale}px`,
      };
    },
  },
  methods: {},
};
</script>
<style scoped>
* {
  margin: 0px;
  padding: 0px;
}

html,
body {
  width: 100%;
  height: 100%;
}

.center {
  width: 200px;
  height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: "Audiowide", cursive;
}

.cube {
  -webkit-transform-style: preserve-3d;
  -webkit-animation: spin 1.5s infinite ease-in-out;
  position: relative;
  width: 100px;
  height: 100px;
  z-index: 10;
}

.cube div {
  width: 100px;
  height: 100px;
  box-sizing: border-box;
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  border: solid 2px white;
  background: #45818ed0;
  color: white;
}

.cube div.top {
  -webkit-transform: rotateX(90deg);
  margin-top: -50px;
}

.cube div.right {
  -webkit-transform: rotateY(90deg);
  margin-left: 50px;
}

.cube div.bottom {
  -webkit-transform: rotateX(-90deg);
  margin-top: 50px;
}

.cube div.left {
  -webkit-transform: rotateY(-90deg);
  margin-left: -50px;
}

.cube div.front {
  -webkit-transform: translateZ(50px);
}

.cube div.back {
  -webkit-transform: translateZ(-50px) rotateX(180deg);
}

.shadow {
  width: 150px;
  height: 50px;
  margin-top: 150px;
  border-radius: 50%;
  background: #d0e0e3;
  -webkit-animation: scale 1.5s infinite ease-in-out;
}

.text {
  margin-top: 2em;
}

@-webkit-keyframes spin {
  0% {
    -webkit-transform: rotateX(-20deg) rotateY(-140deg) rotateZ(200deg);
    top: 50%;
  }
  50% {
    top: 00%;
  }
  100% {
    -webkit-transform: rotateX(-20deg) rotateY(-140deg) rotateZ(560deg);
    top: 50%;
  }
}

@-webkit-keyframes scale {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.5);
  }
  100% {
    transform: scale(1);
  }
}
</style>