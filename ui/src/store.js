const store = new Vuex.Store({
  state: {
    articles: {},
    loaded_article_id: new Set([])
    geolocation: {
      longitude: 0,
      latitude: 0,
      accuracy: 1e6,
    }
  },
  mutations: {
    add_article: (state, data) => {
      state.articles[data.id] = {
        visible: false,
        date: data.date
      }
    }
    show_article: (state, id) => {
      if(id in articles){
        state.articles[id].visible = true;
      }
    },
    hide_article: (state, id) => {
      if(id in articles){
        state.articles[id].visible = false;
      }
    }
  },
  getters: {
    get_all_article (state) => state.articles;
    get_article (state) => (id) => state.articles[id];
  }
})

export default store;