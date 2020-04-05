import Vue from 'vue'
import Router from 'vue-router'
import ARView from '@/components/ar'
import ListRoute from '@/components/list_route'
import Article from '@/components/article'
import TimeLine from '@/components/timeline'

Vue.use(Router)

const AppName = 'Vireality'

let router = new Router({
  routes: [
    {
      path: '/',
      name: 'Developing Index',
      component: ListRoute
    },
    {
      path: '/ar_example',
      name: 'AR example',
      component: ARView
    },
    {
      path: '/article',
      name: 'Article',
      component: Article
    },
    //==========test================
    {
      path: '/timeline',
      name: 'feef',
      component: TimeLine
    }
    //=======end test===============
  ]
})

router.beforeEach((to, from, next) => {
  document.title = `${AppName} - ${to.name}`;
  next()
})

export default router;