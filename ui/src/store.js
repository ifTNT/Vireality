import Vuex from "vuex";
import Vue from "vue";
Vue.use(Vuex);

const store = new Vuex.Store({
  state: {
    articles: {},
    loaded_article_id: new Set([]),
    geolocation: {
      longitude: 0,
      latitude: 0,
      accuracy: 1e6
    },
    user_id: undefined
  },
  mutations: {
    add_article(state, data) {
      state.articles[data.id] = {
        visible: true,
        post_time: data.post_time
      };
    },
    show_article(state, id) {
      if (id in state.articles) {
        state.articles[id].visible = true;
      }
    },
    hide_article(state, id) {
      if (id in state.articles) {
        state.articles[id].visible = false;
      }
    },
    show_all_articles(state) {
      for (let id in state.articles) {
        state.articles[id].visible = true;
      }
    },
    set_geolocation(state, data) {
      state.geolocation.latitude = data.latitude;
      state.geolocation.longitude = data.longitude;
      state.geolocation.accuracy = data.accuracy;
    },
    set_user_id(state, user_id) {
      state.user_id = user_id;
    }
  }
  // getters: {
  //   get_article: state => id => state.articles[id]
  // }
});

export default store;
