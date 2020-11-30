// This is the main function of vireality.
// It's loaded by bootloader.
// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from "vue";
import axios from "axios";
import VueAxios from "vue-axios";
import App from "./App";
import router from "./router";
import "./service_worker_workbox";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faPlayCircle } from "@fortawesome/free-solid-svg-icons/faPlayCircle";
import { faUser } from "@fortawesome/free-solid-svg-icons/faUser";
import { faCommentAlt } from "@fortawesome/free-solid-svg-icons/faCommentAlt";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons/faChevronLeft";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons/faChevronRight";
import { faUpload } from "@fortawesome/free-solid-svg-icons/faUpload";
import { faTimesCircle } from "@fortawesome/free-solid-svg-icons/faTimesCircle";
import { faTimes } from "@fortawesome/free-solid-svg-icons/faTimes";
import { faSignOutAlt } from "@fortawesome/free-solid-svg-icons/faSignOutAlt";
// Not used libraries of font-awesone
//import { fas } from '@fortawesome/free-solid-svg-icons'
//import { far } from '@fortawesome/free-regular-svg-icons'
//import { fab } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import store from "./store";
import {initFirebase} from "./lib/firebase_config"

export function init() {
  initFirebase();

  library.add(faPlayCircle);
  library.add(faUser);
  library.add(faCommentAlt);
  library.add(faChevronLeft);
  library.add(faChevronRight);
  library.add(faUpload);
  library.add(faTimesCircle);
  library.add(faTimes);
  library.add(faSignOutAlt);
  Vue.component("font-awesome-icon", FontAwesomeIcon);
  Vue.config.productionTip = false;

  // Setup axios to support send cookie
  axios.defaults.withCredentials = true;
  Vue.use(VueAxios, axios);

  new Vue({
    el: "#app",
    store,
    router,
    components: { App },
    template: "<app />"
  });
}
