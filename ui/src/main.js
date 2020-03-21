// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import ARComponent from './components/ar-component.vue'
import router from './router'

new Vue({
  el: "#my-app",
  components: { "ar-component": ARComponent }
});