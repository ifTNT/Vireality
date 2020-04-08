<template>
  <div class="container">
    <router-view />
  </div>
</template>

<script>
export default {
  name: "app",
};
</script>

<style scoped lang="stylus">
.container
  font-family "Microsoft JhengHei", "微軟正黑體", arial, sans-serif
  /* Reference: https://gist.github.com/hsleonis/55712b0eafc9b25f1944 */
  /* Adjust font size */
  font-size 100%
  -webkit-text-size-adjust 100%
  /* Font varient */
  font-variant-ligatures none
  -webkit-font-variant-ligatures none
  /* Smoothing */
  text-rendering optimizeLegibility
  -moz-osx-font-smoothing grayscale
  font-smoothing antialiased;
  -webkit-font-smoothing antialiased
  text-shadow rgba(0, 0, 0, 0.01) 0 0 1px
</style>
