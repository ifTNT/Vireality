// This is the main function of vireality.
// It's loaded by bootloader.
// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from "vue";
import App from "./App";
import router from "./router";
import "./service_worker_workbox";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faPlayCircle } from "@fortawesome/free-solid-svg-icons/faPlayCircle";
import { faUser } from "@fortawesome/free-solid-svg-icons/faUser";
import { faCommentAlt } from "@fortawesome/free-solid-svg-icons/faCommentAlt";
import { faChevronLeft } from "@fortawesome/free-solid-svg-icons/faChevronLeft";
import { faUpload } from "@fortawesome/free-solid-svg-icons/faUpload";
import { faTimesCircle } from "@fortawesome/free-solid-svg-icons/faTimesCircle";
// Not used libraries of font-awesone
//import { fas } from '@fortawesome/free-solid-svg-icons'
//import { far } from '@fortawesome/free-regular-svg-icons'
//import { fab } from '@fortawesome/free-brands-svg-icons'
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

export function init() {
  library.add(faPlayCircle);
  library.add(faUser);
  library.add(faCommentAlt);
  library.add(faChevronLeft);
  library.add(faUpload);
  library.add(faTimesCircle);
  Vue.component("font-awesome-icon", FontAwesomeIcon);
  Vue.config.productionTip = false;

  new Vue({
    el: "#app",
    router,
    components: { App },
    template: "<app />"
  });
}
