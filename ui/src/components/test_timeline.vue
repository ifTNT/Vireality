<template>
  <div>
    <time-line v-bind:date="timestamp" />
    <div v-on:click="timestamp+=86400000">+</div>
    <div v-on:click="timestamp-=86400000">-</div>
  </div>
</template>

<script>
import TimeLine from "./timeline.vue";
export default {
  name: "test_timeline",
  data: () => ({
    timestamp: 1588169222567
  }),
  components: {
    timeLine: TimeLine
  }
};
</script>

<style scoped lang="stylus"></style>